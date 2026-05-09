import {useState, useEffect, useCallback, useRef} from 'react';
import {spawn} from 'child_process';
import type {ChildProcessWithoutNullStreams} from 'child_process';
import {v4 as uuidv4} from 'uuid';
import {BACKEND_MAIN, BACKEND_PYTHON} from '../utils/paths.js';
import {logger} from '../utils/logger.js';
import type {BackendRequest, BackendResponse} from '../types/index.js';

type PendingResolve = (chunk: BackendResponse) => void;

export interface UseBackendReturn {
	isReady: boolean;
	send: (req: Omit<BackendRequest, 'id'>) => string; // returns request id
	onChunk: (
		id: string,
		handler: (chunk: BackendResponse) => void,
	) => () => void;
	setEnvVar: (key: string, value: string) => void;
	fetchModels: (provider: string) => Promise<any[]>;
	error: string | null;
}

export function useBackend(): UseBackendReturn {
	const [isReady, setIsReady] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const procRef = useRef<ChildProcessWithoutNullStreams | null>(null);
	const handlersRef = useRef<Map<string, PendingResolve[]>>(new Map());
	const bufferRef = useRef<string>('');

	useEffect(() => {
		logger.info('Spawning backend', {cmd: BACKEND_PYTHON, script: BACKEND_MAIN});

		const proc = spawn(BACKEND_PYTHON, [BACKEND_MAIN], {
			stdio: ['pipe', 'pipe', 'pipe'],
			// Inherit full process.env so API keys injected via keystore are available
			env: {...process.env},
		});

		procRef.current = proc;

		proc.stdout.on('data', (chunk: Buffer) => {
			bufferRef.current += chunk.toString('utf8');
			const lines = bufferRef.current.split('\n');
			bufferRef.current = lines.pop() ?? '';

			for (const line of lines) {
				const trimmed = line.trim();
				if (!trimmed) continue;
				try {
					const msg = JSON.parse(trimmed) as BackendResponse;
					if (msg.id === 'init' && msg.type === 'ack') {
						setIsReady(true);
					}

					const handlers = handlersRef.current.get(msg.id) ?? [];
					for (const h of handlers) h(msg);
					if (msg.type === 'final' || msg.type === 'error' || msg.type === 'ack') {
						handlersRef.current.delete(msg.id);
					}
				} catch {
					logger.warn('Backend non-JSON stdout', {line: trimmed});
				}
			}
		});

		proc.stderr.on('data', (d: Buffer) => {
			logger.warn('Backend stderr', {msg: d.toString()});
		});

		proc.on('error', err => {
			setError(`Failed to spawn Python backend: ${err.message}`);
			logger.error('Backend spawn error', err);
		});

		proc.on('exit', (code, signal) => {
			logger.info('Backend exited', {code, signal});
			setIsReady(false);
		});

		return () => {
			proc.stdin.write(
				JSON.stringify({id: uuidv4(), type: 'system', content: 'shutdown'}) +
					'\n',
			);
			proc.kill();
		};
	}, []);

	const send = useCallback((req: Omit<BackendRequest, 'id'>): string => {
		const id = uuidv4();
		const full: BackendRequest = {...req, id};
		const line = JSON.stringify(full) + '\n';
		procRef.current?.stdin.write(line);
		return id;
	}, []);

	const onChunk = useCallback(
		(id: string, handler: (chunk: BackendResponse) => void) => {
			const existing = handlersRef.current.get(id) ?? [];
			handlersRef.current.set(id, [...existing, handler]);
			return () => {
				const hs = handlersRef.current.get(id) ?? [];
				handlersRef.current.set(
					id,
					hs.filter(h => h !== handler),
				);
			};
		},
		[],
	);

	const setEnvVar = useCallback(
		(key: string, value: string) => {
			// Update process.env locally
			process.env[key] = value;
			// Send setenv to the running Python backend
			if (procRef.current?.stdin.writable) {
				const msg = JSON.stringify({
					id: uuidv4(),
					type: 'system',
					content: 'set_env',
					meta: {key, value},
				});
				procRef.current.stdin.write(msg + '\n');
			}
		},
		[],
	);

	const fetchModels = useCallback(async (provider: string): Promise<any[]> => {
		return new Promise((resolve, reject) => {
			const id = uuidv4();
			const msg = JSON.stringify({
				id,
				type: 'system',
				content: 'list_models',
				meta: {provider},
			});

			const timeout = setTimeout(() => {
				handlersRef.current.delete(id);
				reject(new Error('fetchModels timeout'));
			}, 10000);

			const handler = (resp: BackendResponse) => {
				clearTimeout(timeout);
				if (resp.type === 'ack') {
					try {
						const data = JSON.parse(resp.content);
						resolve(data);
					} catch (e) {
						reject(new Error('Invalid response format from backend'));
					}
				} else if (resp.type === 'error') {
					reject(new Error(resp.content));
				}
			};

			const hs = handlersRef.current.get(id) ?? [];
			handlersRef.current.set(id, [...hs, handler]);
			procRef.current?.stdin.write(msg + '\n');
		});
	}, []);

	return {isReady, send, onChunk, setEnvVar, fetchModels, error};
}

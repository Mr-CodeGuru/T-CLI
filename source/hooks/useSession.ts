import {useState, useCallback} from 'react';
import {getDb} from '../db/index.js';
import {v4 as uuidv4} from 'uuid';
import type {Session, ChatMessage, Provider} from '../types/index.js';
import {logger} from '../utils/logger.js';

export interface UseSessionReturn {
	sessionId: string;
	sessions: Session[];
	loadSessions: () => void;
	saveSession: (name: string, messages: ChatMessage[], provider: Provider, model: string) => void;
	loadSession: (id: string) => ChatMessage[];
	deleteSession: (id: string) => void;
	currentSession: Session | null;
}

export function useSession(): UseSessionReturn {
	const [sessionId] = useState<string>(() => uuidv4());
	const [sessions, setSessions] = useState<Session[]>([]);
	const [currentSession, setCurrentSession] = useState<Session | null>(null);

	const loadSessions = useCallback(() => {
		try {
			const db = getDb();
			const rows = db
				.prepare(
					'SELECT id, name, provider, model, created_at, updated_at FROM sessions ORDER BY updated_at DESC LIMIT 50',
				)
				.all() as Array<{
				id: string;
				name: string;
				provider: string;
				model: string;
				created_at: number;
				updated_at: number;
			}>;
			setSessions(
				rows.map(r => ({
					id: r.id,
					name: r.name,
					provider: r.provider as Provider,
					model: r.model,
					createdAt: r.created_at,
					updatedAt: r.updated_at,
				})),
			);
		} catch (e) {
			logger.error('loadSessions failed', e);
		}
	}, []);

	const saveSession = useCallback(
		(
			name: string,
			messages: ChatMessage[],
			provider: Provider,
			model: string,
		) => {
			try {
				const db = getDb();
				const now = Date.now();
				const id = uuidv4();

				db.prepare(
					`INSERT INTO sessions(id, name, provider, model, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
				).run(id, name, provider, model, now, now);

				const insertMsg = db.prepare(
					`INSERT INTO messages(id, session_id, role, content, created_at, tokens)
           VALUES (?, ?, ?, ?, ?, ?)`,
				);
				const insertMany = db.transaction((msgs: ChatMessage[]) => {
					for (const m of msgs) {
						insertMsg.run(m.id, id, m.role, m.content, m.createdAt, m.tokens ?? 0);
					}
				});
				insertMany(messages);

				setCurrentSession({id, name, provider, model, createdAt: now, updatedAt: now});
				logger.info('Session saved', {id, name, messageCount: messages.length});
			} catch (e) {
				logger.error('saveSession failed', e);
			}
		},
		[],
	);

	const loadSession = useCallback((id: string): ChatMessage[] => {
		try {
			const db = getDb();
			const rows = db
				.prepare(
					'SELECT id, role, content, created_at, tokens FROM messages WHERE session_id = ? ORDER BY created_at ASC',
				)
				.all(id) as Array<{
				id: string;
				role: string;
				content: string;
				created_at: number;
				tokens: number;
			}>;

			const session = db
				.prepare('SELECT * FROM sessions WHERE id = ?')
				.get(id) as Session | undefined;
			if (session) setCurrentSession(session);

			return rows.map(r => ({
				id: r.id,
				role: r.role as ChatMessage['role'],
				content: r.content,
				createdAt: r.created_at,
				tokens: r.tokens,
			}));
		} catch (e) {
			logger.error('loadSession failed', e);
			return [];
		}
	}, []);

	const deleteSession = useCallback((id: string) => {
		try {
			const db = getDb();
			db.prepare('DELETE FROM sessions WHERE id = ?').run(id);
			setSessions(prev => prev.filter(s => s.id !== id));
		} catch (e) {
			logger.error('deleteSession failed', e);
		}
	}, []);

	return {
		sessionId,
		sessions,
		loadSessions,
		saveSession,
		loadSession,
		deleteSession,
		currentSession,
	};
}

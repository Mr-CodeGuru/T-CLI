import fs from 'fs';
import path from 'path';
import {PATHS} from './paths.js';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

function timestamp(): string {
	return new Date().toISOString();
}

function logFile(): string {
	const date = new Date().toISOString().split('T')[0]!;
	return path.join(PATHS.logs, `t-cli-${date}.log`);
}

function write(level: LogLevel, message: string, data?: unknown): void {
	try {
		const entry = {
			ts: timestamp(),
			level,
			message,
			...(data !== undefined ? {data} : {}),
		};
		fs.appendFileSync(logFile(), JSON.stringify(entry) + '\n');
	} catch {
		// Silently fail — logging must never crash the CLI
	}
}

export const logger = {
	info: (msg: string, data?: unknown) => write('info', msg, data),
	warn: (msg: string, data?: unknown) => write('warn', msg, data),
	error: (msg: string, data?: unknown) => write('error', msg, data),
	debug: (msg: string, data?: unknown) => write('debug', msg, data),
};

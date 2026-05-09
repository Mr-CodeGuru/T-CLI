import os from 'os';
import path from 'path';
import fs from 'fs';
import {fileURLToPath} from 'url';

export const HOME_DIR = os.homedir();
export const TCLI_DIR = path.join(HOME_DIR, '.mycli');

export const PATHS = {
	root: TCLI_DIR,
	sessions: path.join(TCLI_DIR, 'sessions'),
	models: path.join(TCLI_DIR, 'models'),
	themes: path.join(TCLI_DIR, 'themes'),
	providers: path.join(TCLI_DIR, 'providers'),
	logs: path.join(TCLI_DIR, 'logs'),
	cache: path.join(TCLI_DIR, 'cache'),
	db: path.join(TCLI_DIR, 't-cli.db'),
	quota: path.join(TCLI_DIR, 'quota.json'),
	env: path.join(TCLI_DIR, '.env'),
	config: path.join(TCLI_DIR, 'config.json'),
};

// Backend Python script path — from dist/utils/paths.js, ../../backend = project root/backend
const _thisDir = path.dirname(fileURLToPath(import.meta.url));
export const BACKEND_DIR = path.resolve(_thisDir, '../../backend');
export const BACKEND_MAIN = path.join(BACKEND_DIR, 'main.py');

// Prefer venv Python inside backend/, fall back to env override, then system python3
export const BACKEND_PYTHON = fs.existsSync(path.join(BACKEND_DIR, '.venv', 'bin', 'python3'))
	? path.join(BACKEND_DIR, '.venv', 'bin', 'python3')
	: (process.env['TCLI_PYTHON'] ?? 'python3');

/**
 * Ensure all ~/.mycli/* directories exist on startup.
 */
export function ensureDirectories(): void {
	const dirs = [
		PATHS.root,
		PATHS.sessions,
		PATHS.models,
		PATHS.themes,
		PATHS.providers,
		PATHS.logs,
		PATHS.cache,
	];
	for (const dir of dirs) {
		fs.mkdirSync(dir, {recursive: true});
	}
}

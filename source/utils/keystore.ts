/**
 * Keystore — reads/writes API keys to ~/.mycli/.env
 * Single source of truth for provider credentials.
 */
import fs from 'fs';
import {PATHS, ensureDirectories} from './paths.js';
import type {Provider} from '../types/index.js';

// Map provider id → env var name
export const PROVIDER_ENV_KEY: Record<Provider, string> = {
	openrouter: 'OPENROUTER_API_KEY',
	local: 'LOCAL_MODEL_PATH',
};

export const PROVIDER_KEY_LABEL: Record<Provider, string> = {
	openrouter: 'OpenRouter API Key',
	local: 'GGUF File Path',
};

export const PROVIDER_KEY_URL: Record<Provider, string> = {
	openrouter: 'https://openrouter.ai/keys',
	local: 'Provide the absolute path to your .gguf file',
};

export const PROVIDER_KEY_PLACEHOLDER: Record<Provider, string> = {
	openrouter: 'sk-or-v1-...',
	local: 'Enter local path of your .gguf model',
};

// ── File helpers ─────────────────────────────────────────────────────────────

export function readEnvFile(): Record<string, string> {
	try {
		const content = fs.readFileSync(PATHS.env, 'utf8');
		const result: Record<string, string> = {};
		for (const line of content.split('\n')) {
			const trimmed = line.trim();
			if (!trimmed || trimmed.startsWith('#')) continue;
			const eqIdx = trimmed.indexOf('=');
			if (eqIdx === -1) continue;
			const key = trimmed.slice(0, eqIdx).trim();
			const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
			if (key) result[key] = value;
		}

		return result;
	} catch {
		return {};
	}
}

export function writeEnvFile(vars: Record<string, string>): void {
	ensureDirectories();
	const lines = Object.entries(vars).map(([k, v]) => `${k}=${v}`);
	fs.writeFileSync(PATHS.env, lines.join('\n') + '\n', 'utf8');
}

// ── Provider key helpers ──────────────────────────────────────────────────────

export function getProviderKey(provider: Provider): string | undefined {
	const fileVars = readEnvFile();
	const envKey = PROVIDER_ENV_KEY[provider];
	return fileVars[envKey];
}

export function setProviderKey(provider: Provider, value: string): void {
	const envKey = PROVIDER_ENV_KEY[provider];
	const vars = readEnvFile();
	vars[envKey] = value;
	writeEnvFile(vars);
	// Inject into current process env immediately so backend spawn picks it up
	process.env[envKey] = value;
}

export function getConfiguredProviders(): Provider[] {
	return (Object.keys(PROVIDER_ENV_KEY) as Provider[]).filter(
		p => !!getProviderKey(p),
	);
}

export function hasAnyProvider(): boolean {
	const fileVars = readEnvFile();
	return (Object.keys(PROVIDER_ENV_KEY) as Provider[]).some(
		p => !!fileVars[PROVIDER_ENV_KEY[p]],
	);
}

/** Clear all stored keys (deletes .env file) */
export function clearAllKeys(): void {
	if (fs.existsSync(PATHS.env)) {
		fs.unlinkSync(PATHS.env);
	}
	// Clear from process.env memory too
	for (const key of Object.values(PROVIDER_ENV_KEY)) {
		delete process.env[key];
	}
}

/** Inject all .env file vars into process.env (called at startup) */
export function injectEnvIntoProcess(): void {
	const vars = readEnvFile();
	for (const [k, v] of Object.entries(vars)) {
		if (v) process.env[k] = v;
	}
}

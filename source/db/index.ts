import fs from 'fs';
import {PATHS} from '../utils/paths.js';
import {logger} from '../utils/logger.js';
import type {Session, ChatMessage, Provider, QuotaRecord} from '../types/index.js';

/**
 * Pure JS JSON Database Implementation
 * Replaces better-sqlite3 to avoid native compilation issues on new Node versions.
 */

interface DbSchema {
	sessions: Session[];
	messages: Record<string, ChatMessage[]>; // session_id -> messages
	quota: QuotaRecord[];
	config: Record<string, string>;
}

let _db: DbSchema | null = null;

function loadDb(): DbSchema {
	if (_db) return _db;
	
	const path = PATHS.db.replace('.db', '.json');
	try {
		if (fs.existsSync(path)) {
			const data = fs.readFileSync(path, 'utf8');
			_db = JSON.parse(data);
		}
	} catch (e) {
		logger.error('Failed to load JSON DB', e);
	}

	if (!_db) {
		_db = {
			sessions: [],
			messages: {},
			quota: [],
			config: {}
		};
	}
	return _db;
}

function saveDb(): void {
	if (!_db) return;
	const path = PATHS.db.replace('.db', '.json');
	try {
		fs.writeFileSync(path, JSON.stringify(_db, null, 2), 'utf8');
	} catch (e) {
		logger.error('Failed to save JSON DB', e);
	}
}

// ── Session Helpers ──────────────────────────────────────────────────────────

export function getAllSessions(): Session[] {
	const db = loadDb();
	return [...db.sessions].sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getSession(id: string): Session | undefined {
	const db = loadDb();
	return db.sessions.find(s => s.id === id);
}

export function insertSession(session: Session, messages: ChatMessage[]): void {
	const db = loadDb();
	db.sessions.push(session);
	db.messages[session.id] = messages;
	saveDb();
}

export function deleteSession(id: string): void {
	const db = loadDb();
	db.sessions = db.sessions.filter(s => s.id !== id);
	delete db.messages[id];
	saveDb();
}

export function getMessages(sessionId: string): ChatMessage[] {
	const db = loadDb();
	return db.messages[sessionId] || [];
}

// ── Quota Helpers ────────────────────────────────────────────────────────────

export function getQuota(date: string, provider: Provider): QuotaRecord | undefined {
	const db = loadDb();
	return db.quota.find(q => q.date === date && q.provider === provider);
}

export function upsertQuota(record: QuotaRecord): void {
	const db = loadDb();
	const idx = db.quota.findIndex(q => q.date === record.date && q.provider === record.provider && q.model === record.model);
	if (idx >= 0) {
		db.quota[idx] = record;
	} else {
		db.quota.push(record);
	}
	saveDb();
}

export function getAllQuota(): QuotaRecord[] {
	const db = loadDb();
	return [...db.quota];
}

// ── Config Helpers ────────────────────────────────────────────────────────────

export function getConfig(key: string, fallback?: string): string | undefined {
	const db = loadDb();
	return db.config[key] ?? fallback;
}

export function setConfig(key: string, value: string): void {
	const db = loadDb();
	db.config[key] = value;
	saveDb();
}

// Legacy export for app.tsx startup check
export function getDb(): any {
	return loadDb();
}

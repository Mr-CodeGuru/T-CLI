import Database from 'better-sqlite3';
import {PATHS} from '../utils/paths.js';
import {logger} from '../utils/logger.js';

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
	if (_db) return _db;

	_db = new Database(PATHS.db);
	_db.pragma('journal_mode = WAL');
	_db.pragma('foreign_keys = ON');
	migrate(_db);
	return _db;
}

function migrate(db: Database.Database): void {
	db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      provider    TEXT NOT NULL DEFAULT 'gemini',
      model       TEXT NOT NULL DEFAULT 'gemini-1.5-flash',
      created_at  INTEGER NOT NULL,
      updated_at  INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
      id          TEXT PRIMARY KEY,
      session_id  TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      role        TEXT NOT NULL CHECK(role IN ('user','assistant','system')),
      content     TEXT NOT NULL,
      created_at  INTEGER NOT NULL,
      tokens      INTEGER DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id, created_at);

    CREATE TABLE IF NOT EXISTS quota (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      provider            TEXT NOT NULL,
      model               TEXT NOT NULL,
      prompt_tokens       INTEGER DEFAULT 0,
      completion_tokens   INTEGER DEFAULT 0,
      reasoning_tokens    INTEGER DEFAULT 0,
      requests            INTEGER DEFAULT 0,
      date                TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_quota_date ON quota(date, provider);

    CREATE TABLE IF NOT EXISTS config (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

	// Ensure reasoning_tokens column exists (for older DBs)
	try {
		db.prepare(
			'ALTER TABLE quota ADD COLUMN reasoning_tokens INTEGER DEFAULT 0',
		).run();
	} catch (e) {
		// Ignore if already exists
	}

	logger.info('DB migrations applied');
}

// ── Config helpers ────────────────────────────────────────────────────────────

export function getConfig(key: string, fallback?: string): string | undefined {
	const db = getDb();
	const row = db.prepare('SELECT value FROM config WHERE key = ?').get(key) as
		| {value: string}
		| undefined;
	return row?.value ?? fallback;
}

export function setConfig(key: string, value: string): void {
	const db = getDb();
	db.prepare('INSERT OR REPLACE INTO config(key, value) VALUES (?, ?)').run(
		key,
		value,
	);
}

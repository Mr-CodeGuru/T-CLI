// ────────────────────────────────────────────────────────────────────────────
// T-CLI — Shared Types
// ────────────────────────────────────────────────────────────────────────────

export type Provider = 'openrouter' | 'local';

export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
	id: string;
	role: MessageRole;
	content: string;
	createdAt: number;
	tokens?: number;
	isStreaming?: boolean;
	model?: string;
}

export interface Session {
	id: string;
	name: string;
	provider: Provider;
	model: string;
	createdAt: number;
	updatedAt: number;
	messages?: ChatMessage[];
}

// ── Backend Protocol ─────────────────────────────────────────────────────────

export interface BackendRequest {
	id: string;
	type: 'chat' | 'command' | 'system';
	content: string;
	meta: {
		provider: Provider;
		model: string;
		stream: boolean;
		history: Array<{role: MessageRole; content: string}>;
		sessionId?: string;
	};
}

export interface BackendResponse {
	id: string;
	type: 'stream' | 'final' | 'error' | 'ack';
	content: string;
	usage?: {
		prompt_tokens: number;
		completion_tokens: number;
		latency_ms: number;
		reasoning_tokens?: number;
	};
}

// ── Quota ────────────────────────────────────────────────────────────────────

export interface QuotaRecord {
	provider: Provider;
	model: string;
	promptTokens: number;
	completionTokens: number;
	reasoningTokens?: number;
	requests: number;
	date: string;
}

export interface SessionQuota {
	promptTokens: number;
	completionTokens: number;
	reasoning_tokens?: number;
	requests: number;
	latencyMs: number[];
}

// ── Theme ────────────────────────────────────────────────────────────────────

export type BorderStyle =
	| 'single'
	| 'double'
	| 'round'
	| 'bold'
	| 'singleDouble'
	| 'doubleSingle'
	| 'classic'
	| 'arrow';

export interface Theme {
	name: string;
	displayName: string;
	// Palette
	primary: string;
	secondary: string;
	accent: string;
	muted: string;
	error: string;
	success: string;
	warning: string;
	// UI chrome
	userPrefix: string;
	aiPrefix: string;
	borderStyle: BorderStyle;
	// Code
	codeBg: string;
	// Status bar
	statusBg: string;
}

// ── App State ────────────────────────────────────────────────────────────────

export type ActivePanel =
	| 'chat'
	| 'help'
	| 'theme'
	| 'sessions'
	| 'quota'
	| 'providers'
	| 'models'
	| 'memory';

export interface AppState {
	activePanel: ActivePanel;
	provider: Provider;
	model: string;
	sessionId: string;
	themeName: string;
	isBackendReady: boolean;
}

// ── Model Metadata ────────────────────────────────────────────────────────────

export interface ModelInfo {
	id: string;
	name: string;
	provider: Provider;
	contextWindow: number;
	supportsStreaming: boolean;
}

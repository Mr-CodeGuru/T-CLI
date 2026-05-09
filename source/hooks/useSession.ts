import {useState, useCallback} from 'react';
import {getAllSessions, getSession, insertSession, deleteSession, getMessages} from '../db/index.js';
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
			const rows = getAllSessions();
			setSessions(rows);
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
				const now = Date.now();
				const id = uuidv4();

				const session: Session = {
					id,
					name,
					provider,
					model,
					createdAt: now,
					updatedAt: now
				};

				insertSession(session, messages);
				setCurrentSession(session);
				logger.info('Session saved', {id, name, messageCount: messages.length});
			} catch (e) {
				logger.error('saveSession failed', e);
			}
		},
		[],
	);

	const loadSession = useCallback((id: string): ChatMessage[] => {
		try {
			const messages = getMessages(id);
			const session = getSession(id);
			if (session) setCurrentSession(session);
			return messages;
		} catch (e) {
			logger.error('loadSession failed', e);
			return [];
		}
	}, []);

	const _deleteSession = useCallback((id: string) => {
		try {
			deleteSession(id);
			setSessions(prev => prev.filter(s => s.id !== id));
		} catch (e) {
			logger.error('deleteSession failed', e);
		}
	}, []);

	return {
		sessionId,
		sessions,
		loadSessions: loadSessions,
		saveSession,
		loadSession,
		deleteSession: _deleteSession,
		currentSession,
	};
}

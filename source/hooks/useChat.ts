import React, {useState, useCallback, useRef} from 'react';
import {v4 as uuidv4} from 'uuid';
import type {
	ChatMessage,
	Provider,
	BackendResponse,
} from '../types/index.js';
import type {UseBackendReturn} from './useBackend.js';

export interface UseChatReturn {
	messages: ChatMessage[];
	isStreaming: boolean;
	sendMessage: (content: string) => void;
	clearMessages: () => void;
	setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

interface UseChatOptions {
	backend: UseBackendReturn;
	provider: Provider;
	model: string;
	sessionId: string;
	onUsage?: (prompt: number, completion: number, latency: number, reasoning?: number) => void;
}

export function useChat({
	backend,
	provider,
	model,
	sessionId,
	onUsage,
}: UseChatOptions): UseChatReturn {
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [isStreaming, setIsStreaming] = useState(false);
	const startTimeRef = useRef<number>(0);

	const sendMessage = useCallback(
		(content: string) => {
			if (!content.trim() || isStreaming) return;

			const userMsg: ChatMessage = {
				id: uuidv4(),
				role: 'user',
				content: content.trim(),
				createdAt: Date.now(),
			};

			const assistantId = uuidv4();
			const assistantMsg: ChatMessage = {
				id: assistantId,
				role: 'assistant',
				content: '',
				createdAt: Date.now(),
				isStreaming: true,
				model: model,
			};

			setMessages(prev => [...prev, userMsg, assistantMsg]);
			setIsStreaming(true);
			startTimeRef.current = Date.now();

			// Build history for context (excluding the placeholder assistant msg)
			const history = [...messages, userMsg].map(m => ({
				role: m.role,
				content: m.content,
			}));

			const reqId = backend.send({
				type: 'chat',
				content: content.trim(),
				meta: {provider, model, stream: true, history, sessionId},
			});

			const unsubscribe = backend.onChunk(reqId, (chunk: BackendResponse) => {
				if (chunk.type === 'stream') {
					setMessages(prev =>
						prev.map(m =>
							m.id === assistantId
								? {...m, content: m.content + chunk.content}
								: m,
						),
					);
				} else if (chunk.type === 'final') {
					const latency = Date.now() - startTimeRef.current;
					setMessages(prev =>
						prev.map(m =>
							m.id === assistantId
								? {
										...m,
										isStreaming: false,
										tokens: chunk.usage?.completion_tokens,
									}
								: m,
						),
					);
					setIsStreaming(false);
					if (chunk.usage) {
						onUsage?.(
							chunk.usage.prompt_tokens,
							chunk.usage.completion_tokens,
							latency,
							chunk.usage.reasoning_tokens,
						);
					}

					unsubscribe();
				} else if (chunk.type === 'error') {
					setMessages(prev =>
						prev.map(m =>
							m.id === assistantId
								? {
										...m,
										content: `Error: ${chunk.content}`,
										isStreaming: false,
									}
								: m,
						),
					);
					setIsStreaming(false);
					unsubscribe();
				}
			});
		},
		[backend, isStreaming, messages, model, onUsage, provider, sessionId],
	);

	const clearMessages = useCallback(() => {
		setMessages([]);
	}, []);

	return {messages, isStreaming, sendMessage, clearMessages, setMessages};
}

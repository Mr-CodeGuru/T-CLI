import React from 'react';
import {Box, Text, useInput} from 'ink';
import type {ChatMessage, Theme} from '../types/index.js';

interface MemoryPanelProps {
	theme: Theme;
	messages: ChatMessage[];
	onClose: () => void;
}

export function MemoryPanel({theme, messages, onClose}: MemoryPanelProps) {
	useInput((_input, key) => {
		if (key.escape || key.return) onClose();
	});

	const totalTokens = messages.reduce((sum, m) => sum + (m.tokens ?? 0), 0);

	return (
		<Box
			flexDirection="column"
			borderStyle={theme.borderStyle}
			borderColor={theme.secondary}
			paddingX={2}
			paddingY={1}
		>
			<Box marginBottom={1} justifyContent="space-between">
				<Text bold color={theme.secondary}>
					Conversation Memory
				</Text>
				<Text color={theme.muted}> — {messages.length} messages • {totalTokens} tokens • Esc close</Text>
			</Box>

			{messages.length === 0 ? (
				<Text color={theme.muted}>
					No messages in context yet.
				</Text>
			) : (
				messages.map((m, idx) => (
					<Box key={m.id} gap={2} paddingLeft={1} marginBottom={1}>
						<Text color={m.role === 'user' ? theme.secondary : theme.primary} bold>
							{m.role === 'user' ? 'USR' : 'AST'}
						</Text>
						<Text color={theme.muted}>
							#{idx + 1}
						</Text>
						<Text color={m.role === 'user' ? theme.secondary : theme.accent}>
							{m.content.slice(0, 80)}
							{m.content.length > 80 ? '…' : ''}
						</Text>
						{m.tokens && m.tokens > 0 ? (
							<Text color={theme.muted}>
								{m.tokens}t
							</Text>
						) : null}
					</Box>
				))
			)}
		</Box>
	);
}

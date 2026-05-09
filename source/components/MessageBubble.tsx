import React from 'react';
import {Box, Text} from 'ink';
import {StreamingText} from './StreamingText.js';
import {renderMarkdown} from '../utils/markdown.js';
import type {ChatMessage, Theme} from '../types/index.js';

interface MessageBubbleProps {
	message: ChatMessage;
	theme: Theme;
	provider?: string;
	model?: string;
}

export function MessageBubble({message, theme, provider, model}: MessageBubbleProps) {
	const isUser = message.role === 'user';
	
	// Dynamic prefix based on provider/model
	let prefix = isUser ? theme.userPrefix : theme.aiPrefix;
	if (!isUser && provider) {
		const pName = provider.charAt(0).toUpperCase() + provider.slice(1);
		prefix = `+ ${pName}`;
		
		// Use historical model saved in message if available, else current
		const activeModel = message.model || model;
		if (activeModel) {
			// Extract short model name if it's a slug
			const shortModel = activeModel.split('/').pop() || activeModel;
			prefix = `+ ${pName} (${shortModel})`;
		}
	}
	
	const prefixColor = isUser ? theme.secondary : theme.primary;

	return (
		<Box flexDirection="column" marginBottom={1}>
			{/* Prefix row */}
			<Box gap={1}>
				<Text bold color={prefixColor}>
					{prefix}
				</Text>
				{message.tokens !== undefined && message.tokens > 0 && !isUser && (
					<Text color={theme.muted}>
						{message.tokens} tok
					</Text>
				)}
			</Box>

			{/* Content */}
			<Box paddingLeft={2}>
				{isUser ? (
					<Text color={theme.secondary}>{message.content}</Text>
				) : message.isStreaming ? (
					<StreamingText
						content={message.content}
						color={theme.accent}
						isStreaming
					/>
				) : message.content.startsWith('Error:') ? (
					<Box borderStyle="round" borderColor={theme.error} paddingX={1}>
						<Text color={theme.error}>{message.content.replace('Error:', '').trim()}</Text>
					</Box>
				) : (
					<Text>{renderMarkdown(message.content)}</Text>
				)}
			</Box>
		</Box>
	);
}

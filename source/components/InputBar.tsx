import React, {useState, useCallback} from 'react';
import {Box, Text, useInput} from 'ink';
import TextInput from 'ink-text-input';
import {getSuggestions} from '../commands/slashCommands.js';
import type {Theme} from '../types/index.js';

interface InputBarProps {
	theme: Theme;
	isStreaming: boolean;
	isReady: boolean;
	onSubmit: (value: string) => void;
	placeholder?: string;
}

export function InputBar({
	theme,
	isStreaming,
	isReady,
	onSubmit,
	placeholder = 'Ask anything… (type /help for commands)',
}: InputBarProps) {
	const [value, setValue] = useState('');
	const [suggestion, setSuggestion] = useState('');

	const handleChange = useCallback((val: string) => {
		setValue(val);
		if (val.startsWith('/')) {
			const suggestions = getSuggestions(val);
			setSuggestion(suggestions[0] ?? '');
		} else {
			setSuggestion('');
		}
	}, []);

	const handleSubmit = useCallback(
		(val: string) => {
			if (!val.trim() || isStreaming || !isReady) return;
			onSubmit(val.trim());
			setValue('');
			setSuggestion('');
		},
		[isStreaming, isReady, onSubmit],
	);

	// Tab to complete suggestion
	useInput((input, key) => {
		if (key.tab && suggestion) {
			setValue(suggestion);
			setSuggestion('');
		}
	});

	const promptChar = isStreaming ? '⟳' : '›';
	const promptColor = isStreaming ? theme.warning : theme.primary;
	const disabled = !isReady || isStreaming;

	return (
		<Box flexDirection="column">
			{/* Suggestion hint */}
			{suggestion && (
				<Box paddingLeft={3}>
					<Text color={theme.muted}>
						{suggestion}
						<Text> (Tab)</Text>
					</Text>
				</Box>
			)}

			{/* Input row */}
			<Box
				borderStyle={theme.borderStyle}
				borderColor={disabled ? theme.muted : theme.primary}
				paddingX={1}
				gap={1}
			>
				<Text bold color={promptColor}>
					{promptChar}
				</Text>
				{disabled ? (
					<Text color={theme.muted}>
						{isStreaming ? 'Streaming…' : 'Connecting to backend…'}
					</Text>
				) : (
					<TextInput
						value={value}
						onChange={handleChange}
						onSubmit={handleSubmit}
						placeholder={placeholder}
					/>
				)}
			</Box>
		</Box>
	);
}

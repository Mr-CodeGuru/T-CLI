import React from 'react';
import {Box, Text, useInput} from 'ink';
import type {Theme} from '../types/index.js';


interface HelpPanelProps {
	theme: Theme;
	onClose: () => void;
}

const COMMANDS = [
	['/help', 'Show this help panel'],
	['/models', 'List available models for current provider'],
	['/quota', 'Show token usage and stats'],
	['/clear', 'Clear current conversation'],
	['/exit', 'Exit T-CLI'],
	['/theme [name]', 'Switch theme or open theme picker'],
	['/sessions', 'Browse and load saved sessions'],
	['/memory', 'View current conversation context'],
	['/providers', 'Manage AI providers'],
	['/save [name]', 'Save conversation to a named session'],
	['/load [id]', 'Load a saved session'],
	['/provider switch [name]', 'Switch active provider'],
	['/model [name]', 'Switch model for current provider'],
];

const SHORTCUTS = [
	['Tab', 'Autocomplete slash command'],
	['Enter', 'Send message'],
	['Esc', 'Close panel / cancel'],
	['Ctrl+C', 'Exit T-CLI'],
];

export function HelpPanel({theme, onClose}: HelpPanelProps) {
	useInput((_input, key) => {
		if (key.escape || key.return) onClose();
	});

	return (
		<Box flexDirection="column" borderStyle={theme.borderStyle} borderColor={theme.primary} paddingX={2} paddingY={1}>
			{/* Title */}
			<Box marginBottom={1}>
				<Text bold color={theme.primary}>
					T-CLI Help
				</Text>
				<Text color={theme.muted}> — press Esc to close</Text>
			</Box>

			{/* Commands */}
			<Text bold color={theme.secondary}>
				Slash Commands
			</Text>
			{COMMANDS.map(([cmd, desc]) => (
				<Box key={cmd} gap={1} paddingLeft={1}>
					<Text color={theme.accent} bold>
						{cmd!.padEnd(28)}
					</Text>
					<Text color={theme.muted}>{desc}</Text>
				</Box>
			))}

			<Box marginTop={1} />

			{/* Keyboard shortcuts */}
			<Text bold color={theme.secondary}>
				Keyboard Shortcuts
			</Text>
			{SHORTCUTS.map(([key, desc]) => (
				<Box key={key} gap={1} paddingLeft={1}>
					<Text color={theme.primary} bold>
						{key!.padEnd(28)}
					</Text>
					<Text color={theme.muted}>{desc}</Text>
				</Box>
			))}
		</Box>
	);
}

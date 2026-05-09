import React from 'react';
import {Box, Text, useInput} from 'ink';
import {THEME_NAMES, getTheme} from '../themes/index.js';
import type {Theme} from '../types/index.js';

interface ThemePanelProps {
	theme: Theme;
	currentTheme: string;
	onSelect: (name: string) => void;
	onClose: () => void;
}

export function ThemePanel({theme, currentTheme, onSelect, onClose}: ThemePanelProps) {
	const [selected, setSelected] = React.useState(() =>
		THEME_NAMES.indexOf(currentTheme),
	);

	useInput((_input, key) => {
		if (key.escape) {
			onClose();
		} else if (key.upArrow) {
			setSelected(i => Math.max(0, i - 1));
		} else if (key.downArrow) {
			setSelected(i => Math.min(THEME_NAMES.length - 1, i + 1));
		} else if (key.return) {
			const name = THEME_NAMES[selected];
			if (name) onSelect(name);
		}
	});

	return (
		<Box
			flexDirection="column"
			borderStyle={theme.borderStyle}
			borderColor={theme.accent}
			paddingX={2}
			paddingY={1}
		>
			<Box marginBottom={1}>
				<Text bold color={theme.accent}>
					Theme Picker
				</Text>
				<Text color={theme.muted}> — up/down navigate • Enter select • Esc cancel</Text>
			</Box>

			{THEME_NAMES.map((name, idx) => {
				const t = getTheme(name);
				const isActive = name === currentTheme;
				const isCursor = idx === selected;

				return (
					<Box key={name} gap={2} paddingLeft={1}>
						<Text color={isCursor ? theme.primary : theme.muted}>
							{isCursor ? '•' : ' '}
						</Text>
						<Text bold={isCursor} color={isCursor ? theme.primary : theme.secondary}>
							{t.displayName}
						</Text>
						{isActive && <Text color={theme.success}> • active</Text>}
					</Box>
				);
			})}
		</Box>
	);
}

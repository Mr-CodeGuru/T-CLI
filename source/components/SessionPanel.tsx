import React, {useEffect} from 'react';
import {Box, Text, useInput} from 'ink';
import type {Theme, Session} from '../types/index.js';

interface SessionPanelProps {
	theme: Theme;
	sessions: Session[];
	onLoad: (id: string) => void;
	onDelete: (id: string) => void;
	onClose: () => void;
	onRefresh: () => void;
}

export function SessionPanel({
	theme,
	sessions,
	onLoad,
	onDelete,
	onClose,
	onRefresh,
}: SessionPanelProps) {
	const [cursor, setCursor] = React.useState(0);

	useEffect(() => {
		onRefresh();
	}, [onRefresh]);

	useInput((_input, key) => {
		if (key.escape) {
			onClose();
		} else if (key.upArrow) {
			setCursor(i => Math.max(0, i - 1));
		} else if (key.downArrow) {
			setCursor(i => Math.min(sessions.length - 1, i + 1));
		} else if (key.return) {
			const s = sessions[cursor];
			if (s) onLoad(s.id);
		} else if (_input === 'd') {
			const s = sessions[cursor];
			if (s) onDelete(s.id);
		}
	});

	function formatDate(ts: number): string {
		return new Date(ts).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	}

	return (
		<Box
			flexDirection="column"
			borderStyle={theme.borderStyle}
			borderColor={theme.secondary}
			paddingX={2}
			paddingY={1}
		>
			<Box marginBottom={1}>
				<Text bold color={theme.secondary}>
					Sessions
				</Text>
				<Text color={theme.muted}> — Enter load • d delete • Esc close</Text>
			</Box>

			{sessions.length === 0 ? (
				<Text color={theme.muted}>
					No saved sessions. Use /save [name] to save one.
				</Text>
			) : (
				sessions.map((s, idx) => (
					<Box key={s.id} gap={2} paddingLeft={1}>
						<Text color={idx === cursor ? theme.primary : theme.muted}>
							{idx === cursor ? '•' : ' '}
						</Text>
						<Text bold={idx === cursor} color={idx === cursor ? theme.primary : theme.secondary}>
							{s.name.slice(0, 30)}
						</Text>
						<Text color={theme.muted}>{s.provider}/{s.model}</Text>
						<Text color={theme.muted}>
							{formatDate(s.updatedAt)}
						</Text>
					</Box>
				))
			)}
		</Box>
	);
}

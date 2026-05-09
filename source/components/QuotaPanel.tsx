import React, {useEffect} from 'react';
import {Box, Text} from 'ink';
import type {Theme, QuotaRecord, SessionQuota} from '../types/index.js';
import {useInput} from 'ink';

interface QuotaPanelProps {
	theme: Theme;
	sessionQuota: SessionQuota;
	allTimeQuota: QuotaRecord[];
	onClose: () => void;
	onRefresh: () => void;
}

export function QuotaPanel({
	theme,
	sessionQuota,
	allTimeQuota,
	onClose,
	onRefresh,
}: QuotaPanelProps) {
	useEffect(() => {
		onRefresh();
	}, [onRefresh]);

	useInput((_input, key) => {
		if (key.escape || key.return) onClose();
	});

	const sessionTotal =
		sessionQuota.promptTokens + sessionQuota.completionTokens;
	const avgMs =
		sessionQuota.latencyMs.length > 0
			? Math.round(
					sessionQuota.latencyMs.reduce((a, b) => a + b, 0) /
						sessionQuota.latencyMs.length,
				)
			: 0;

	return (
		<Box
			flexDirection="column"
			borderStyle={theme.borderStyle}
			borderColor={theme.warning}
			paddingX={2}
			paddingY={1}
		>
			<Box marginBottom={1}>
				<Text bold color={theme.warning}>
					Quota & Usage
				</Text>
				<Text color={theme.muted}> — Esc to close</Text>
			</Box>

			{/* Session stats */}
			<Text bold color={theme.secondary}>
				This Session
			</Text>
			<Box paddingLeft={1} flexDirection="column">
				<Text color={theme.muted}>
					Prompt tokens:{'     '}
					<Text color={theme.primary}>{sessionQuota.promptTokens.toLocaleString()}</Text>
				</Text>
				<Text color={theme.muted}>
					Completion tokens:{' '}
					<Text color={theme.primary}>{sessionQuota.completionTokens.toLocaleString()}</Text>
				</Text>
				<Text color={theme.muted}>
					Total tokens:{'     '}
					<Text color={theme.accent} bold>
						{sessionTotal.toLocaleString()}
					</Text>
				</Text>
				<Text color={theme.muted}>
					Requests:{'         '}
					<Text color={theme.primary}>{sessionQuota.requests}</Text>
				</Text>
				{avgMs > 0 && (
					<Text color={theme.muted}>
						Avg latency:{'      '}
						<Text color={theme.secondary}>{avgMs}ms</Text>
					</Text>
				)}
			</Box>

			{/* All-time */}
			{allTimeQuota.length > 0 && (
				<>
					<Box marginTop={1} />
					<Text bold color={theme.secondary}>
						All-Time by Provider
					</Text>
					<Box paddingLeft={1} flexDirection="column">
						{allTimeQuota.map((r, i) => (
							<Box key={i} gap={2}>
								<Text color={theme.accent} bold>
									{r.provider}/{r.model}
								</Text>
								<Text color={theme.muted}>
									{(r.promptTokens + r.completionTokens).toLocaleString()} tok
								</Text>
								<Text color={theme.muted}>{r.requests} req</Text>
							</Box>
						))}
					</Box>
				</>
			)}
		</Box>
	);
}

import React from 'react';
import {Box, Text} from 'ink';
import type {Theme, Provider, SessionQuota} from '../types/index.js';

interface StatusBarProps {
	theme: Theme;
	provider: Provider;
	model: string;
	isReady: boolean;
	isStreaming: boolean;
	quota: SessionQuota;
}

function avgLatency(ms: number[]): string {
	if (ms.length === 0) return '—';
	const avg = ms.reduce((a, b) => a + b, 0) / ms.length;
	return `${Math.round(avg)}ms`;
}

export function StatusBar({
	theme,
	provider,
	model,
	isReady,
	isStreaming,
	quota,
}: StatusBarProps) {
	const statusDot = isStreaming ? '•' : isReady ? '•' : '•';
	const statusColor = isStreaming
		? theme.warning
		: isReady
			? theme.success
			: theme.muted;
	const totalTokens = quota.promptTokens + quota.completionTokens;

	return (
		<Box
			borderStyle="single"
			borderColor={theme.muted}
			paddingX={1}
			justifyContent="space-between"
		>
			{/* Left: branding + status */}
			<Box gap={2}>
				<Text bold color={theme.primary}>
					T-CLI
				</Text>
				<Text color={statusColor}>{statusDot}</Text>
				<Box gap={1}>
					<Text color={theme.muted}>
						{provider.charAt(0).toUpperCase() + provider.slice(1)}
					</Text>
					<Text color={theme.primary}>/</Text>
					<Text color={theme.primary}>
						{model.split('/').pop() || model}
					</Text>
				</Box>
			</Box>

			{/* Right: quota + latency */}
			<Box gap={3}>
				{totalTokens > 0 && (
					<Box gap={1}>
						<Text color={theme.muted}>
							<Text color={theme.accent}>{totalTokens.toLocaleString()}</Text>
							{' tok'}
						</Text>
						{quota.reasoning_tokens !== undefined && quota.reasoning_tokens > 0 && (
							<Text color={theme.muted}>
								{' ('}
								<Text color={theme.success}>{quota.reasoning_tokens.toLocaleString()}</Text>
								{' reasoning)'}
							</Text>
						)}
					</Box>
				)}
				{quota.requests > 0 && (
					<Text color={theme.muted}>
						{'• '}
						<Text color={theme.secondary}>{avgLatency(quota.latencyMs)}</Text>
					</Text>
				)}
				<Text color={theme.muted}>
					/help
				</Text>
			</Box>
		</Box>
	);
}

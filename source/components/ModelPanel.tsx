import React from 'react';
import {Box, Text, useInput} from 'ink';
import {PATHS} from '../utils/paths.js';
import type {Theme, Provider, ModelInfo} from '../types/index.js';

interface ModelPanelProps {
	backend: any;
	theme: Theme;
	provider: Provider;
	currentModel: string;
	onSelect: (model: string) => void;
	onClose: () => void;
}

const MODEL_CATALOG: Record<string, ModelInfo[]> = {
	openrouter: [
		{id: 'openrouter/free', name: 'OpenRouter Free (Auto)', provider: 'openrouter' as Provider, contextWindow: 128_000, supportsStreaming: true},
	],
	local: [],
};

function formatCtx(n: number): string {
	if (n >= 1_000_000) return `${n / 1_000_000}M ctx`;
	if (n >= 1_000) return `${n / 1_000}K ctx`;
	return `${n} ctx`;
}

export function ModelPanel({backend, theme, provider, currentModel, onSelect, onClose}: ModelPanelProps) {
	const [models, setModels] = React.useState<ModelInfo[]>(() => MODEL_CATALOG[provider] ?? []);
	const [isLoading, setIsLoading] = React.useState(false);
	const [cursor, setCursor] = React.useState(0);

	// Sync cursor with currentModel whenever models list changes
	React.useEffect(() => {
		const idx = models.findIndex(m => m.id === currentModel);
		if (idx !== -1) {
			setCursor(idx);
		}
	}, [models, currentModel]);

	// Dynamic fetch for OpenRouter
	React.useEffect(() => {
		if (provider === 'openrouter') {
			setIsLoading(true);
			backend.fetchModels('openrouter')
				.then((fetched: any[]) => {
					const mapped: ModelInfo[] = fetched.map(m => ({
						id: m.id,
						name: m.name,
						provider: 'openrouter' as Provider,
						contextWindow: m.context_window || 128_000,
						supportsStreaming: true
					}));
					
					// Add default auto-select option at top if not present
					if (!mapped.some(m => m.id === 'openrouter/free')) {
						mapped.unshift(MODEL_CATALOG['openrouter']![0]!);
					}
					
					setModels(mapped);
				})
				.catch((e: any) => {
					console.error(`[ModelPanel] Fetch failed: ${e.message}`);
				})
				.finally(() => {
					setIsLoading(false);
				});
		} else if (provider === 'local') {
			// For local, the model is just the path
			setModels([{
				id: currentModel,
				name: `GGUF: ${currentModel.split('/').pop()}`,
				provider: 'local',
				contextWindow: 2048,
				supportsStreaming: true
			}]);
		}
	}, [provider, backend, currentModel]);

	useInput((_input, key) => {
		if (key.escape) {
			onClose();
		} else if (key.upArrow) {
			setCursor(i => Math.max(0, i - 1));
		} else if (key.downArrow) {
			setCursor(i => Math.min(models.length - 1, i + 1));
		} else if (key.return) {
			const m = models[cursor];
			if (m) onSelect(m.id);
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
					Models — {provider}
				</Text>
				{isLoading && (
					<Text color={theme.muted}> (Fetching latest...)</Text>
				)}
				{!isLoading && (
					<Text color={theme.muted}> — up/down navigate • Enter select • Esc cancel</Text>
				)}
			</Box>

			<Box flexDirection="column">
				{models.map((m, idx) => {
					const isActive = m.id === currentModel;
					const isCursor = idx === cursor;
					return (
						<Box key={m.id} gap={2} paddingLeft={1}>
							<Text color={isCursor ? theme.primary : theme.muted}>
								{isCursor ? '•' : ' '}
							</Text>
							<Text bold={isCursor} color={isCursor ? theme.primary : (isActive ? theme.secondary : theme.muted)}>
								{m.name}
							</Text>
							<Text color={theme.muted}>
								{formatCtx(m.contextWindow)}
							</Text>
							{isActive && <Text color={theme.success}> •</Text>}
						</Box>
					);
				})}
			</Box>
		</Box>
	);
}

export {MODEL_CATALOG};

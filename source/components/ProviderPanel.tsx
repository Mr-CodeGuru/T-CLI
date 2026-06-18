import React, {useState, useCallback} from 'react';
import {Box, Text, useInput} from 'ink';
import TextInput from 'ink-text-input';
import type {Theme, Provider} from '../types/index.js';
import {
	getProviderKey,
	setProviderKey,
	PROVIDER_KEY_LABEL,
	PROVIDER_KEY_URL,
	PROVIDER_KEY_PLACEHOLDER,
	PROVIDER_ENV_KEY,
} from '../utils/keystore.js';

interface ProviderPanelProps {
	theme: Theme;
	currentProvider: Provider;
	onSwitch: (provider: Provider) => void;
	onClose: () => void;
	onEnvSet?: (key: string, value: string) => void; // notify backend
}

interface ProviderInfo {
	id: Provider;
	icon: string;
	name: string;
	models: string[];
}

const PROVIDERS: ProviderInfo[] = [
	{
		id: 'openrouter',
		icon: '•',
		name: 'OpenRouter',
		models: ['google/gemma-4-31b', 'meta-llama/llama-3.3-70b-instruct', 'openai/gpt-oss-20b'],
	},
	{
		id: 'local',
		icon: '•',
		name: 'Local LLM (llama.cpp)',
		models: ['/Users/aman/Downloads/TM-1B-Q80.gguf'],
	},
];

type PanelMode = 'list' | 'enter-key';

export function ProviderPanel({
	theme,
	currentProvider,
	onSwitch,
	onClose,
	onEnvSet,
}: ProviderPanelProps) {
	const [cursor, setCursor] = useState(() =>
		Math.max(0, PROVIDERS.findIndex(p => p.id === currentProvider)),
	);
	const [mode, setMode] = useState<PanelMode>('list');
	const [keyInput, setKeyInput] = useState('');
	const [statusMsg, setStatusMsg] = useState('');

	const selectedProvider = PROVIDERS[cursor]!;
	const existingKey = getProviderKey(selectedProvider.id);
	const isLocal = selectedProvider.id === 'local';

	// ── List mode keyboard ────────────────────────────────────────────────────

	useInput(
		(_input, key) => {
			if (mode !== 'list') return;
			if (key.escape) {
				onClose();
			} else if (key.upArrow) {
				setCursor(i => Math.max(0, i - 1));
				setStatusMsg('');
			} else if (key.downArrow) {
				setCursor(i => Math.min(PROVIDERS.length - 1, i + 1));
				setStatusMsg('');
			} else if (key.return) {
				// Switch to this provider if it has a key, else open key entry
				if (existingKey) {
					onSwitch(selectedProvider.id);
				} else {
					setKeyInput('');
					setMode('enter-key');
				}
			} else if (_input === 'k' || _input === 'K') {
				// Edit key for selected provider
				setKeyInput(existingKey ?? '');
				setMode('enter-key');
			} else if (_input === 'd' || _input === 'D') {
				// Delete key (deactivate provider)
				if (existingKey && selectedProvider.id !== currentProvider) {
					setProviderKey(selectedProvider.id, '');
					setStatusMsg(`${selectedProvider.name} key removed.`);
				}
			}
		},
		{isActive: mode === 'list'},
	);

	// ── Key-entry mode: Esc to cancel ─────────────────────────────────────────

	useInput(
		(_input, key) => {
			if (mode !== 'enter-key') return;
			if (key.escape) {
				setMode('list');
				setKeyInput('');
			}
		},
		{isActive: mode === 'enter-key'},
	);

	const handleKeySubmit = useCallback(
		(val: string) => {
			const trimmed = val.trim();
			if (!trimmed) return;

			setProviderKey(selectedProvider.id, trimmed);

			// Notify backend to inject the new env var
			const envKey = PROVIDER_ENV_KEY[selectedProvider.id];
			onEnvSet?.(envKey, trimmed);

			setStatusMsg(`• ${selectedProvider.name} configured!`);
			setMode('list');
			setKeyInput('');

			// Auto-switch to new provider
			onSwitch(selectedProvider.id);
		},
		[onEnvSet, onSwitch, selectedProvider],
	);

	// ── Render ────────────────────────────────────────────────────────────────

	return (
		<Box
			flexDirection="column"
			borderStyle={theme.borderStyle}
			borderColor={theme.primary}
			paddingX={2}
			paddingY={1}
		>
			{/* Header */}
			<Box marginBottom={1} justifyContent="space-between">
				<Text bold color={theme.primary}>
					AI Providers
				</Text>
				<Text color={theme.muted}>
					Enter switch  •  k configure  •  Esc close
				</Text>
			</Box>

			{/* Provider list */}
			{PROVIDERS.map((p, idx) => {
				const isActive = p.id === currentProvider;
				const isCursor = idx === cursor;
				const hasKey = !!getProviderKey(p.id);

				return (
					<Box key={p.id} flexDirection="column" paddingLeft={1} marginBottom={isCursor ? 1 : 0}>
						<Box gap={2}>
							<Text color={isCursor ? theme.primary : theme.muted}>
								{isCursor ? '•' : ' '}
							</Text>
							<Text bold={isCursor} color={isCursor ? theme.primary : theme.secondary}>
								{p.name}
							</Text>
							{isActive && <Text color={theme.success}>• active</Text>}
							{hasKey && !isActive && <Text color={theme.muted}>•</Text>}
							{!hasKey && (
								<Text color={theme.muted}>
									not configured
								</Text>
							)}
						</Box>

						{isCursor && mode === 'list' && (
							<Box paddingLeft={4} flexDirection="column" gap={0}>
								<Text color={theme.muted}>
									{p.id === 'local' 
										? `Model Path: ${getProviderKey('local') || 'Not set'}`
										: `Models: ${p.models.slice(0, 3).join(' • ')}`}
								</Text>
								{!hasKey && (
									<Text color={theme.warning}>
										Press Enter or k to add API key
									</Text>
								)}
								{!hasKey && (
									<Text color={theme.muted}>
										{PROVIDER_KEY_URL[p.id]}
									</Text>
								)}
							</Box>
						)}
					</Box>
				);
			})}

			{/* Inline key entry */}
			{mode === 'enter-key' && (
				<Box
					flexDirection="column"
					borderStyle="round"
					borderColor={theme.accent}
					paddingX={2}
					paddingY={1}
					marginTop={1}
				>
					<Text bold color={theme.accent}>
						{PROVIDER_KEY_LABEL[selectedProvider.id]}
					</Text>
					<Text color={theme.muted}>
						{PROVIDER_KEY_URL[selectedProvider.id]}
					</Text>
					<Box marginTop={1} gap={1}>
						<Text color={theme.primary}>• </Text>
						<TextInput
							value={keyInput}
							onChange={setKeyInput}
							onSubmit={handleKeySubmit}
							placeholder={
								PROVIDER_KEY_PLACEHOLDER[selectedProvider.id]
							}
							mask={!isLocal && keyInput.length > 6 ? '•' : undefined}
						/>
					</Box>
					<Text color={theme.muted}>
						Enter to save  •  Esc to cancel
					</Text>
				</Box>
			)}

			{/* Status message */}
			{statusMsg && (
				<Box marginTop={1}>
					<Text color={theme.success}>{statusMsg}</Text>
				</Box>
			)}
		</Box>
	);
}

export {PROVIDERS};

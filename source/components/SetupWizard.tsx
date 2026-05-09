import React, {useState, useCallback} from 'react';
import {Box, Text, useInput} from 'ink';
import TextInput from 'ink-text-input';
import type {Provider} from '../types/index.js';
import type {UseBackendReturn} from '../hooks/useBackend.js';
import {
	PROVIDER_ENV_KEY,
	PROVIDER_KEY_LABEL,
	PROVIDER_KEY_URL,
	PROVIDER_KEY_PLACEHOLDER,
	setProviderKey,
	getProviderKey,
} from '../utils/keystore.js';

// ── Provider catalogue ────────────────────────────────────────────────────────

interface ProviderEntry {
	id: Provider;
	icon: string;
	name: string;
	tagline: string;
	defaultModel: string;
	isFree: boolean;
}

const PROVIDERS: ProviderEntry[] = [
	{
		id: 'openrouter',
		icon: '•',
		name: 'OpenRouter',
		tagline: 'Access 100+ models • Free credits',
		defaultModel: 'openrouter/free',
		isFree: true,
	},
	{
		id: 'local',
		icon: '•',
		name: 'Local LLM (llama.cpp)',
		tagline: 'Run GGUF models locally • No API key',
		defaultModel: 'local-gguf',
		isFree: true,
	},
];

// ── Types ─────────────────────────────────────────────────────────────────────

type WizardStep = 'select' | 'enter-key' | 'enter-model' | 'success';

interface SetupWizardProps {
	backend: UseBackendReturn;
	onComplete: (provider: Provider, model: string) => void;
	isManage?: boolean; // true when opened from /providers to just add a key
}

// ── Colors (hardcoded since theme isn't loaded yet) ───────────────────────────

const C = {
	primary: '#8AB4F8',
	secondary: '#81C995',
	accent: '#F28B82',
	muted: '#9AA0A6',
	success: '#81C995',
	warning: '#FDD663',
	dim: '#4A5568',
};

// ── Main component ────────────────────────────────────────────────────────────

export function SetupWizard({backend, onComplete, isManage = false}: SetupWizardProps) {
	const [step, setStep] = useState<WizardStep>('select');
	const [cursor, setCursor] = useState(0);
	const [keyValue, setKeyValue] = useState('');
	const [modelValue, setModelValue] = useState('');
	const [error, setError] = useState('');
	const [isFetchingModels, setIsFetchingModels] = useState(false);
	const [fetchedModels, setFetchedModels] = useState<any[]>([]);
	const [modelCursor, setModelCursor] = useState(0);

	const selected = PROVIDERS[cursor]!;
	const isLocal = selected?.id === 'local';

	// ── Step: select ──────────────────────────────────────────────────────────

	useInput(
		(_input, key) => {
			if (step !== 'select') return;
			if (key.upArrow) setCursor(i => Math.max(0, i - 1));
			else if (key.downArrow) setCursor(i => Math.min(PROVIDERS.length - 1, i + 1));
			else if (key.return) {
				const existing = getProviderKey(selected.id);
				setKeyValue(existing ?? '');
				setStep('enter-key');
				setError('');
			}
		},
		{isActive: step === 'select'},
	);

	// ── Navigation: enter-model (interactive list) ────────────────────────────

	useInput(
		(_input, key) => {
			if (step !== 'enter-model' || fetchedModels.length === 0) return;

			if (key.upArrow) {
				setModelCursor(i => Math.max(0, i - 1));
			} else if (key.downArrow) {
				setModelCursor(i => Math.min(fetchedModels.length - 1, i + 1));
			} else if (key.return) {
				const chosen = fetchedModels[modelCursor]?.id || selected.defaultModel;
				handleModelSubmit(chosen);
			}
		},
		{isActive: step === 'enter-model' && fetchedModels.length > 0},
	);

	// ── Step: enter-key submit ────────────────────────────────────────────────

	// ── Step: enter-model submit ──────────────────────────────────────────────

	const handleModelSubmit = useCallback(
		(val: string) => {
			const model = val.trim() || selected.defaultModel;
			setStep('success');
			setTimeout(() => {
				onComplete(selected.id, model);
			}, 200); // Fast transition
		},
		[onComplete, selected],
	);

	// ── Step: enter-key submit ────────────────────────────────────────────────

	const handleKeySubmit = useCallback(
		async (val: string) => {
			const trimmed = val.trim();
			if (!trimmed) {
				setError('Please enter a value.');
				return;
			}

			setKeyValue(trimmed);
			setError('');

			// Save key/path
			setProviderKey(selected.id, trimmed);
			backend.setEnvVar(PROVIDER_ENV_KEY[selected.id]!, trimmed);

			if (isLocal) {
				// For local, the path is the model. Finish immediately.
				handleModelSubmit(trimmed);
				return;
			}

			// If OpenRouter, try to fetch free models in the background (non-blocking)
			if (selected.id === 'openrouter') {
				setIsFetchingModels(true);
				backend.fetchModels('openrouter')
					.then(models => {
						const free = models.filter((m: any) => m.is_free);
						setFetchedModels(free);
					})
					.catch((e: any) => {
						setError(`Model discovery failed: ${e.message}`);
					})
					.finally(() => setIsFetchingModels(false));
			}

			// Proceed to model selection immediately
			setStep('enter-model');
		},
		[backend, handleModelSubmit, isLocal, selected],
	);

	// ── Esc to go back ────────────────────────────────────────────────────────

	useInput((_input, key) => {
		if (key.escape) {
			if (step === 'enter-model') setStep('enter-key');
			else if (step === 'enter-key') setStep('select');
		}
	});

	// ── Render ────────────────────────────────────────────────────────────────

	return (
		<Box flexDirection="column" paddingX={2} paddingY={1}>
			{/* Header */}
			<Box flexDirection="column" alignItems="center" marginBottom={1}>
				<Text bold color={C.primary}>
					{'  •  T-CLI  •  '}
				</Text>
				<Text color={C.muted}>
					{isManage ? 'Configure a provider' : 'Your local AI chat interface'}
				</Text>
			</Box>

			{/* ── STEP: select ── */}
			{step === 'select' && (
				<Box flexDirection="column" borderStyle="round" borderColor={C.primary} paddingX={2} paddingY={1}>
					<Box marginBottom={1}>
						<Text bold color={C.primary}>
							{isManage ? 'Choose a provider to configure' : 'Choose your AI provider'}
						</Text>
					</Box>

					{PROVIDERS.map((p, idx) => {
						const isCursor = idx === cursor;
						const hasKey = !!getProviderKey(p.id);
						return (
							<Box key={p.id} gap={2} paddingLeft={1}>
								<Text color={isCursor ? C.primary : C.dim}>
									{isCursor ? '•' : ' '}
								</Text>
								<Text bold={isCursor} color={isCursor ? C.primary : '#CCCCCC'}>
									{p.icon} {p.name}
								</Text>
								<Text color={isCursor ? C.muted : C.dim}>
									{p.tagline}
								</Text>
								{hasKey && <Text color={C.success}>•</Text>}
								{p.isFree && !hasKey && (
									<Text color={C.warning}>
										free
									</Text>
								)}
							</Box>
						);
					})}

					<Box marginTop={1}>
						<Text color={C.dim}>up/down navigate  •  Enter select</Text>
					</Box>
				</Box>
			)}

			{/* ── STEP: enter-key ── */}
			{step === 'enter-key' && (
				<Box flexDirection="column" borderStyle="round" borderColor={C.accent} paddingX={2} paddingY={1}>
					<Box marginBottom={1}>
						<Text bold color={C.accent}>
							{selected.icon} {selected.name}
						</Text>
					</Box>

					<Text color={C.muted}>
						{PROVIDER_KEY_LABEL[selected.id]}
					</Text>

					{!isLocal && (
						<Text color={C.dim}>
							Get yours at: {PROVIDER_KEY_URL[selected.id]}
						</Text>
					)}

					<Box marginTop={1} borderStyle="single" borderColor={C.primary} paddingX={1}>
						<Text color={C.primary}>• </Text>
						<TextInput
							value={keyValue}
							onChange={setKeyValue}
							onSubmit={handleKeySubmit}
							placeholder={PROVIDER_KEY_PLACEHOLDER[selected.id]}
							mask={!isLocal && keyValue.length > 6 ? '•' : undefined}
						/>
					</Box>

					{error && (
						<Text color={C.accent}>{error}</Text>
					)}

					<Box marginTop={1}>
						<Text color={C.dim}>Enter to save  •  Esc to go back</Text>
					</Box>
				</Box>
			)}

			{/* ── STEP: enter-model ── */}
			{step === 'enter-model' && (
				<Box flexDirection="column" borderStyle="round" borderColor={C.secondary} paddingX={2} paddingY={1}>
					<Box marginBottom={1}>
						<Text bold color={C.secondary}>
							{selected.icon} {selected.name} Model
						</Text>
					</Box>

					<Text color={C.muted}>
						{isLocal ? 'Ollama URL' : 'API Key'}: <Text color={C.primary}>{isLocal ? keyValue : (keyValue.slice(0, 8) + '...')}</Text>
					</Text>
					<Text color={C.muted}>
						{isLocal 
							? 'Enter the model name to use (must be pulled in Ollama):' 
							: 'Enter the model ID you want to use:'}
					</Text>

					<Box marginTop={1} flexDirection="column">
						{isFetchingModels ? (
							<Text color={C.muted} italic>
								Fetching available free models...
							</Text>
						) : fetchedModels.length > 0 ? (
							<Box flexDirection="column" borderStyle="single" borderColor={C.dim} paddingX={1} marginY={1}>
								<Box marginBottom={1}>
									<Text color={C.secondary} bold>Choose a model (up/down to navigate, Enter to select):</Text>
								</Box>
								{(() => {
									const windowSize = 10;
									const start = Math.max(0, Math.min(modelCursor - Math.floor(windowSize / 2), Math.max(0, fetchedModels.length - windowSize)));
									const end = Math.min(start + windowSize, fetchedModels.length);
									const visible = fetchedModels.slice(start, end);

									return (
										<>
											{start > 0 && <Text color={C.dim}>  ... {start} more above ...</Text>}
											{visible.map((m, idx) => {
												const actualIdx = start + idx;
												const isCurrent = actualIdx === modelCursor;
												return (
													<Box key={m.id} gap={1}>
														<Text color={isCurrent ? C.primary : C.dim}>
															{isCurrent ? '•' : ' '}
														</Text>
														<Text bold={isCurrent} color={isCurrent ? C.primary : '#BBBBBB'}>
															{m.name}
														</Text>
														<Text color={C.dim}>
															({m.id})
														</Text>
													</Box>
												);
											})}
											{end < fetchedModels.length && (
												<Text color={C.dim} italic>
													  ... {fetchedModels.length - end} more below ...
												</Text>
											)}
										</>
									);
								})()}
							</Box>
						) : (
							<Box flexDirection="column">
								<Text color={C.dim}>
									{selected.id === 'openrouter' 
										? 'Examples: google/gemma-4-31b • meta-llama/llama-3.3-70b-instruct • openai/gpt-oss-20b'
										: isLocal 
											? 'Examples: /Users/aman/Downloads/TM-1B-Q80.gguf'
											: `Default: ${selected.defaultModel}`}
								</Text>
								
								<Box marginTop={1} borderStyle="single" borderColor={C.secondary} paddingX={1}>
									<Text color={C.secondary}>• </Text>
									<TextInput
										value={modelValue}
										onChange={setModelValue}
										onSubmit={handleModelSubmit}
										placeholder={selected.defaultModel}
									/>
								</Box>
							</Box>
						)}
					</Box>

					<Box marginTop={1}>
						<Text color={C.dim}>Enter to start  •  Esc to go back</Text>
					</Box>
				</Box>
			)}

			{/* ── STEP: success ── */}
			{step === 'success' && (
				<Box flexDirection="column" alignItems="center" paddingY={2}>
					<Text bold color={C.success}>
						• {selected.name} configured!
					</Text>
					<Text color={C.muted}>Starting T-CLI…</Text>
				</Box>
			)}
		</Box>
	);
}

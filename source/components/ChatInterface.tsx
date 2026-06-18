import React, {useCallback} from 'react';
import {Box, Text, useApp, useInput} from 'ink';
import {MessageBubble} from './MessageBubble.js';
import {InputBar} from './InputBar.js';
import {StatusBar} from './StatusBar.js';
import {HelpPanel} from './HelpPanel.js';
import {ThemePanel} from './ThemePanel.js';
import {SessionPanel} from './SessionPanel.js';
import {QuotaPanel} from './QuotaPanel.js';
import {ProviderPanel} from './ProviderPanel.js';
import {ModelPanel, MODEL_CATALOG} from './ModelPanel.js';
import {MemoryPanel} from './MemoryPanel.js';
import {useBackend} from '../hooks/useBackend.js';
import {useChat} from '../hooks/useChat.js';
import {useTheme} from '../hooks/useTheme.js';
import {useSession} from '../hooks/useSession.js';
import {useQuota} from '../hooks/useQuota.js';
import {isSlashCommand, dispatchCommand} from '../commands/slashCommands.js';
import {getConfig, setConfig} from '../db/index.js';
import {PROVIDER_ENV_KEY, getConfiguredProviders, getProviderKey, clearAllKeys} from '../utils/keystore.js';
import type {ActivePanel, Provider} from '../types/index.js';

export function ChatInterface({backend}: {backend: any}) {
	const {exit} = useApp();
	// const backend = useBackend(); // Removed, passed as prop
	const {theme, themeName, setTheme} = useTheme();
	const session = useSession();
	const quota = useQuota();

	// Provider + model state (persisted in DB config)
	const [provider, setProviderState] = React.useState<Provider>(() => {
		return getConfig('provider', 'openrouter') as Provider;
	});
	
	const [model, setModelState] = React.useState<string>(() => {
		return getConfig('model', 'openrouter/free') as string;
	});
	const [activePanel, setActivePanel] = React.useState<ActivePanel>('chat');

	const chat = useChat({
		backend,
		provider,
		model,
		sessionId: session.sessionId,
		onUsage: (prompt, completion, latency, reasoning) => {
			quota.addUsage(provider, model, prompt, completion, latency, reasoning);
		},
	});

	// Global Esc to return to chat
	useInput((_input, key) => {
		if (key.escape && activePanel !== 'chat') {
			setActivePanel('chat');
		}
	});

	const handleSubmit = useCallback(
		(value: string) => {
			if (isSlashCommand(value)) {
				const result = dispatchCommand(value);
				switch (result.action) {
					case 'panel':
						setActivePanel(result.panel);
						break;
					case 'clear':
						chat.clearMessages();
						quota.resetSession();
						break;
					case 'exit':
						exit();
						break;
					case 'reset':
						clearAllKeys();
						exit();
						break;
					case 'setTheme':
						setTheme(result.theme);
						break;
					case 'setProvider': {
						setProviderState(result.provider);
						setConfig('provider', result.provider);
						// Auto-reset model to provider's default to prevent out-of-sync state
						const defaultModel = result.provider === 'local' 
							? (getProviderKey('local') || 'local-gguf')
							: 'openrouter/free';
						setModelState(defaultModel);
						setConfig('model', defaultModel);
						break;
					}
					case 'setModel':
						setModelState(result.model);
						setConfig('model', result.model);
						break;
					case 'saveSession':
						session.saveSession(result.name, chat.messages, provider, model);
						break;
					case 'loadSession': {
						const msgs = session.loadSession(result.id);
						chat.setMessages(msgs);
						break;
					}

					case 'unknown':
						// Surface as system message
						chat.setMessages(prev => [
							...prev,
							{
								id: Math.random().toString(36),
								role: 'system' as const,
								content: `Unknown command: ${result.raw}. Type /help for a list.`,
								createdAt: Date.now(),
							},
						]);
						break;
				}
			} else {
				chat.sendMessage(value);
			}
		},
		[chat, exit, model, provider, quota, session, setTheme],
	);

	// ── Backend error banner ────────────────────────────────────────────────
	if (backend.error) {
		return (
			<Box flexDirection="column" padding={2}>
				<Text bold color={theme.error}>
					⚠ Backend Error
				</Text>
				<Text color={theme.muted}>{backend.error}</Text>
				<Text color={theme.muted}>
					Make sure Python 3 is installed and backend/requirements.txt packages are available.
				</Text>
			</Box>
		);
	}

	return (
		<Box flexDirection="column" height="100%">
			{/* Top status bar */}
			<StatusBar
				theme={theme}
				provider={provider}
				model={model}
				isReady={backend.isReady}
				isStreaming={chat.isStreaming}
				quota={quota.sessionQuota}
			/>

			{/* Main content area */}
			<Box flexDirection="column" flexGrow={1} paddingX={1} paddingY={1}>
				{activePanel === 'chat' && (
					<>
						{/* Welcome message when empty */}
						{chat.messages.length === 0 && (
							<Box flexDirection="column" alignItems="center" paddingY={2}>
								<Text bold color={theme.primary}>
									{provider.charAt(0).toUpperCase() + provider.slice(1)} is ready
								</Text>
								<Text color={theme.muted}>
									Type a message to start · /help for commands
								</Text>
							</Box>
						)}

						{/* Message list */}
						{chat.messages.map(msg => (
							<MessageBubble 
								key={msg.id} 
								message={msg} 
								theme={theme} 
								provider={provider}
								model={model}
							/>
						))}
					</>
				)}

				{activePanel === 'help' && (
					<HelpPanel theme={theme} onClose={() => setActivePanel('chat')} />
				)}

				{activePanel === 'theme' && (
					<ThemePanel
						theme={theme}
						currentTheme={themeName}
						onSelect={name => {
							setTheme(name);
							setActivePanel('chat');
						}}
						onClose={() => setActivePanel('chat')}
					/>
				)}

				{activePanel === 'sessions' && (
					<SessionPanel
						theme={theme}
						sessions={session.sessions}
						onLoad={id => {
							const msgs = session.loadSession(id);
							chat.setMessages(msgs);
							setActivePanel('chat');
						}}
						onDelete={session.deleteSession}
						onClose={() => setActivePanel('chat')}
						onRefresh={session.loadSessions}
					/>
				)}

				{activePanel === 'quota' && (
					<QuotaPanel
						theme={theme}
						sessionQuota={quota.sessionQuota}
						allTimeQuota={quota.allTimeQuota}
						onClose={() => setActivePanel('chat')}
						onRefresh={quota.loadAllTime}
					/>
				)}

				{activePanel === 'providers' && (
					<ProviderPanel
						theme={theme}
						currentProvider={provider}
						onSwitch={p => {
							setProviderState(p);
							setConfig('provider', p);
							// Auto-reset model to provider's default to prevent out-of-sync state
							const defaultModel = p === 'local'
								? (getProviderKey('local') || 'local-gguf')
								: (MODEL_CATALOG[p as Provider]?.[0]?.id || 'openrouter/free');
							setModelState(defaultModel);
							setConfig('model', defaultModel);
							setActivePanel('chat');
						}}
						onClose={() => setActivePanel('chat')}
						onEnvSet={(key, value) => backend.setEnvVar(key, value)}
					/>
				)}

				{activePanel === 'models' && (
					<ModelPanel
						backend={backend}
						theme={theme}
						provider={provider}
						currentModel={model}
						onSelect={m => {
							setModelState(m);
							setConfig('model', m);
							setActivePanel('chat');
						}}
						onClose={() => setActivePanel('chat')}
					/>
				)}

				{activePanel === 'memory' && (
					<MemoryPanel
						theme={theme}
						messages={chat.messages}
						onClose={() => setActivePanel('chat')}
					/>
				)}
			</Box>

			{/* Input bar — always visible */}
			{activePanel === 'chat' && (
				<InputBar
					theme={theme}
					isStreaming={chat.isStreaming}
					isReady={backend.isReady}
					onSubmit={handleSubmit}
				/>
			)}
		</Box>
	);
}

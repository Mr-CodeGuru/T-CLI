import React, {useState} from 'react';
import {ChatInterface} from './components/ChatInterface.js';
import {SetupWizard} from './components/SetupWizard.js';
import {ensureDirectories} from './utils/paths.js';
import {getDb} from './db/index.js';
import {
	hasAnyProvider,
	injectEnvIntoProcess,
	setProviderKey,
	PROVIDER_ENV_KEY,
} from './utils/keystore.js';
import {setConfig} from './db/index.js';
import {useBackend} from './hooks/useBackend.js';
import type {Provider} from './types/index.js';

// ── Bootstrap ─────────────────────────────────────────────────────────────────
ensureDirectories();
injectEnvIntoProcess(); // Load ~/.mycli/.env → process.env
getDb();               // Run DB migrations

// ── Root App ──────────────────────────────────────────────────────────────────

export default function App() {
	const backend = useBackend();
	const [ready, setReady] = useState<boolean>(() => hasAnyProvider());
	const [provider, setProvider] = useState<Provider>('openrouter');
	const [model, setModel] = useState<string>('openrouter/free');

	function handleWizardComplete(chosenProvider: Provider, chosenModel: string) {
		// Persist chosen provider/model to DB config
		setConfig('provider', chosenProvider);
		setConfig('model', chosenModel);
		setProvider(chosenProvider);
		setModel(chosenModel);
		setReady(true);
	}

	if (!ready) {
		return (
			<SetupWizard backend={backend} onComplete={handleWizardComplete} />
		);
	}

	return <ChatInterface backend={backend} />;
}

// ────────────────────────────────────────────────────────────────────────────
// Slash Command Parser & Dispatcher
// ────────────────────────────────────────────────────────────────────────────

import type {ActivePanel, Provider} from '../types/index.js';

export interface ParsedCommand {
	command: string;
	args: string[];
	raw: string;
}

export type CommandResult =
	| {action: 'panel'; panel: ActivePanel}
	| {action: 'clear'}
	| {action: 'exit'}
	| {action: 'reset'}
	| {action: 'setTheme'; theme: string}
	| {action: 'setProvider'; provider: Provider}
	| {action: 'setModel'; model: string}
	| {action: 'saveSession'; name: string}
	| {action: 'loadSession'; id: string}
	| {action: 'unknown'; raw: string};

export function isSlashCommand(input: string): boolean {
	return input.trimStart().startsWith('/');
}

export function parseCommand(input: string): ParsedCommand {
	const trimmed = input.trim();
	const parts = trimmed.split(/\s+/);
	const command = (parts[0] ?? '').toLowerCase();
	const args = parts.slice(1);
	return {command, args, raw: trimmed};
}

export function dispatchCommand(input: string): CommandResult {
	const {command, args, raw} = parseCommand(input);

	switch (command) {
		case '/help':
			return {action: 'panel', panel: 'help'};
		case '/models':
			return {action: 'panel', panel: 'models'};
		case '/quota':
		case '/usage':
		case '/stats':
			return {action: 'panel', panel: 'quota'};
		case '/sessions':
		case '/history':
			return {action: 'panel', panel: 'sessions'};
		case '/memory':
			return {action: 'panel', panel: 'memory'};
		case '/providers':
			return {action: 'panel', panel: 'providers'};
		case '/setup':
			return {action: 'panel', panel: 'providers'};
		case '/clear':
			return {action: 'clear'};
		case '/exit':
		case '/quit':
		case '/q':
			return {action: 'exit'};
		case '/reset':
			return {action: 'reset'};
		case '/theme': {
			if (args[0]) return {action: 'setTheme', theme: args[0]};
			return {action: 'panel', panel: 'theme'};
		}

		case '/provider': {
			const sub = args[0]?.toLowerCase();
			if (sub === 'switch' && args[1]) {
				return {action: 'setProvider', provider: args[1] as Provider};
			}

			return {action: 'panel', panel: 'providers'};
		}

		case '/model': {
			if (args[0]) return {action: 'setModel', model: args[0]};
			return {action: 'panel', panel: 'models'};
		}

		case '/save': {
			const name = args.join(' ') || `Session ${Date.now()}`;
			return {action: 'saveSession', name};
		}

		case '/load': {
			const id = args[0] ?? '';
			return {action: 'loadSession', id};
		}

		default:
			return {action: 'unknown', raw};
	}
}

// Autocomplete suggestions for partial slash input
export const SLASH_COMMANDS = [
	'/help',
	'/models',
	'/quota',
	'/clear',
	'/exit',
	'/theme',
	'/sessions',
	'/memory',
	'/providers',
	'/setup',
	'/save',
	'/load',
	'/provider switch',
	'/model',
	'/reset',
];

export function getSuggestions(partial: string): string[] {
	if (!partial.startsWith('/')) return [];
	return SLASH_COMMANDS.filter(cmd => cmd.startsWith(partial.toLowerCase()));
}

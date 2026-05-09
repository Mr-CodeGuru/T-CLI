import {useState, useCallback} from 'react';
import {getConfig, setConfig} from '../db/index.js';
import {getTheme, THEME_NAMES} from '../themes/index.js';
import type {Theme} from '../types/index.js';

export interface UseThemeReturn {
	theme: Theme;
	themeName: string;
	setTheme: (name: string) => void;
	themeNames: string[];
}

export function useTheme(): UseThemeReturn {
	const [themeName, setThemeName] = useState<string>(
		() => getConfig('theme', 'gemini-style') ?? 'gemini-style',
	);

	const theme = getTheme(themeName);

	const setTheme = useCallback((name: string) => {
		setThemeName(name);
		setConfig('theme', name);
	}, []);

	return {theme, themeName, setTheme, themeNames: THEME_NAMES};
}

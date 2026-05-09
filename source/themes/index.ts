import type {Theme} from '../types/index.js';
import {geminiStyle} from './gemini-style.js';
import {claudeStyle} from './claude-style.js';
import {matrix} from './matrix.js';
import {minimal} from './minimal.js';
import {nord} from './nord.js';
import {dracula} from './dracula.js';

export const THEMES: Record<string, Theme> = {
	'gemini-style': geminiStyle,
	'claude-style': claudeStyle,
	matrix,
	minimal,
	nord,
	dracula,
};

export const THEME_NAMES = Object.keys(THEMES) as string[];

export function getTheme(name: string): Theme {
	return THEMES[name] ?? geminiStyle;
}

export {geminiStyle, claudeStyle, matrix, minimal, nord, dracula};

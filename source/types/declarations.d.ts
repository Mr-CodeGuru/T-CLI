// Declaration stubs for packages without @types
declare module 'marked-terminal' {
	import type {MarkedExtension} from 'marked';
	export function markedTerminal(options?: Record<string, unknown>): MarkedExtension;
	const _default: (options?: Record<string, unknown>) => MarkedExtension;
	export default _default;
}

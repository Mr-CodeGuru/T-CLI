import {marked} from 'marked';
import {markedTerminal} from 'marked-terminal';

// Register marked-terminal as a proper marked extension (marked v12+ API)
marked.use(markedTerminal() as Parameters<typeof marked.use>[0]);

/**
 * Render a markdown string to ANSI-escaped terminal output.
 */
export function renderMarkdown(md: string): string {
	try {
		return (marked.parse(md) as string).trimEnd();
	} catch {
		// Graceful fallback: return raw text if markdown parsing fails
		return md.trimEnd();
	}
}

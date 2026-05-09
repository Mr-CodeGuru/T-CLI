import React, {useEffect, useState} from 'react';
import {Text} from 'ink';

interface StreamingTextProps {
	content: string;
	color?: string;
	isStreaming?: boolean;
}

const CURSORS = ['_', '_', '_', '_', '_', '_'];

export function StreamingText({content, color, isStreaming}: StreamingTextProps) {
	const [cursorIdx, setCursorIdx] = useState(0);

	useEffect(() => {
		if (!isStreaming) return;
		const iv = setInterval(() => {
			setCursorIdx(i => (i + 1) % CURSORS.length);
		}, 80);
		return () => clearInterval(iv);
	}, [isStreaming]);

	const cursor = CURSORS[cursorIdx] ?? '_';

	return (
		<Text color={color}>
			{content}
			{isStreaming && <Text color={color ?? '#888'}>{cursor}</Text>}
		</Text>
	);
}

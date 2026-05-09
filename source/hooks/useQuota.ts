import {useState, useCallback} from 'react';
import {getDb} from '../db/index.js';
import type {QuotaRecord, SessionQuota, Provider} from '../types/index.js';
import {logger} from '../utils/logger.js';

export interface UseQuotaReturn {
	sessionQuota: SessionQuota;
	allTimeQuota: QuotaRecord[];
	addUsage: (
		provider: Provider,
		model: string,
		promptTokens: number,
		completionTokens: number,
		latencyMs: number,
		reasoningTokens?: number,
	) => void;
	loadAllTime: () => void;
	resetSession: () => void;
}

export function useQuota(): UseQuotaReturn {
	const [sessionQuota, setSessionQuota] = useState<SessionQuota>({
		promptTokens: 0,
		completionTokens: 0,
		requests: 0,
		latencyMs: [],
	});
	const [allTimeQuota, setAllTimeQuota] = useState<QuotaRecord[]>([]);

	const addUsage = useCallback(
		(
			provider: Provider,
			model: string,
			promptTokens: number,
			completionTokens: number,
			latencyMs: number,
			reasoningTokens?: number,
		) => {
			// Update session counters
			setSessionQuota(prev => ({
				promptTokens: prev.promptTokens + promptTokens,
				completionTokens: prev.completionTokens + completionTokens,
				reasoning_tokens: (prev.reasoning_tokens || 0) + (reasoningTokens || 0),
				requests: prev.requests + 1,
				latencyMs: [...prev.latencyMs, latencyMs],
			}));

			// Persist to DB
			try {
				const db = getDb();
				const date = new Date().toISOString().split('T')[0]!;
				const existing = db
					.prepare(
						'SELECT id FROM quota WHERE provider=? AND model=? AND date=?',
					)
					.get(provider, model, date) as {id: number} | undefined;

				if (existing) {
					db.prepare(
						`UPDATE quota SET prompt_tokens = prompt_tokens + ?,
             completion_tokens = completion_tokens + ?,
             reasoning_tokens = COALESCE(reasoning_tokens, 0) + ?,
             requests = requests + 1
             WHERE id = ?`,
					).run(promptTokens, completionTokens, reasoningTokens || 0, existing.id);
				} else {
					db.prepare(
						`INSERT INTO quota(provider, model, prompt_tokens, completion_tokens, reasoning_tokens, requests, date)
             VALUES (?, ?, ?, ?, ?, 1, ?)`,
					).run(provider, model, promptTokens, completionTokens, reasoningTokens || 0, date);
				}
			} catch (e) {
				logger.error('quota persist failed', e);
			}
		},
		[],
	);

	const loadAllTime = useCallback(() => {
		try {
			const db = getDb();
			const rows = db
				.prepare(
					`SELECT provider, model,
            SUM(prompt_tokens) as prompt_tokens,
            SUM(completion_tokens) as completion_tokens,
            SUM(requests) as requests,
            MAX(date) as date
           FROM quota GROUP BY provider, model ORDER BY date DESC`,
				)
				.all() as Array<{
				provider: string;
				model: string;
				prompt_tokens: number;
				completion_tokens: number;
				requests: number;
				date: string;
			}>;
			setAllTimeQuota(
				rows.map(r => ({
					provider: r.provider as Provider,
					model: r.model,
					promptTokens: r.prompt_tokens,
					completionTokens: r.completion_tokens,
					reasoningTokens: (r as any).reasoning_tokens || 0,
					requests: r.requests,
					date: r.date,
				})),
			);
		} catch (e) {
			logger.error('loadAllTime quota failed', e);
		}
	}, []);

	const resetSession = useCallback(() => {
		setSessionQuota({promptTokens: 0, completionTokens: 0, reasoning_tokens: 0, requests: 0, latencyMs: []});
	}, []);

	return {sessionQuota, allTimeQuota, addUsage, loadAllTime, resetSession};
}

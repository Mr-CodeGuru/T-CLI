import {useState, useCallback} from 'react';
import {getQuota, upsertQuota, getAllQuota} from '../db/index.js';
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

			// Persist to JSON DB
			try {
				const date = new Date().toISOString().split('T')[0]!;
				const existing = getQuota(date, provider);

				if (existing && existing.model === model) {
					upsertQuota({
						...existing,
						promptTokens: existing.promptTokens + promptTokens,
						completionTokens: existing.completionTokens + completionTokens,
						reasoningTokens: (existing.reasoningTokens || 0) + (reasoningTokens || 0),
						requests: existing.requests + 1
					});
				} else {
					upsertQuota({
						provider,
						model,
						promptTokens,
						completionTokens,
						reasoningTokens: reasoningTokens || 0,
						requests: 1,
						date
					});
				}
			} catch (e) {
				logger.error('quota persist failed', e);
			}
		},
		[],
	);

	const loadAllTime = useCallback(() => {
		try {
			const rows = getAllQuota();
			setAllTimeQuota(rows);
		} catch (e) {
			logger.error('loadAllTime quota failed', e);
		}
	}, []);

	const resetSession = useCallback(() => {
		setSessionQuota({promptTokens: 0, completionTokens: 0, reasoning_tokens: 0, requests: 0, latencyMs: []});
	}, []);

	return {sessionQuota, allTimeQuota, addUsage, loadAllTime, resetSession};
}

// Remote PR data access (mock data removed)
// This module now provides a thin cached wrapper over the JSONBin source.

import { PullRequestAnalysis } from './types';
import { fetchPRDataFromJsonBin } from './fetch-from-jsonbin';

/**
 * Simple in-memory cache for PR list to avoid excessive network calls when
 * navigating between the dashboard list and detail views. TTL is short so
 * refreshes happen frequently enough during active sessions.
 */
let _cache: { ts: number; data: PullRequestAnalysis[] } | null = null;
const CACHE_TTL_MS = 60_000; // 1 minute

function sortPRs(prs: PullRequestAnalysis[]): PullRequestAnalysis[] {
  return prs.slice().sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

/**
 * Fetch the list of PR analyses from the remote JSONBin source.
 * Falls back to an empty array on error (UI will display empty state).
 * Pass forceRefresh=true to bypass the cache.
 */
export async function fetchPullRequestAnalyses(forceRefresh = false): Promise<PullRequestAnalysis[]> {
  const now = Date.now();
  if (!forceRefresh && _cache && now - _cache.ts < CACHE_TTL_MS) {
    return _cache.data;
  }
  try {
    const remote = await fetchPRDataFromJsonBin();
    const sorted = sortPRs(remote);
    _cache = { ts: now, data: sorted };
    return sorted;
  } catch (e) {
    console.warn('[data] Remote fetch failed – returning empty list:', e);
    _cache = { ts: now, data: [] };
    return [];
  }
}

/**
 * Fetch a single PR analysis by id (e.g. 'pr-3007'). Uses the cached list
 * when available; otherwise re-fetches remote list.
 */
export async function fetchPullRequestAnalysis(id: string): Promise<PullRequestAnalysis | undefined> {
  const list = await fetchPullRequestAnalyses();
  return list.find((p) => p.id === id);
}

/**
 * Explicit cache invalidation helper (not currently wired to UI but available
 * for future manual refresh button if desired).
 */
export function invalidatePRCache(): void {
  _cache = null;
}

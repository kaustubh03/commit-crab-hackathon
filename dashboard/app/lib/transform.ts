// Data transformation utilities for PR analysis
// Converts raw backend JSON (JSONBin) entries into internal PullRequestAnalysis model.

import { PullRequestAnalysis, RawPRApiEntry } from './types';

/**
 * Attempt to derive the <org>/<repo> portion from a GitHub PR URL.
 */
function deriveRepo(prURL?: string): string {
  if (!prURL) return 'unknown/repo';
  try {
    const url = new URL(prURL);
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts.length >= 2) return `${parts[0]}/${parts[1]}`;
  } catch (_) {
    // ignore
  }
  return 'unknown/repo';
}

/**
 * Normalise any AI suggestions object into an array form.
 * If the backend begins returning an array already, we can extend this function.
 */
function normaliseAISuggestions(raw: Record<string, unknown> | undefined, key: string) {
  const suggestions: { id: string; priority: 'High' | 'Medium' | 'Low'; description: string }[] = [];
  if (raw && typeof raw === 'object') {
    // Heuristic extraction for common fields
    const improvement = (raw as any).improvement;
    const accessibility = (raw as any).accessibility;
    if (typeof improvement === 'string') {
      suggestions.push({ id: `${key}-improvement`, priority: 'Medium', description: improvement });
    }
    if (typeof accessibility === 'string') {
      suggestions.push({ id: `${key}-accessibility`, priority: 'High', description: accessibility });
    }
  }
  // Provide fallback sample suggestions if backend object was empty
  if (suggestions.length === 0) {
    suggestions.push(
      {
        id: `${key}-bundle`,
        priority: 'Medium',
        description: 'Consider splitting code to reduce initial JS size (target <120KB).',
      },
      {
        id: `${key}-tests`,
        priority: 'Low',
        description: 'Add regression tests to safeguard performance-sensitive components.',
      },
    );
  }
  return suggestions;
}

/**
 * Map a raw backend entry into the internal model. Some legacy / health metrics are
 * still placeholders until the backend provides these signals directly.
 */
export function mapRawEntry(key: string, entry: RawPRApiEntry): PullRequestAnalysis {
  const total =
    typeof entry.totalBuildSize === 'number'
      ? entry.totalBuildSize
      : (entry.bundleSize?.js || 0) +
        (entry.bundleSize?.css || 0) +
        (entry.bundleSize?.images || 0) +
        (entry.bundleSize?.others || 0);

  return {
    id: `pr-${entry.prnumber}`,
    repo: deriveRepo(entry.prURL),
    prNumber: entry.prnumber,
    title: entry.title,
    author: {
      name: entry.raisedBy || 'unknown',
      avatarUrl: 'https://i.pravatar.cc/150?u=' + (entry.raisedBy || 'unknown'),
    },
    timestamp: entry.PRCreatedOn || new Date().toISOString(),
    shipScore: entry.vitalsAvgScore, // overall ship score currently mapped directly
    health: {
      // Placeholder heuristic values (0-50 scale)
      score: 40,
      metrics: {
        linesChanged: 100, // TODO: replace with backend-provided changes count
        filesTouched: entry.filesChanged,
        hasDescription: !!entry.prDesc,
        hasTests: false, // TODO: backend signal
      },
    },
    performance: {
      // Legacy 0-50 score kept for backwards compatibility; approximate from vitalsAvgScore
      score: Math.min(50, Math.round(entry.vitalsAvgScore / 2)),
      lcpValueMs: entry.vitals?.lcp ? Math.round(entry.vitals.lcp * 1000) : null,
      metrics: {
        hasOversizedImages: false,
        missingFetchPriority: false,
        hasRenderBlockingResources: false,
      },
    },
    vitalsAvgScore: entry.vitalsAvgScore,
    vitals: entry.vitals,
    bundleSize: {
      js: entry.bundleSize?.js || 0,
      css: entry.bundleSize?.css || 0,
      images: entry.bundleSize?.images || 0,
      others: entry.bundleSize?.others || 0,
      total: typeof total === 'number' ? total : undefined,
    },
    totalBuildSize: total,
    rawAISuggestions: entry.AISuggestions,
    aiSuggestions: normaliseAISuggestions(entry.AISuggestions as Record<string, unknown> | undefined, key),
  };
}

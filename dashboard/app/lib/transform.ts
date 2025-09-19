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

  // --- Ship Score Computation --------------------------------------------------------------
  // Health component (0-100): currently scale legacy health.score (0-50) * 2
  const healthScoreLegacy = 40; // placeholder legacy value (0-50)
  const healthComponent = Math.min(100, healthScoreLegacy * 2);

  // Vitals component (0-100): directly from backend aggregate if present
  const vitalsComponent = typeof entry.vitalsAvgScore === 'number' ? entry.vitalsAvgScore : 0;

  // Bundle size component (0-100): score 100 when total <= 150KB, 0 when >= 600KB, linear in between
  const totalBundle = typeof total === 'number' ? total : 0;
  const BUNDLE_GOOD_KB = 150;
  const BUNDLE_BAD_KB = 600;
  let bundleComponent: number;
  if (totalBundle <= BUNDLE_GOOD_KB) bundleComponent = 100;
  else if (totalBundle >= BUNDLE_BAD_KB) bundleComponent = 0;
  else bundleComponent = Math.round(100 - ((totalBundle - BUNDLE_GOOD_KB) / (BUNDLE_BAD_KB - BUNDLE_GOOD_KB)) * 100);

  // Weights (must sum to 1). Rationale:
  // - Web vitals are user-visible performance: 0.45
  // - Health (process / maintainability signals): 0.30
  // - Bundle size (delivery cost): 0.25
  const weights = { health: 0.30, vitals: 0.45, bundle: 0.25 };
  const shipScore = Math.round(
    healthComponent * weights.health + vitalsComponent * weights.vitals + bundleComponent * weights.bundle
  );

  return {
    id: `pr-${entry.prnumber}`,
    repo: deriveRepo(entry.prURL),
    prNumber: entry.prnumber,
    prURL: entry.prURL,
    title: entry.title,
    description: entry.prDesc,
    author: {
      name: entry.raisedBy || 'unknown',
      avatarUrl: 'https://i.pravatar.cc/150?u=' + (entry.raisedBy || 'unknown'),
    },
    timestamp: entry.PRCreatedOn || new Date().toISOString(),
    shipScore,
    shipScoreBreakdown: {
      health: healthComponent,
      vitals: vitalsComponent,
      bundle: bundleComponent,
      weights,
    },
    health: {
      // Placeholder heuristic values (0-50 scale) - kept until backend metrics available
      score: healthScoreLegacy,
      metrics: {
        linesChanged: 100, // TODO: replace with backend-provided changes count
        filesTouched: entry.filesChanged,
        hasDescription: !!entry.prDesc,
        hasTests: false, // TODO: backend signal
      },
    },
    performance: {
      // Legacy 0-50 score kept for backwards compatibility; approximate from vitalsAvgScore
      score: Math.min(50, Math.round(vitalsComponent / 2)),
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

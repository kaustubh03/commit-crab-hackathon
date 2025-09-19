// Mock data for CommitCrab Dashboard
// Simulates PR analysis results returned from backend/AI pipeline
import { PullRequestAnalysis, RawPRApiEntry } from './types';

// Helper to generate ISO timestamps (most recent first)
const now = Date.now();
const day = 1000 * 60 * 60 * 6; // 6 hour intervals for variety

// Example of new backend response shape (single entry) used to enrich the mock
const rawApiSample: Record<string, RawPRApiEntry> = {
  '3007': {
    prnumber: 3007,
    title: 'APPA11Y-3007 Screen Orientation Tabs',
    filesChanged: 1,
    prURL: 'https://github.com/your-org/your-repo/pull/3007',
    prDesc: 'Introduce screen orientation tabs with accessible navigation.',
    vitalsAvgScore: 95,
    raisedBy: 'jane.doe',
    PRCreatedOn: new Date(now - day * 0.5).toISOString(),
    reviewers: ['alice', 'bob'],
    vitals: { lcp: 1.2, tbt: 150, cls: 0.01, fcp: 1.0, si: 0.9, tti: 2.5 },
    bundleSize: { js: 150, css: 50, images: 200, others: 30 },
    totalBuildSize: 150 + 50 + 200 + 30,
    AISuggestions: {
      improvement: 'Reduce JS bundle by code-splitting orientation logic.',
      accessibility: 'Verify tab order with keyboard navigation tests.',
    },
  },
};

export function mapRawEntry(key: string, entry: RawPRApiEntry): PullRequestAnalysis {
  const total = entry.totalBuildSize || entry.bundleSize.js + entry.bundleSize.css + entry.bundleSize.images + entry.bundleSize.others;
  return {
    id: `pr-${entry.prnumber}`,
    repo: 'your-org/your-repo',
    prNumber: entry.prnumber,
    title: entry.title,
    author: {
      name: entry.raisedBy || 'unknown',
      avatarUrl: 'https://i.pravatar.cc/150?u=' + entry.raisedBy,
    },
    timestamp: entry.PRCreatedOn || new Date().toISOString(),
    shipScore: entry.vitalsAvgScore, // For now map vitals to shipScore (could be composite later)
    health: {
      score: 40, // placeholder heuristic for new entries
      metrics: {
        linesChanged: 100, // Not provided by new shape (placeholder)
        filesTouched: entry.filesChanged,
        hasDescription: !!entry.prDesc,
        hasTests: false, // unknown
      },
    },
    performance: {
      score: Math.min(50, Math.round(entry.vitalsAvgScore / 2)), // keep legacy 0-50 scale
      lcpValueMs: entry.vitals.lcp ? Math.round(entry.vitals.lcp * 1000) : null,
      metrics: {
        hasOversizedImages: false,
        missingFetchPriority: false,
        hasRenderBlockingResources: false,
      },
    },
    vitalsAvgScore: entry.vitalsAvgScore,
    vitals: entry.vitals,
    bundleSize: { ...entry.bundleSize, total: typeof total === 'number' ? total : undefined },
    totalBuildSize: total,
    rawAISuggestions: entry.AISuggestions,
    aiSuggestions: [
      {
        id: `${key}-bundle`,
        priority: 'Medium',
        description: 'Consider splitting code to reduce initial JS size (target <120KB).',
      },
      {
        id: `${key}-accessibility`,
        priority: 'High',
        description: 'Add keyboard navigation tests for new orientation tabs.',
      },
    ],
  };
}

// Existing legacy mock entries ---------------------------------------------------------------------------------
export const mockPullRequestAnalyses: PullRequestAnalysis[] = [
  // Mapped new-format entry example (placed at top for recency)
  mapRawEntry('3007', rawApiSample['3007']),
  {
    id: 'pr-108',
    repo: 'commit-crab/engine',
    prNumber: 108,
    title: 'feat: introduce LCP prefetch hints & image optimization',
    author: { name: 'Alice Johnson', avatarUrl: 'https://i.pravatar.cc/150?img=1' },
    timestamp: new Date(now - day * 0).toISOString(),
    shipScore: 86,
    health: {
      score: 44,
      metrics: {
        linesChanged: 420,
        filesTouched: 9,
        hasDescription: true,
        hasTests: true,
      },
    },
    performance: {
      score: 42,
      lcpValueMs: 1850,
      metrics: {
        hasOversizedImages: false,
        missingFetchPriority: false,
        hasRenderBlockingResources: false,
      },
    },
    aiSuggestions: [
      {
        id: 'sug-108-1',
        priority: 'Medium',
        description: 'Consider splitting the optimization module into smaller files for maintainability.',
      },
      {
        id: 'sug-108-2',
        priority: 'Low',
        description: 'Add docs for newly introduced prefetch hint strategy.',
      },
    ],
  },
  {
    id: 'pr-107',
    repo: 'commit-crab/engine',
    prNumber: 107,
    title: 'fix: address render blocking font loading sequence',
    author: { name: 'David Zhang', avatarUrl: 'https://i.pravatar.cc/150?img=2' },
    timestamp: new Date(now - day * 1).toISOString(),
    shipScore: 72,
    health: {
      score: 35,
      metrics: {
        linesChanged: 180,
        filesTouched: 5,
        hasDescription: true,
        hasTests: false,
      },
    },
    performance: {
      score: 37,
      lcpValueMs: 2150,
      metrics: {
        hasOversizedImages: false,
        missingFetchPriority: true,
        hasRenderBlockingResources: false,
      },
    },
    aiSuggestions: [
      {
        id: 'sug-107-1',
        priority: 'High',
        description: 'Add regression tests to prevent reintroduction of blocking font loads.',
      },
      {
        id: 'sug-107-2',
        priority: 'Low',
        description: 'Document font loading strategy in README-performance.md.',
      },
    ],
  },
  {
    id: 'pr-106',
    repo: 'commit-crab/webapp',
    prNumber: 106,
    title: 'chore: refactor test utilities & mocks',
    author: { name: 'Chris Lee', avatarUrl: 'https://i.pravatar.cc/150?img=3' },
    timestamp: new Date(now - day * 2).toISOString(),
    shipScore: 61,
    health: {
      score: 28,
      metrics: {
        linesChanged: 680,
        filesTouched: 18,
        hasDescription: false,
        hasTests: true,
      },
    },
    performance: {
      score: 33,
      lcpValueMs: 2350,
      metrics: {
        hasOversizedImages: false,
        missingFetchPriority: true,
        hasRenderBlockingResources: true,
      },
    },
    aiSuggestions: [
      {
        id: 'sug-106-1',
        priority: 'High',
        description: 'This PR is large; consider splitting refactor into smaller logical pieces for easier review.',
      },
      {
        id: 'sug-106-2',
        priority: 'Medium',
        description: 'Add a summary description to help reviewers understand scope of changes.',
      },
    ],
  },
  {
    id: 'pr-105',
    repo: 'commit-crab/webapp',
    prNumber: 105,
    title: 'feat: add AI suggestion inline UI',
    author: { name: 'Emily Stone', avatarUrl: 'https://i.pravatar.cc/150?img=4' },
    timestamp: new Date(now - day * 3).toISOString(),
    shipScore: 79,
    health: {
      score: 40,
      metrics: {
        linesChanged: 350,
        filesTouched: 11,
        hasDescription: true,
        hasTests: true,
      },
    },
    performance: {
      score: 39,
      lcpValueMs: 2050,
      metrics: {
        hasOversizedImages: false,
        missingFetchPriority: false,
        hasRenderBlockingResources: true,
      },
    },
    aiSuggestions: [
      {
        id: 'sug-105-1',
        priority: 'Medium',
        description: 'Optimize conditional rendering for suggestion list to reduce re-renders.',
      },
    ],
  },
  {
    id: 'pr-104',
    repo: 'commit-crab/cli',
    prNumber: 104,
    title: 'docs: add setup guide for new contributors',
    author: { name: 'Frank Martin', avatarUrl: 'https://i.pravatar.cc/150?img=5' },
    timestamp: new Date(now - day * 4).toISOString(),
    shipScore: 68,
    health: {
      score: 36,
      metrics: {
        linesChanged: 150,
        filesTouched: 4,
        hasDescription: true,
        hasTests: false,
      },
    },
    performance: {
      score: 32,
      lcpValueMs: null,
      metrics: {
        hasOversizedImages: false,
        missingFetchPriority: false,
        hasRenderBlockingResources: false,
      },
    },
    aiSuggestions: [
      {
        id: 'sug-104-1',
        priority: 'Low',
        description: 'Include section on enabling experimental performance flags in local dev.',
      },
    ],
  },
  {
    id: 'pr-103',
    repo: 'commit-crab/cli',
    prNumber: 103,
    title: 'feat: parallel fetch for repo metadata',
    author: { name: 'Alice Johnson', avatarUrl: 'https://i.pravatar.cc/150?img=1' },
    timestamp: new Date(now - day * 5).toISOString(),
    shipScore: 83,
    health: {
      score: 41,
      metrics: {
        linesChanged: 270,
        filesTouched: 7,
        hasDescription: true,
        hasTests: true,
      },
    },
    performance: {
      score: 42,
      lcpValueMs: 1900,
      metrics: {
        hasOversizedImages: false,
        missingFetchPriority: false,
        hasRenderBlockingResources: false,
      },
    },
    aiSuggestions: [
      {
        id: 'sug-103-1',
        priority: 'Low',
        description: 'Add benchmarks comparing sequential vs parallel fetching.',
      },
    ],
  },
  {
    id: 'pr-102',
    repo: 'commit-crab/api',
    prNumber: 102,
    title: 'refactor: abstract scoring pipeline phases',
    author: { name: 'Gina Park', avatarUrl: 'https://i.pravatar.cc/150?img=6' },
    timestamp: new Date(now - day * 6).toISOString(),
    shipScore: 74,
    health: {
      score: 38,
      metrics: {
        linesChanged: 500,
        filesTouched: 14,
        hasDescription: true,
        hasTests: true,
      },
    },
    performance: {
      score: 36,
      lcpValueMs: 2250,
      metrics: {
        hasOversizedImages: false,
        missingFetchPriority: true,
        hasRenderBlockingResources: false,
      },
    },
    aiSuggestions: [
      {
        id: 'sug-102-1',
        priority: 'Medium',
        description: 'Consider extracting scoring adapters into plugins for extensibility.',
      },
    ],
  },
];

// Simulated async fetch with delay
export async function fetchPullRequestAnalyses(useRemote = false): Promise<PullRequestAnalysis[]> {
  if (useRemote) {
    try {
      const { fetchPRDataFromJsonBin } = await import('./fetch-from-jsonbin');
      const remote = await fetchPRDataFromJsonBin();
      if (remote.length > 0) {
        return remote.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      }
    } catch (e) {
      console.warn('[mock-data] Remote fetch failed, falling back to local mock:', e);
    }
  }
  await new Promise((res) => setTimeout(res, 300));
  return mockPullRequestAnalyses.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export async function fetchPullRequestAnalysis(id: string): Promise<PullRequestAnalysis | undefined> {
  await new Promise((res) => setTimeout(res, 250));
  return mockPullRequestAnalyses.find((p) => p.id === id);
}

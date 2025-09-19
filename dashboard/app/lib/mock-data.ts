// Mock data for CommitCrab Dashboard
// Simulates PR analysis results returned from backend/AI pipeline
import { PullRequestAnalysis } from './types';

// Helper to generate ISO timestamps (most recent first)
const now = Date.now();
const day = 1000 * 60 * 60 * 6; // 6 hour intervals for variety

export const mockPullRequestAnalyses: PullRequestAnalysis[] = [
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
export async function fetchPullRequestAnalyses(): Promise<PullRequestAnalysis[]> {
  await new Promise((res) => setTimeout(res, 300));
  return mockPullRequestAnalyses;
}

export async function fetchPullRequestAnalysis(id: string): Promise<PullRequestAnalysis | undefined> {
  await new Promise((res) => setTimeout(res, 250));
  return mockPullRequestAnalyses.find((p) => p.id === id);
}

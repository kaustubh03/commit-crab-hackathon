// Type definitions for CommitCrab Dashboard
// Represents the analysis data for a single pull request

/**
 * Raw API response entry as provided by new backend shape.
 * The API returns an object keyed by PR number e.g. { "3007": RawPRApiEntry }
 */
export interface RawPRApiEntry {
  prnumber: number;
  title: string;
  filesChanged: number;
  prURL: string;
  prDesc: string;
  vitalsAvgScore: number; // 0-100 aggregate of performance vitals
  raisedBy: string;
  PRCreatedOn: string; // ISO 8601
  reviewers: string[]; // reviewer usernames / emails
  vitals: {
    lcp: number; // seconds
    tbt: number; // milliseconds
    cls: number; // unitless
    fcp: number; // seconds
    si: number; // seconds (Speed Index)
    tti: number; // seconds
  };
  bundleSize: {
    js: number; // KB
    css: number; // KB
    images: number; // KB
    others: number; // KB
  };
  totalBuildSize?: number | string; // optional total (KB) or formatted string
  AISuggestions: Record<string, unknown>; // arbitrary JSON object (model generated)
}

// Extended / richer internal representation -------------------------------------------------------
export interface PerformanceVitals {
  lcp?: number; // seconds
  tbt?: number; // ms
  cls?: number;
  fcp?: number; // seconds
  si?: number; // seconds
  tti?: number; // seconds
}

export interface BundleSizeBreakdown {
  js: number; // KB
  css: number; // KB
  images: number; // KB
  others: number; // KB
  total?: number; // KB (computed if not provided)
}

export interface PullRequestAnalysis {
  id: string; // e.g., 'pr-123'
  repo: string; // e.g., 'your-org/your-repo'
  prNumber: number; // e.g., 45
  prURL: string; // direct link to the PR (e.g., GitHub)
  title: string;
  description?: string; // original PR description / body
  author: {
    name: string;
    avatarUrl: string; // URL to an avatar image
  };
  timestamp: string; // ISO 8601 date string
  shipScore: number; // Overall score (0-100)
  // Score Breakdown (legacy / health)
  health: {
    score: number; // Score out of 50
    metrics: {
      linesChanged: number;
      filesTouched: number;
      hasDescription: boolean;
      hasTests: boolean;
    };
  };
  performance: {
    score: number; // Legacy score out of 50 (kept for backwards compatibility)
    lcpValueMs: number | null; // Legacy LCP in milliseconds, null if not run
    metrics: {
      hasOversizedImages: boolean;
      missingFetchPriority: boolean;
      hasRenderBlockingResources: boolean;
    };
  };
  // New performance / size info (optional, populated when backend provides new shape)
  vitalsAvgScore?: number; // 0-100 aggregate of vitals (maps from vitalsAvgScore)
  vitals?: PerformanceVitals;
  bundleSize?: BundleSizeBreakdown;
  totalBuildSize?: number | string; // convenience duplicate for easy display
  rawAISuggestions?: Record<string, unknown>; // raw object form if backend sends non-array suggestions
  // AI-generated suggestions (normalized list form)
  aiSuggestions: {
    id: string;
    priority: 'High' | 'Medium' | 'Low';
    description: string;
  }[];
}

export type PullRequestAnalysisList = PullRequestAnalysis[];

// Filter types for dashboard
export type ProductOption = 
  | 'Web Accessibility'
  | 'App Accessibility'
  | 'Design Accessbility'
  | 'TM'
  | 'Observability'
  | 'Website Scanner'
  | 'Web LCA'
  | 'App LCA';

export interface DashboardFilters {
  product?: ProductOption;
  startDate?: string;
  endDate?: string;
}

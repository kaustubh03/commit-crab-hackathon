// Type definitions for CommitCrab Dashboard
// Represents the analysis data for a single pull request

export interface PullRequestAnalysis {
  id: string; // e.g., 'pr-123'
  repo: string; // e.g., 'your-org/your-repo'
  prNumber: number; // e.g., 45
  title: string;
  author: {
    name: string;
    avatarUrl: string; // URL to an avatar image
  };
  timestamp: string; // ISO 8601 date string
  shipScore: number; // Overall score (0-100)
  // Score Breakdown
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
    score: number; // Score out of 50
    lcpValueMs: number | null; // LCP in milliseconds, null if not run
    metrics: {
      hasOversizedImages: boolean;
      missingFetchPriority: boolean;
      hasRenderBlockingResources: boolean;
    };
  };
  // AI-generated suggestions
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

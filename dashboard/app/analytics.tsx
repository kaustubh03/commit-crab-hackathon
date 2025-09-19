import * as React from 'react';
import { createRoute } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Route as rootRoute } from './_layout';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: 'analytics',
  component: AnalyticsPage,
});

function AnalyticsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Analytics</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Deeper insights & longitudinal metrics (placeholder page).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            This section will provide advanced analysis like per-author averages,
            trending performance regressions, and correlation metrics.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            For now, explore the dashboard overview and individual PR details.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

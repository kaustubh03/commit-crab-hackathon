import * as React from 'react';
import { createRoute, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { fetchPullRequestAnalyses } from './lib/mock-data';
import { average, formatDate } from './utils/format';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import { ScoreBadge } from './components/pr/score-badge';
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { rootRoute } from './_layout';

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: DashboardPage,
  validateSearch: (search: Record<string, unknown>) => search as { [k: string]: unknown }, // placeholder
});

function DashboardPage() {
  const navigate = useNavigate();
  const { data: prs = [], isLoading } = useQuery({
    queryKey: ['prs'],
    queryFn: fetchPullRequestAnalyses,
  });

  const avgShip = Math.round(average(prs.map((p) => p.shipScore)) || 0);
  const avgHealth = Math.round(average(prs.map((p) => p.health.score)) || 0);
  const avgPerf = Math.round(average(prs.map((p) => p.performance.score)) || 0);
  const avgVitals = Math.round(
    average(prs.filter((p) => typeof p.vitalsAvgScore === 'number').map((p) => p.vitalsAvgScore || 0)) || 0
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">PR Ship Score Overview</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Insight into recent pull request quality & performance impact.
        </p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Average Ship Score" value={isLoading ? '—' : avgShip.toString()} />
        <KpiCard title="PRs Analyzed" value={isLoading ? '—' : prs.length.toString()} />
        <KpiCard title="Avg. Health Score" value={isLoading ? '—' : `${avgHealth} / 50`} />
        <KpiCard
          title="Avg. LCP Impact (Legacy)"
          value={isLoading ? '—' : `${avgPerf} / 50`}
        />
        <KpiCard
          title="Avg. Web Vitals Score"
          value={isLoading ? '—' : prs.some((p) => typeof p.vitalsAvgScore === 'number') ? `${avgVitals} / 100` : '—'}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Ship Score Trend (Recent)</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={[...prs].sort((a, b) => a.timestamp.localeCompare(b.timestamp))}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(v) => new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                fontSize={12}
              />
              <YAxis domain={[0, 100]} fontSize={12} />
              <Tooltip
                contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                labelFormatter={(v) => new Date(v).toLocaleString()}
              />
              <Line type="monotone" dataKey="shipScore" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Recent Pull Requests</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b">
                <th className="py-2 pr-4 font-medium">Title</th>
                <th className="py-2 pr-4 font-medium">Author</th>
                <th className="py-2 pr-4 font-medium">Repo</th>
                <th className="py-2 pr-4 font-medium w-40">Ship Score</th>
                <th className="py-2 pr-4 font-medium text-right">Details</th>
              </tr>
            </thead>
            <tbody>
              {prs.map((pr) => (
                <tr
                  key={pr.id}
                  className="border-b last:border-none hover:bg-accent/40 cursor-pointer"
                  onClick={() => navigate({ to: '/pr/$prId', params: { prId: pr.id } })}
                >
                  <td className="py-2 pr-4">
                    <div>
                      <span className="font-medium">#{pr.prNumber}</span>{' '}
                      <span>{pr.title}</span>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {formatDate(pr.timestamp)}
                      </div>
                    </div>
                  </td>
                  <td className="py-2 pr-4">
                    <div className="flex items-center gap-2">
                      <img
                        src={pr.author.avatarUrl}
                        alt={pr.author.name}
                        className="h-6 w-6 rounded-full border"
                      />
                      <span>{pr.author.name}</span>
                    </div>
                  </td>
                  <td className="py-2 pr-4">{pr.repo}</td>
                  <td className="py-2 pr-4">
                    <div className="flex items-center gap-2 w-40">
                      <ScoreBadge value={pr.shipScore} />
                      <Progress value={pr.shipScore} />
                    </div>
                  </td>
                  <td className="py-2 pr-4 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate({ to: '/pr/$prId', params: { prId: pr.id } });
                      }}
                    >
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {isLoading && (
            <div className="text-center py-6 text-muted-foreground text-sm">
              Loading pull requests...
            </div>
          )}
          {!isLoading && prs.length === 0 && (
            <div className="text-center py-6 text-muted-foreground text-sm">
              No PR data available.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface KpiCardProps {
  title: string;
  value: string;
}
function KpiCard({ title, value }: KpiCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-[13px] font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
      </CardContent>
      <div className="absolute inset-0 -z-10 opacity-10 bg-gradient-to-br from-emerald-500 to-transparent" />
    </Card>
  );
}

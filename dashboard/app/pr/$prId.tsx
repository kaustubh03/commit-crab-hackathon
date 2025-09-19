import * as React from 'react';
import { createRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { fetchPullRequestAnalysis } from '../lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { MetricItem } from '../components/pr/metric-item';
import { ScoreBadge } from '../components/pr/score-badge';
import { rootRoute } from '../_layout';
import { formatDate } from '../utils/format';
import { Button } from '../ui/button';

// Lightweight local state for ad-hoc AI suggestions (not persisted in backend mock yet)
interface LocalAISuggestion { id: string; priority: 'High' | 'Medium' | 'Low'; description: string; }

export const prDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'pr/$prId',
  component: PRDetailPage,
});

function PRDetailPage() {
  // Only locally generated suggestions (we intentionally ignore any static/mock suggestions now)
  const [aiSuggestions, setAISuggestions] = React.useState<LocalAISuggestion[]>([]);
  const [generating, setGenerating] = React.useState(false);

  const prId = prDetailRoute.useParams().prId;
  const { data: pr, isLoading } = useQuery({
    queryKey: ['pr', prId],
    queryFn: () => fetchPullRequestAnalysis(prId),
  });

  // Stable storage key per PR (prefer internal id, fallback to prNumber)
  const storageKey = React.useMemo(
    () => (pr ? `aiSuggestions:${pr.id || pr.prNumber}` : ''),
    [pr?.id, pr?.prNumber]
  );

  // Load previously generated suggestions from localStorage (client only)
  React.useEffect(() => {
    if (!storageKey) return;
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setAISuggestions(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to restore AI suggestions from localStorage', e);
    }
  }, [storageKey]);

  const handleAddSuggestions = React.useCallback(
    (incoming: LocalAISuggestion[]) => {
      setAISuggestions((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        const dedupedIncoming = incoming.filter((s) => !seen.has(s.id));
        const merged = [...dedupedIncoming, ...prev]; // prepend new
        try {
          if (storageKey) localStorage.setItem(storageKey, JSON.stringify(merged));
        } catch (e) {
          console.warn('Failed to persist AI suggestions', e);
        }
        return merged;
      });
    },
    [storageKey]
  );

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading PR analysis...</div>;
  }
  if (!pr) {
    return <div className="text-sm text-muted-foreground">Pull Request not found.</div>;
  }

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold tracking-tight flex flex-wrap items-center gap-3 group">
            <ScoreBadge value={pr.shipScore} />
            <button
              onClick={() => window.open(pr.prURL, '_blank')}
              className="inline-flex items-center gap-2 hover:text-primary transition-colors group/link"
              title="Open PR on GitHub"
            >
              <span className="text-muted-foreground">#{pr.prNumber}</span>
              <span className="underline decoration-dotted underline-offset-4 group-hover/link:decoration-solid">
                {pr.title}
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4 opacity-60 group-hover/link:opacity-100 transition-opacity"
              >
                <path d="M18 13v6a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" x2="21" y1="14" y2="3" />
              </svg>
            </button>
          </h2>
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span>
              Repository: <span className="font-medium text-foreground">{pr.repo}</span>
            </span>
            <span>
              Opened: <span className="font-medium text-foreground">{formatDate(pr.timestamp)}</span>
            </span>
            {pr.author?.name && (
              <span>
                Author: <span className="font-medium text-foreground">{pr.author.name}</span>
              </span>
            )}
          </div>
        </div>
        {pr.description && (
          <Accordion defaultValue="desc" className="pt-1">
            <AccordionItem value="desc">
              <AccordionTrigger value="desc" className="bg-muted/40 hover:bg-muted/60">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">PR Description</span>
                  <span className="text-xs text-muted-foreground">Click to expand</span>
                </div>
              </AccordionTrigger>
              <AccordionContent value="desc" className="text-sm leading-relaxed space-y-2">
                {pr.description.split(/\n\n+/).map((para: string, idx: number) => (
                  <p key={idx}>{para}</p>
                ))}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </header>

      <div className="grid gap-6 grid-cols-1 xl:grid-cols-3 items-start">
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle>Overall Ship Score</CardTitle>
            <CardDescription>Total quality & performance readiness</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-10">
              <CircularScore value={pr.shipScore} />
            </div>
            <p className="text-xs text-muted-foreground text-center space-y-1">
              <span className="block">Composite score across Health, Web Vitals & Bundle Size.</span>
              {pr.shipScoreBreakdown && (
                <span className="block text-[10px] tracking-wide">
                  H:{pr.shipScoreBreakdown.health} V:{pr.shipScoreBreakdown.vitals} B:{pr.shipScoreBreakdown.bundle} · wts {Math.round(pr.shipScoreBreakdown.weights.health*100)}/{Math.round(pr.shipScoreBreakdown.weights.vitals*100)}/{Math.round(pr.shipScoreBreakdown.weights.bundle*100)}
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:col-span-2">
           <div className="grid gap-6 md:grid-cols-2">
            {/* Legacy scoring cards (Health + Legacy Performance) */}
            <Card>
              <CardHeader>
                <CardTitle>PR Health</CardTitle>
                <CardDescription>{pr.health.score} / 50</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <MetricItem label="Lines Changed" value={pr.health.metrics.linesChanged} />
                  <MetricItem label="Files Touched" value={pr.health.metrics.filesTouched} />
                  <MetricItem
                    label="Description Provided"
                    value={pr.health.metrics.hasDescription ? '✓' : '✗'}
                    good={pr.health.metrics.hasDescription}
                    bad={!pr.health.metrics.hasDescription}
                  />
                  <MetricItem
                    label="Tests Included"
                    value={pr.health.metrics.hasTests ? '✓' : '✗'}
                    good={pr.health.metrics.hasTests}
                    bad={!pr.health.metrics.hasTests}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>LCP / Performance (Legacy)</CardTitle>
                <CardDescription>{pr.performance.score} / 50</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <MetricItem
                    label="LCP (ms)"
                    value={pr.performance.lcpValueMs ? pr.performance.lcpValueMs : '—'}
                  />
                  <MetricItem
                    label="Oversized Images"
                    value={pr.performance.metrics.hasOversizedImages ? '✗' : '✓'}
                    good={!pr.performance.metrics.hasOversizedImages}
                    bad={pr.performance.metrics.hasOversizedImages}
                  />
                  <MetricItem
                    label="Missing fetchpriority"
                    value={pr.performance.metrics.missingFetchPriority ? '✗' : '✓'}
                    good={!pr.performance.metrics.missingFetchPriority}
                    bad={pr.performance.metrics.missingFetchPriority}
                  />
                  <MetricItem
                    label="Render Blocking Resources"
                    value={pr.performance.metrics.hasRenderBlockingResources ? '✗' : '✓'}
                    good={!pr.performance.metrics.hasRenderBlockingResources}
                    bad={pr.performance.metrics.hasRenderBlockingResources}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* New Vitals & Bundle Size Section (if available) */}
          {(pr.vitals || pr.bundleSize) && (
            <div className="grid gap-6 md:grid-cols-2">
              {pr.vitals && (
                <Card>
                  <CardHeader>
                    <CardTitle>Web Vitals</CardTitle>
                    <CardDescription>
                      {typeof pr.vitalsAvgScore === 'number' ? `${pr.vitalsAvgScore} / 100` : 'Core metrics'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      <MetricItem label="LCP (s)" value={pr.vitals.lcp ?? '—'} />
                      <MetricItem label="FCP (s)" value={pr.vitals.fcp ?? '—'} />
                      <MetricItem label="CLS" value={pr.vitals.cls ?? '—'} />
                      <MetricItem label="TBT (ms)" value={pr.vitals.tbt ?? '—'} />
                      <MetricItem label="TTI (s)" value={pr.vitals.tti ?? '—'} />
                      <MetricItem label="SI (s)" value={pr.vitals.si ?? '—'} />
                    </div>
                  </CardContent>
                </Card>
              )}
              {pr.bundleSize && (
                <Card>
                  <CardHeader>
                    <CardTitle>Bundle Size (KB)</CardTitle>
                    <CardDescription>
                      {typeof pr.bundleSize.total === 'number' ? `${pr.bundleSize.total} KB total` : 'Breakdown'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      <MetricItem label="JS" value={pr.bundleSize.js} />
                      <MetricItem label="CSS" value={pr.bundleSize.css} />
                      <MetricItem label="Images" value={pr.bundleSize.images} />
                      <MetricItem label="Other" value={pr.bundleSize.others} />
                      {typeof pr.bundleSize.total === 'number' && (
                        <MetricItem label="Total" value={pr.bundleSize.total} />
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <Card>
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle>💡 AI-Powered Suggestions</CardTitle>
                <CardDescription>Generate on-demand improvements</CardDescription>
              </div>
              <AISuggestionGenerator
                pr={pr}
                onAddSuggestions={handleAddSuggestions}
                onGeneratingChange={setGenerating}
              />
            </CardHeader>
            <CardContent>
              {/* Shimmer while generating */}
              {generating && (
                <div className="space-y-3 animate-in fade-in-50">
                  {[0,1,2].map((i) => (
                    <div key={i} className="p-3 rounded-md border bg-gradient-to-r from-muted/60 via-muted/40 to-muted/60 animate-pulse space-y-2">
                      <div className="h-4 w-2/3 rounded bg-background/40" />
                      <div className="h-3 w-full rounded bg-background/30" />
                      <div className="h-3 w-5/6 rounded bg-background/20" />
                    </div>
                  ))}
                </div>
              )}

              {!generating && aiSuggestions.length > 0 && (
                <Accordion defaultValue={aiSuggestions[0]?.id}>
                  {aiSuggestions.map((s) => (
                    <AccordionItem key={s.id} value={s.id}>
                      <AccordionTrigger value={s.id}>
                        <div className="flex items-center gap-2">
                          <PriorityBadge priority={s.priority} />
                          <span className="text-left line-clamp-1">{s.description}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent value={s.id}>
                        <div className="flex items-center gap-2 mb-2">
                          <PriorityBadge priority={s.priority} />
                          <span className="text-xs text-muted-foreground">Priority</span>
                        </div>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{s.description}</p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function AISuggestionGenerator({ pr, onAddSuggestions, onGeneratingChange }: { pr: any; onAddSuggestions?: (s: LocalAISuggestion[]) => void; onGeneratingChange?: (g: boolean) => void }) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [glow, setGlow] = React.useState(false);

  async function handleClick() {
    if (!pr) return;
    setLoading(true);
    onGeneratingChange?.(true);
    setError(null);
    setGlow(true);
    setTimeout(() => setGlow(false), 1200);
    try {
      // Derive a GitHub diff URL (heuristic): if pr.prURL ends with /pull/<n>, append .diff
      let diffUrl = '';
      if (pr.prURL && /\/pull\//.test(pr.prURL)) {
        diffUrl = pr.prURL.replace(/\/?$/, '') + '.diff';
      }
      const body = {
        diffUrl,
        shipScore: pr.shipScore,
        health: pr.health,
        performance: pr.performance,
        vitals: pr.vitals,
        bundleSize: pr.bundleSize,
        title: pr.title,
        description: pr.description,
        prNumber: pr.prNumber,
      };
      const res = await fetch('http://localhost:3000/ai/pr-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Request failed');
      const suggestions = Array.isArray(json.suggestions) ? json.suggestions : [];
      if (onAddSuggestions && suggestions.length) {
        onAddSuggestions(suggestions as LocalAISuggestion[]);
      }
      // Provide ephemeral visual success cue
      setGlow(true);
      setTimeout(() => setGlow(false), 1500);
    } catch (e: any) {
      setError(e.message || 'Failed to generate');
    } finally {
      setLoading(false);
      onGeneratingChange?.(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        size="sm"
        variant="outline"
        disabled={loading}
        onClick={handleClick}
        className={glow ? 'shadow-[0_0_0_2px_theme(colors.emerald.400)] animate-pulse' : ''}
      >
        {loading ? 'Thinking…' : 'Generate'}
      </Button>
      {error && <span className="text-[10px] text-destructive max-w-[140px] text-right">{error}</span>}
    </div>
  );
}

function PriorityBadge({ priority }: { priority: 'High' | 'Medium' | 'Low' }) {
  const variant =
    priority === 'High' ? 'destructive' : priority === 'Medium' ? 'warning' : 'outline';
  return <Badge variant={variant}>{priority}</Badge>;
}

interface CircularScoreProps {
  value: number;
  size?: number;
}
function CircularScore({ value, size = 180 }: CircularScoreProps) {
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  // Color thresholds aligned with ScoreBadge & Progress component
  let strokeColor = '#ef4444'; // red-500
  if (value >= 85) strokeColor = '#059669'; // emerald-600
  else if (value >= 70) strokeColor = '#22c55e'; // green-500
  else if (value >= 50) strokeColor = '#eab308'; // yellow-500

  return (
    <svg
      width={size}
      height={size}
      className="overflow-visible"
      role="img"
      aria-label={`Ship score ${value} out of 100`}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="hsl(var(--muted))"
        strokeWidth={stroke}
        fill="none"
        className="opacity-40"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={strokeColor}
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-500 ease-out"
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        className="text-3xl font-bold fill-foreground"
      >
        {value}
      </text>
      <text
        x="50%"
        y="65%"
        dominantBaseline="middle"
        textAnchor="middle"
        className="text-xs font-medium fill-muted-foreground"
      >
        / 100
      </text>
    </svg>
  );
}

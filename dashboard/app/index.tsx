import * as React from "react";
import { createRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchPullRequestAnalyses } from "./lib/mock-data";
import { average, formatDate } from "./utils/format";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { Button } from "./ui/button";
import * as Popover from "@radix-ui/react-popover";
import { DayPicker, DateRange } from "react-day-picker";
import { ScoreBadge } from "./components/pr/score-badge";

import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { rootRoute } from "./_layout";

/**
 * Search params for the dashboard route.
 * range: one of '7d' | '30d' | '90d' | 'all' | 'custom'
 * start/end: YYYY-MM-DD when range === 'custom'
 */
interface DashboardSearch {
  range: string; // keep loose for now, validated at runtime
  start?: string;
  end?: string;
}

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: DashboardPage,
  validateSearch: (search: Record<string, unknown>): DashboardSearch => {
    const range = typeof search.range === "string" ? search.range : "30d";
    const start = typeof search.start === "string" ? search.start : undefined;
    const end = typeof search.end === "string" ? search.end : undefined;
    return { range, start, end };
  },
});

function DashboardPage() {
  const navigate = useNavigate();
  const search = indexRoute.useSearch() as DashboardSearch;

  const { data: prs = [], isLoading } = useQuery({
    queryKey: ["prs"],
    queryFn: () => fetchPullRequestAnalyses(),
  });

  // --- Date range filtering logic ---------------------------------------------------
  const now = React.useMemo(() => new Date(), []);

  const presetToDays: Record<string, number> = {
    "7d": 7,
    "30d": 30,
    "90d": 90,
  };
  let rangeStart: Date | null = null;
  let rangeEnd: Date | null = null; // inclusive end for custom
  let customError: string | null = null;

  if (search.range in presetToDays) {
    rangeStart = new Date(
      now.getTime() - presetToDays[search.range] * 24 * 60 * 60 * 1000,
    );
  } else if (search.range === "custom") {
    if (search.start) rangeStart = new Date(search.start + "T00:00:00");
    if (search.end) rangeEnd = new Date(search.end + "T23:59:59");
    if (rangeStart && rangeEnd && rangeStart > rangeEnd) {
      customError = "Start date must be before or equal to end date.";
    }
  }

  const filteredPrs = React.useMemo(() => {
    if (search.range === "all") return prs;
    return prs.filter((p) => {
      const ts = new Date(p.timestamp).getTime();
      if (search.range === "custom") {
        if (!rangeStart || !rangeEnd || customError) return true; // until fully selected keep all
        return ts >= rangeStart.getTime() && ts <= rangeEnd.getTime();
      }
      if (rangeStart) return ts >= rangeStart.getTime();
      return true;
    });
  }, [prs, search.range, rangeStart, rangeEnd, customError]);

  // Derived KPI metrics based on filtered list
  const avgShip = Math.round(average(filteredPrs.map((p) => p.shipScore)) || 0);
  const avgHealth = Math.round(
    average(filteredPrs.map((p) => p.health.score)) || 0,
  );
  const avgPerf = Math.round(
    average(filteredPrs.map((p) => p.performance.score)) || 0,
  );
  const avgVitals = Math.round(
    average(
      filteredPrs
        .filter((p) => typeof p.vitalsAvgScore === "number")
        .map((p) => p.vitalsAvgScore || 0),
    ) || 0,
  );

  const updateSearch = (partial: Partial<DashboardSearch>) => {
    navigate({
      to: indexRoute.to,
      search: (prev: DashboardSearch) => ({ ...prev, ...partial }),
      replace: true,
    });
  };

  const setPreset = (preset: string) => {
    if (preset === "custom") {
      // initialize custom range with last 7 days if empty
      const today = formatForInput(now);
      const sevenAgo = formatForInput(
        new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
      );
      updateSearch({
        range: "custom",
        start: search.start || sevenAgo,
        end: search.end || today,
      });
    } else {
      updateSearch({ range: preset, start: undefined, end: undefined });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              PR Ship Score Overview
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              Insight into recent pull request quality & performance impact.
            </p>
          </div>
          <DateRangeControls
            search={search}
            onSelectPreset={setPreset}
            onChangeCustom={(start, end) => updateSearch({ start, end })}
            customError={customError}
          />
        </div>
      </div>



      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Average Ship Score"
          value={isLoading ? "—" : avgShip.toString()}
        />
        <KpiCard
          title="PRs Analyzed"
          value={isLoading ? "—" : filteredPrs.length.toString()}
        />
        <KpiCard
          title="Avg. Health Score"
          value={isLoading ? "—" : `${avgHealth} / 50`}
        />
        <KpiCard
          title="Avg. LCP Impact (Legacy)"
          value={isLoading ? "—" : `${avgPerf} / 50`}
        />
        <KpiCard
          title="Avg. Web Vitals Score"
          value={
            isLoading
              ? "—"
              : filteredPrs.some((p) => typeof p.vitalsAvgScore === "number")
                ? `${avgVitals} / 100`
                : "—"
          }
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Ship Score Trend (Filtered)</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={[...filteredPrs].sort((a, b) =>
                a.timestamp.localeCompare(b.timestamp),
              )}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(v) =>
                  new Date(v).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })
                }
                fontSize={12}
              />
              <YAxis domain={[0, 100]} fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                }}
                labelFormatter={(v) => new Date(v).toLocaleString()}
              />
              <Line
                type="monotone"
                dataKey="shipScore"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            Pull Requests ({filteredPrs.length})
          </CardTitle>
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
              {filteredPrs.map((pr) => (
                <tr
                  key={pr.id}
                  className="border-b last:border-none hover:bg-accent/40 cursor-pointer"
                  onClick={() =>
                    navigate({ to: "/pr/$prId", params: { prId: pr.id } })
                  }
                >
                  <td className="py-2 pr-4">
                    <div>
                      <span className="font-medium">#{pr.prNumber}</span>{" "}
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
                        navigate({ to: "/pr/$prId", params: { prId: pr.id } });
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
          {!isLoading && filteredPrs.length === 0 && (
            <div className="text-center py-6 text-muted-foreground text-sm">
              No PR data available for selected range.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// --- Supporting Components -----------------------------------------------------------

function formatForInput(d: Date): string {
  return d.toISOString().slice(0, 10);
}

interface DateRangeControlsProps {
  search: DashboardSearch;
  onSelectPreset: (preset: string) => void;
  onChangeCustom: (start?: string, end?: string) => void;
  customError: string | null;
}

const PRESETS: { key: string; label: string }[] = [
  { key: "7d", label: "Last 7 Days" },
  { key: "30d", label: "Last 30 Days" },
  { key: "90d", label: "Last 90 Days" },
  { key: "all", label: "All" },
  { key: "custom", label: "Custom" },
];

function DateRangeControls({
  search,
  onSelectPreset,
  onChangeCustom,
  customError,
}: DateRangeControlsProps) {
  const [open, setOpen] = React.useState(false);
  const range: DateRange | undefined = React.useMemo(() => {
    if (search.range !== "custom" || !search.start || !search.end)
      return undefined;
    return {
      from: new Date(search.start + "T00:00:00"),
      to: new Date(search.end + "T00:00:00"),
    };
  }, [search]);

  // Local draft range so we can keep the popover open after the first day
  // is clicked (even if a previous complete range existed) and only commit
  // once the user chooses the end date.
  const [draftRange, setDraftRange] = React.useState<DateRange | undefined>(range);
  const [isSelectingEnd, setIsSelectingEnd] = React.useState(false);

  // When the popover opens, initialise the draft with the committed range
  // and reset the selection state.
  React.useEffect(() => {
    if (open) {
      setDraftRange(range);
      setIsSelectingEnd(false);
    }
  }, [open, range]);

  const formatLabel = () => {
    if (search.range !== "custom" || !range?.from || !range.to)
      return "Select range";
    return `${range.from.toLocaleDateString(undefined, { month: "short", day: "numeric" })} - ${range.to.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map((p) => (
          <Button
            key={p.key}
            size="sm"
            variant={search.range === p.key ? "default" : "outline"}
            onClick={() => onSelectPreset(p.key)}
          >
            {p.label}
          </Button>
        ))}
        {search.range === "custom" && (
          <Popover.Root open={open} onOpenChange={setOpen}>
            <Popover.Trigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="min-w-[180px] justify-start text-left font-normal"
              >
                 {formatLabel()} {draftRange && draftRange.from && !draftRange.to ? '(pick end)' : ''}
              </Button>
            </Popover.Trigger>
            <Popover.Portal>
            <Popover.Content
              className="z-[1000] bg-popover text-popover-foreground rounded-md border p-2 shadow-md"
              sideOffset={4}
            >
              <DayPicker
                mode="range"
                selected={draftRange}
                onDayClick={(day) => {
                  // No draft yet or both ends already selected -> start new range
                  if (!draftRange || (draftRange.from && draftRange.to)) {
                    setDraftRange({ from: day, to: undefined });
                    setIsSelectingEnd(true);
                    return;
                  }
                  // Selecting the end date
                  if (draftRange.from && !draftRange.to) {
                    let from = draftRange.from;
                    let to = day;
                    if (to < from) {
                      // swap if user clicked earlier date second
                      [from, to] = [to, from];
                    }
                    setDraftRange({ from, to });
                    // Commit to search params
                    onChangeCustom(formatForInput(from), formatForInput(to));
                    // Close once full range chosen
                    setOpen(false);
                    setIsSelectingEnd(false);
                  }
                }}
                numberOfMonths={2}
                defaultMonth={(draftRange?.from) || new Date()}
                weekStartsOn={1}
                showOutsideDays
              />
            </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
        )}
      </div>
      {customError && search.range === "custom" && (
        <span className="text-destructive text-[11px] font-medium">
          {customError}
        </span>
      )}
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

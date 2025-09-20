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
    Area,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
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
        const start =
            typeof search.start === "string" ? search.start : undefined;
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
            now.getTime() - presetToDays[search.range] * 24 * 60 * 60 * 1000
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
    const avgShip = Math.round(
        average(filteredPrs.map((p) => p.shipScore)) || 0
    );
    const avgHealth = Math.round(
        average(filteredPrs.map((p) => p.health.score)) || 0
    );
    const avgPerf = Math.round(
        average(filteredPrs.map((p) => p.performance.score)) || 0
    );
    const avgVitals = Math.round(
        average(
            filteredPrs
                .filter((p) => typeof p.vitalsAvgScore === "number")
                .map((p) => p.vitalsAvgScore || 0)
        ) || 0
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
                new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000)
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

    // Segmented chart data with dynamic color bands:
    // <30 = red, 30-59 = yellow, >=60 = green.
    // We duplicate transition points across both adjacent bands so the line appears continuous.
    const chartData = React.useMemo(() => {
        const sorted = [...filteredPrs].sort((a, b) =>
            a.timestamp.localeCompare(b.timestamp)
        );
        const getBucket = (s: number) =>
            s < 30 ? "red" : s < 60 ? "yellow" : "green";
        let prev: string | null = null;
        return sorted.map((d) => {
            const bucket = getBucket(d.shipScore);
            const entry: any = {
                ...d,
                shipRed: null as number | null,
                shipYellow: null as number | null,
                shipGreen: null as number | null,
                shipScore: d.shipScore,
            };
            if (bucket === "red") entry.shipRed = d.shipScore;
            else if (bucket === "yellow") entry.shipYellow = d.shipScore;
            else entry.shipGreen = d.shipScore;
            if (prev && prev !== bucket) {
                // duplicate transition point for previous bucket to extend segment to junction
                if (prev === "red") entry.shipRed = d.shipScore;
                else if (prev === "yellow") entry.shipYellow = d.shipScore;
                else entry.shipGreen = d.shipScore;
            }
            prev = bucket;
            return entry;
        });
    }, [filteredPrs]);

    // Custom tooltip to consolidate segmented series into one score display
    const CustomTooltip = React.useCallback(
        ({ active, payload, label }: any) => {
            if (!active || !payload || !payload.length) return null;
            const point = payload.find((p: any) => p.value != null);
            if (!point) return null;
            return (
                <div className="text-xs p-2 border rounded-md bg-background">
                    <div className="font-medium mb-1">
                        {new Date(label).toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1">
                        <span
                            className="inline-block h-2 w-2 rounded-full"
                            style={{ background: point.color }}
                        />
                        Ship Score:{" "}
                        <span className="font-semibold ml-1">
                            {point.value}
                        </span>
                    </div>
                </div>
            );
        },
        []
    );

    // Repository trend data calculation - FIXED to use 'repo' field
    const repoTrendData = React.useMemo(() => {
        if (!filteredPrs.length) return [];

        // Group PRs by repository and week
        const repoWeeklyData: Record<string, Record<string, number[]>> = {};

        filteredPrs.forEach((pr: any) => {
            const repo = pr.repo || "unknown"; // Use 'repo' field instead of 'repository'
            const date = new Date(pr.timestamp);
            // Get start of week (Sunday)
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            weekStart.setHours(0, 0, 0, 0);
            const weekKey = weekStart.toISOString();

            if (!repoWeeklyData[repo]) {
                repoWeeklyData[repo] = {};
            }
            if (!repoWeeklyData[repo][weekKey]) {
                repoWeeklyData[repo][weekKey] = [];
            }
            repoWeeklyData[repo][weekKey].push(pr.shipScore);
        });

        // Calculate weekly averages and create timeline data
        const allWeeks = new Set<string>();
        Object.values(repoWeeklyData).forEach((repoData) => {
            Object.keys(repoData).forEach((week) => allWeeks.add(week));
        });

        const sortedWeeks = Array.from(allWeeks).sort();

        return sortedWeeks.map((week) => {
            const dataPoint: any = {
                timestamp: new Date(week).getTime(),
                week: new Date(week).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                }),
            };

            Object.keys(repoWeeklyData).forEach((repo) => {
                const repoKey = repo.replace(/[^a-zA-Z0-9]/g, "_");
                const weekScores = repoWeeklyData[repo][week];
                if (weekScores && weekScores.length > 0) {
                    const avgScore = Math.round(
                        weekScores.reduce((a, b) => a + b, 0) /
                            weekScores.length
                    );
                    dataPoint[`${repoKey}_score`] = avgScore;
                }
            });

            return dataPoint;
        });
    }, [filteredPrs]);

    // Get unique repositories - FIXED to use 'repo' field
    const repositories = React.useMemo(() => {
        const repos = new Set(
            filteredPrs.map((pr: any) => pr.repo || "unknown")
        );
        return Array.from(repos).filter((repo) => repo !== "unknown");
    }, [filteredPrs]);

    // Repository colors
    const repoColors = React.useMemo(() => {
        const colors = [
            "hsl(142, 76%, 36%)", // Green
            "hsl(221, 83%, 53%)", // Blue
            "hsl(262, 83%, 58%)", // Purple
            "hsl(346, 87%, 43%)", // Red
            "hsl(35, 91%, 62%)", // Orange
            "hsl(191, 95%, 42%)", // Cyan
            "hsl(270, 95%, 75%)", // Light Purple
            "hsl(120, 95%, 35%)", // Dark Green
        ];

        const colorMap: Record<string, string> = {};
        repositories.forEach((repo, index) => {
            colorMap[repo] = colors[index % colors.length];
        });
        return colorMap;
    }, [repositories]);

    // Repository trend tooltip
    const RepoTrendTooltip = React.useCallback(
        ({ active, payload, label }: any) => {
            if (!active || !payload || !payload.length) return null;

            // Filter out null values and get actual data
            const activeData = payload.filter(
                (p: any) => p.value != null && p.value !== undefined
            );
            if (activeData.length === 0) return null;

            return (
                <div className="text-xs p-3 border rounded-md bg-background shadow-lg">
                    <div className="font-medium mb-2">
                        {new Date(label).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                        })}
                    </div>
                    <div className="space-y-1">
                        {activeData.map((item: any, index: number) => (
                            <div
                                key={index}
                                className="flex items-center gap-2"
                            >
                                <span
                                    className="inline-block h-2 w-2 rounded-full"
                                    style={{ background: item.color }}
                                />
                                <span className="text-xs">
                                    {item.name}:{" "}
                                    <span className="font-semibold">
                                        {item.value}
                                    </span>
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            );
        },
        []
    );

    // Pie chart data for score distribution
    const pieChartData = React.useMemo(() => {
        const goodCount = filteredPrs.filter(
            (pr: any) => pr.shipScore >= 70
        ).length;
        const mediumCount = filteredPrs.filter(
            (pr: any) => pr.shipScore >= 40 && pr.shipScore < 70
        ).length;
        const poorCount = filteredPrs.filter(
            (pr: any) => pr.shipScore < 40
        ).length;

        return [
            { name: "Good (≥70)", value: goodCount, color: "#22c55e" },
            { name: "Medium (40-69)", value: mediumCount, color: "#eab308" },
            { name: "Poor (below 40)", value: poorCount, color: "#ef4444" },
        ].filter((item) => item.value > 0);
    }, [filteredPrs]);

    return (
        <div className="space-y-8">
            <div>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">
                            PR Ship Score Overview
                        </h2>
                        <p className="text-muted-foreground text-sm mt-1">
                            Insight into recent pull request quality &
                            performance impact.
                        </p>
                    </div>
                    <DateRangeControls
                        search={search}
                        onSelectPreset={setPreset}
                        onChangeCustom={(start, end) =>
                            updateSearch({ start, end })
                        }
                        customError={customError}
                    />
                </div>
            </div>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-5">
                <KpiCard
                    title="Average Ship Score"
                    value={isLoading ? "—" : avgShip.toString()}
                    tooltip="The overall ship score represents the combined quality of pull requests including performance impact, code health, and web vitals. Scores range from 0-100, with higher scores indicating better quality."
                />
                <KpiCard
                    title="PRs Analyzed"
                    value={isLoading ? "—" : filteredPrs.length.toString()}
                    tooltip="Total number of pull requests analyzed within the selected time period. This includes all PRs that have been processed by the ship score analysis system."
                />
                <KpiCard
                    title="Avg. Health Score"
                    value={isLoading ? "—" : `${avgHealth} / 50`}
                    tooltip="Code health score measures the quality of code changes including complexity, maintainability, and adherence to best practices. Scale: 0-50, where higher values indicate healthier code."
                />
                <KpiCard
                    title="Avg. LCP Impact (Legacy)"
                    value={isLoading ? "—" : `${avgPerf} / 50`}
                    tooltip="Legacy performance metric measuring the impact on Largest Contentful Paint (LCP). This shows how code changes affect page loading performance. Scale: 0-50, where higher values indicate better performance."
                />
                <KpiCard
                    title="Avg. Web Vitals Score"
                    value={
                        isLoading
                            ? "—"
                            : filteredPrs.some(
                                  (p) => typeof p.vitalsAvgScore === "number"
                              )
                            ? `${avgVitals} / 100`
                            : "—"
                    }
                    tooltip="Modern web vitals performance score including Core Web Vitals metrics (LCP, FID, CLS). This provides a comprehensive view of user experience impact. Scale: 0-100, where higher scores indicate better user experience."
                />
            </div>

            {/* Repository Trends and Score Distribution - Two Column Layout */}
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                {/* Repository Ship Score Trends */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <CardTitle className="text-sm">
                                Repository Ship Score Trends (Weekly Averages)
                            </CardTitle>
                            <Popover.Root>
                                <Popover.Trigger asChild>
                                    <button className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition-colors">
                                        <span className="text-xs font-medium">
                                            ?
                                        </span>
                                    </button>
                                </Popover.Trigger>
                                <Popover.Portal>
                                    <Popover.Content
                                        className="z-[1000] w-80 bg-popover text-popover-foreground rounded-md border p-4 shadow-lg"
                                        sideOffset={4}
                                    >
                                        <div className="space-y-2">
                                            <h4 className="font-semibold text-sm">
                                                Repository Trends Explained
                                            </h4>
                                            <p className="text-xs text-muted-foreground leading-relaxed">
                                                This chart shows how different
                                                repositories' code quality
                                                evolves over time by tracking
                                                weekly average ship scores.
                                            </p>
                                            <div className="space-y-1 text-xs">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-muted-foreground">
                                                        •
                                                    </span>
                                                    <span>
                                                        <strong>
                                                            Each Line
                                                        </strong>{" "}
                                                        represents a different
                                                        repository
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-muted-foreground">
                                                        •
                                                    </span>
                                                    <span>
                                                        <strong>
                                                            Weekly Averages
                                                        </strong>{" "}
                                                        are calculated from all
                                                        PRs merged in that week
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-muted-foreground">
                                                        •
                                                    </span>
                                                    <span>
                                                        <strong>
                                                            Higher Trends
                                                        </strong>{" "}
                                                        indicate improving code
                                                        quality and performance
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="pt-2 border-t text-xs text-muted-foreground">
                                                <strong>Use this to:</strong>{" "}
                                                Compare repository health,
                                                identify improvement patterns,
                                                and track quality over time
                                            </div>
                                        </div>
                                        <Popover.Arrow className="fill-popover" />
                                    </Popover.Content>
                                </Popover.Portal>
                            </Popover.Root>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Showing weekly average ship scores across all
                            repositories with PR activity
                        </p>
                    </CardHeader>
                    <CardContent className="h-80">
                        {repoTrendData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={repoTrendData}>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        className="stroke-muted"
                                    />
                                    <XAxis
                                        dataKey="timestamp"
                                        tickFormatter={(v) =>
                                            new Date(v).toLocaleDateString(
                                                undefined,
                                                {
                                                    month: "short",
                                                    day: "numeric",
                                                }
                                            )
                                        }
                                        fontSize={12}
                                    />
                                    <YAxis domain={[0, 100]} fontSize={12} />
                                    <Tooltip
                                        content={RepoTrendTooltip as any}
                                    />

                                    {/* Generate a line for each repository */}
                                    {repositories.map((repo) => {
                                        const repoKey = (
                                            repo as string
                                        ).replace(/[^a-zA-Z0-9]/g, "_");
                                        const color =
                                            repoColors[repo as string];

                                        return (
                                            <Line
                                                key={repo as string}
                                                type="monotone"
                                                dataKey={`${repoKey}_score`}
                                                stroke={color}
                                                strokeWidth={2}
                                                dot={{
                                                    r: 3,
                                                    strokeWidth: 1,
                                                    fill: "hsl(var(--background))",
                                                    stroke: color,
                                                }}
                                                activeDot={{
                                                    r: 5,
                                                    strokeWidth: 2,
                                                }}
                                                connectNulls={false}
                                                strokeLinecap="round"
                                                name={repo as string}
                                            />
                                        );
                                    })}
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                                No repository data available for the selected
                                time range
                            </div>
                        )}
                    </CardContent>

                    {/* Repository Legend */}
                    {repositories.length > 0 && (
                        <CardContent className="pt-0">
                            <div className="flex flex-wrap gap-3 text-xs">
                                <span className="text-muted-foreground font-medium">
                                    Repositories:
                                </span>
                                {repositories.map((repo) => (
                                    <div
                                        key={repo as string}
                                        className="flex items-center gap-1"
                                    >
                                        <span
                                            className="inline-block h-2 w-2 rounded-full"
                                            style={{
                                                background:
                                                    repoColors[repo as string],
                                            }}
                                        />
                                        <span className="text-[11px] max-w-[100px] truncate">
                                            {repo as string}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    )}
                </Card>

                {/* Ship Score Distribution Pie Chart */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <CardTitle className="text-sm">
                                Ship Score Distribution
                            </CardTitle>
                            <Popover.Root>
                                <Popover.Trigger asChild>
                                    <button className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition-colors">
                                        <span className="text-xs font-medium">
                                            ?
                                        </span>
                                    </button>
                                </Popover.Trigger>
                                <Popover.Portal>
                                    <Popover.Content
                                        className="z-[1000] w-80 bg-popover text-popover-foreground rounded-md border p-4 shadow-lg"
                                        sideOffset={4}
                                    >
                                        <div className="space-y-2">
                                            <h4 className="font-semibold text-sm">
                                                Score Distribution Breakdown
                                            </h4>
                                            <p className="text-xs text-muted-foreground leading-relaxed">
                                                This pie chart shows how PRs are
                                                distributed across different
                                                quality tiers based on their
                                                ship scores.
                                            </p>
                                            <div className="space-y-1 text-xs">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-muted-foreground">
                                                        •
                                                    </span>
                                                    <span>
                                                        <strong>
                                                            Good (≥70):
                                                        </strong>{" "}
                                                        High-quality PRs with
                                                        excellent ship scores
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-muted-foreground">
                                                        •
                                                    </span>
                                                    <span>
                                                        <strong>
                                                            Medium (40-69):
                                                        </strong>{" "}
                                                        Acceptable PRs with
                                                        moderate ship scores
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-muted-foreground">
                                                        •
                                                    </span>
                                                    <span>
                                                        <strong>
                                                            Poor (below 40):
                                                        </strong>{" "}
                                                        PRs that need
                                                        improvement before
                                                        shipping
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="pt-2 border-t text-xs text-muted-foreground">
                                                <strong>Use this to:</strong>{" "}
                                                Quickly assess overall code
                                                quality health and identify
                                                improvement areas
                                            </div>
                                        </div>
                                        <Popover.Arrow className="fill-popover" />
                                    </Popover.Content>
                                </Popover.Portal>
                            </Popover.Root>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Distribution of PRs across quality tiers
                        </p>
                    </CardHeader>
                    <CardContent className="h-80">
                        {pieChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieChartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={40}
                                        outerRadius={80}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {pieChartData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={entry.color}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        content={({ active, payload }) => {
                                            if (
                                                active &&
                                                payload &&
                                                payload.length
                                            ) {
                                                const data = payload[0].payload;
                                                return (
                                                    <div className="text-xs p-2 border rounded-md bg-background shadow-lg">
                                                        <p className="font-medium">
                                                            {data.name}
                                                        </p>
                                                        <p className="text-muted-foreground">
                                                            {data.value} PRs (
                                                            {Math.round(
                                                                (data.value /
                                                                    filteredPrs.length) *
                                                                    100
                                                            )}
                                                            %)
                                                        </p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                                No data available for distribution analysis
                            </div>
                        )}
                    </CardContent>

                    {/* Legend */}
                    <CardContent className="pt-0">
                        <div className="flex items-center gap-4 flex-wrap">
                            {pieChartData.map((item) => (
                                <div
                                    key={item.name}
                                    className="flex items-center justify-between text-xs"
                                >
                                    <div className="flex items-center gap-2">
                                        <span
                                            className="inline-block h-3 w-3 rounded-full"
                                            style={{ background: item.color }}
                                        />
                                        <span className="text-[11px]">
                                            {item.name}: {item.value} PRs
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

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
                                <th className="py-2 pr-4 font-medium">
                                    Author
                                </th>
                                <th className="py-2 pr-4 font-medium">Repo</th>
                                <th className="py-2 pr-4 font-medium w-40">
                                    Ship Score
                                </th>
                                <th className="py-2 pr-4 font-medium text-right">
                                    Details
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPrs.map((pr) => (
                                <tr
                                    key={pr.id}
                                    className="border-b last:border-none hover:bg-accent/40 cursor-pointer"
                                    onClick={() =>
                                        navigate({
                                            to: "/pr/$prId",
                                            params: { prId: pr.id },
                                        })
                                    }
                                >
                                    <td className="py-2 pr-4">
                                        <div>
                                            <span className="font-medium">
                                                #{pr.prNumber}
                                            </span>{" "}
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
                                                navigate({
                                                    to: "/pr/$prId",
                                                    params: { prId: pr.id },
                                                });
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
    const [draftRange, setDraftRange] = React.useState<DateRange | undefined>(
        range
    );
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
        return `${range.from.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
        })} - ${range.to.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
        })}`;
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
                                {formatLabel()}{" "}
                                {draftRange && draftRange.from && !draftRange.to
                                    ? "(pick end)"
                                    : ""}
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
                                        if (
                                            !draftRange ||
                                            (draftRange.from && draftRange.to)
                                        ) {
                                            setDraftRange({
                                                from: day,
                                                to: undefined,
                                            });
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
                                            onChangeCustom(
                                                formatForInput(from),
                                                formatForInput(to)
                                            );
                                            // Close once full range chosen
                                            setOpen(false);
                                            setIsSelectingEnd(false);
                                        }
                                    }}
                                    numberOfMonths={2}
                                    defaultMonth={
                                        draftRange?.from || new Date()
                                    }
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
    tooltip?: string;
}
function KpiCard({ title, value, tooltip }: KpiCardProps) {
    return (
        <Card className="relative overflow-hidden">
            <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                    <CardTitle className="text-[13px] font-medium text-muted-foreground">
                        {title}
                    </CardTitle>
                    {tooltip && (
                        <Popover.Root>
                            <Popover.Trigger asChild>
                                <button className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition-colors">
                                    <span className="text-xs font-medium">
                                        ?
                                    </span>
                                </button>
                            </Popover.Trigger>
                            <Popover.Portal>
                                <Popover.Content
                                    className="z-[1000] w-80 bg-popover text-popover-foreground rounded-md border p-4 shadow-lg"
                                    sideOffset={4}
                                >
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        {tooltip}
                                    </p>
                                    <Popover.Arrow className="fill-popover" />
                                </Popover.Content>
                            </Popover.Portal>
                        </Popover.Root>
                    )}
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="text-2xl font-semibold tracking-tight">
                    {value}
                </div>
            </CardContent>
            <div className="absolute inset-0 -z-10 opacity-10 bg-gradient-to-br from-emerald-500 to-transparent" />
        </Card>
    );
}

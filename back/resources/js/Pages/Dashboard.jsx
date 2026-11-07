import { Head, Link } from '@inertiajs/react';
import { Activity, Bell, FolderGit2, GitBranch, ShieldAlert } from 'lucide-react';
import { useState } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { get } from '../api/client';
import BuildStatusBadge from '../components/BuildStatusBadge';
import EmptyState from '../components/EmptyState';
import { Select } from '../components/FormControls';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import { useAsync } from '../hooks/useAsync';
import AppLayout from '../layouts/AppLayout';
import { formatDate, SEVERITY_ORDER, SEVERITY_STYLES } from '../utils/format';

const CHART_KEYS = [
    { key: 'total_critical', name: 'Critical', color: SEVERITY_STYLES.CRITICAL.chart },
    { key: 'total_high', name: 'High', color: SEVERITY_STYLES.HIGH.chart },
    { key: 'total_medium', name: 'Medium', color: SEVERITY_STYLES.MEDIUM.chart },
    { key: 'total_low', name: 'Low', color: SEVERITY_STYLES.LOW.chart },
];

function SeverityBreakdown({ bySeverity, total }) {
    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-zinc-200">Open findings by severity</h2>
                <span className="text-xs text-zinc-500">{total} total</span>
            </div>

            <div className="mt-5 flex flex-col gap-3.5">
                {SEVERITY_ORDER.map((severity) => {
                    const count = bySeverity?.[severity] ?? 0;
                    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                    const style = SEVERITY_STYLES[severity];

                    return (
                        <div key={severity}>
                            <div className="mb-1.5 flex items-center justify-between text-xs">
                                <span className="flex items-center gap-2 text-zinc-400">
                                    <span className={`h-2 w-2 rounded-full ${style.dot}`} />
                                    {style.label}
                                </span>
                                <span className="font-medium text-zinc-300">
                                    {count}
                                    <span className="ml-1.5 text-zinc-600">{percentage}%</span>
                                </span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                                <div
                                    className={`h-full rounded-full ${style.bar} transition-all duration-500`}
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function TrendsChart({ trends }) {
    if (!trends?.length) {
        return (
            <div className="flex h-72 items-center justify-center px-4 text-center text-sm text-zinc-500">
                No scan data yet. Push your first build to see security trends.
            </div>
        );
    }

    return (
        <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trends} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis
                        dataKey="app_version"
                        stroke="#71717a"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        stroke="#71717a"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                    />
                    <Tooltip
                        cursor={{ fill: 'rgba(63, 63, 70, 0.25)' }}
                        contentStyle={{
                            backgroundColor: '#18181b',
                            border: '1px solid #3f3f46',
                            borderRadius: '8px',
                            fontSize: '12px',
                            color: '#f4f4f5',
                        }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    {CHART_KEYS.map(({ key, name, color }) => (
                        <Bar key={key} dataKey={key} name={name} stackId="findings" fill={color} />
                    ))}
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

export default function Dashboard() {
    const [projectId, setProjectId] = useState('');

    const projects = useAsync(() => get('/projects', { per_page: 100 }), []);
    const summary = useAsync(
        () => get('/dashboard/summary', { project_id: projectId || undefined }),
        [projectId],
    );
    const trends = useAsync(
        () => get('/dashboard/trends', { project_id: projectId || undefined }),
        [projectId],
    );

    const data = summary.data;
    const bySeverity = data?.open_findings?.by_severity ?? {};
    const openTotal = data?.open_findings?.total ?? 0;

    return (
        <AppLayout title="Dashboard">
            <Head title="Dashboard" />

            <PageHeader
                title="Security overview"
                description="Dependency scans, build health, and findings across your repositories."
                actions={
                    <Select
                        aria-label="Filter by project"
                        className="w-56"
                        value={projectId}
                        onChange={(event) => setProjectId(event.target.value)}
                    >
                        <option value="">All projects</option>
                        {(projects.data?.data ?? []).map((project) => (
                            <option key={project.id} value={project.id}>
                                {project.name}
                            </option>
                        ))}
                    </Select>
                }
            />

            {summary.error ? (
                <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                    Failed to load dashboard summary.
                </p>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    label="Open findings"
                    value={summary.loading && !data ? '…' : openTotal}
                    icon={ShieldAlert}
                    accent={openTotal > 0 ? 'text-red-400' : 'text-emerald-400'}
                    hint={`${bySeverity.CRITICAL ?? 0} critical · ${bySeverity.HIGH ?? 0} high`}
                />
                <StatCard
                    label="Total builds"
                    value={summary.loading && !data ? '…' : data?.total_builds ?? 0}
                    icon={Activity}
                    hint="All recorded scans"
                />
                <StatCard
                    label="Projects"
                    value={summary.loading && !data ? '…' : data?.total_projects ?? 0}
                    icon={FolderGit2}
                    hint="Connected repositories"
                />
                <StatCard
                    label="Unread alerts"
                    value={summary.loading && !data ? '…' : data?.unread_notifications ?? 0}
                    icon={Bell}
                    accent={(data?.unread_notifications ?? 0) > 0 ? 'text-amber-400' : 'text-zinc-100'}
                    hint="New findings waiting"
                />
            </div>

            <div className="mt-6 grid gap-4 xl:grid-cols-3">
                <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 xl:col-span-2">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <h2 className="text-sm font-medium text-zinc-200">Findings per application version</h2>
                        <span className="text-xs text-zinc-500">latest build per version</span>
                    </div>
                    {trends.loading && !trends.data ? (
                        <div className="h-72 animate-pulse rounded-lg bg-zinc-800/50" />
                    ) : (
                        <TrendsChart trends={trends.data?.trends} />
                    )}
                </div>

                <SeverityBreakdown bySeverity={bySeverity} total={openTotal} />
            </div>

            <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900">
                <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
                    <h2 className="text-sm font-medium text-zinc-200">Recent builds</h2>
                    <Link href="/builds" className="text-xs font-medium text-emerald-400 hover:text-emerald-300">
                        View all →
                    </Link>
                </div>

                {summary.loading && !data ? (
                    <div className="space-y-3 p-5">
                        {[0, 1, 2].map((row) => (
                            <div key={row} className="h-8 animate-pulse rounded bg-zinc-800/50" />
                        ))}
                    </div>
                ) : (data?.recent_builds ?? []).length === 0 ? (
                    <div className="p-5">
                        <EmptyState
                            icon={GitBranch}
                            title="No builds yet"
                            description="Ingest your first scan from CI to populate the dashboard."
                        />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-zinc-800 text-[11px] uppercase tracking-wide text-zinc-500">
                                    <th className="px-5 py-3 font-medium">Project</th>
                                    <th className="px-5 py-3 font-medium">Branch</th>
                                    <th className="px-5 py-3 font-medium">Version</th>
                                    <th className="px-5 py-3 font-medium">Status</th>
                                    <th className="px-5 py-3 font-medium">C / H</th>
                                    <th className="px-5 py-3 font-medium">Scanned</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/70">
                                {(data?.recent_builds ?? []).map((build) => (
                                    <tr key={build.id} className="transition hover:bg-zinc-800/30">
                                        <td className="px-5 py-3 text-zinc-200">{build.project_name}</td>
                                        <td className="px-5 py-3 font-mono text-xs text-zinc-400">{build.branch}</td>
                                        <td className="px-5 py-3 text-zinc-300">{build.app_version}</td>
                                        <td className="px-5 py-3">
                                            <BuildStatusBadge status={build.status} />
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className="inline-flex items-center gap-2 text-zinc-400">
                                                <span className="text-red-400">{build.total_critical}</span>
                                                <span className="text-zinc-700">/</span>
                                                <span className="text-orange-400">{build.total_high}</span>
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-zinc-500">{formatDate(build.created_at)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

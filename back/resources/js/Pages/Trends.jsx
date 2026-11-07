import { Head } from '@inertiajs/react';
import { GitCommitHorizontal, TrendingUp } from 'lucide-react';
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
import { useAsync } from '../hooks/useAsync';
import AppLayout from '../layouts/AppLayout';
import { formatDate, SEVERITY_STYLES, shortHash } from '../utils/format';

const CHART_KEYS = [
    { key: 'total_critical', name: 'Critical', color: SEVERITY_STYLES.CRITICAL.chart },
    { key: 'total_high', name: 'High', color: SEVERITY_STYLES.HIGH.chart },
    { key: 'total_medium', name: 'Medium', color: SEVERITY_STYLES.MEDIUM.chart },
    { key: 'total_low', name: 'Low', color: SEVERITY_STYLES.LOW.chart },
];

export default function Trends() {
    const [projectId, setProjectId] = useState('');

    const projects = useAsync(() => get('/projects', { per_page: 100 }), []);

    const trends = useAsync(
        () => get('/dashboard/trends', { project_id: projectId || undefined }),
        [projectId],
    );

    const history = useAsync(
        () => (projectId ? get('/dashboard/version-history', { project_id: projectId }) : null),
        [projectId],
    );

    const trendRows = trends.data?.trends ?? [];
    const versions = history.data?.versions ?? [];

    return (
        <AppLayout title="Version Trends">
            <Head title="Version Trends" />

            <PageHeader
                title="Security trends per version"
                description="How the severity profile of your application evolves across releases."
                actions={
                    <Select
                        aria-label="Select project"
                        className="w-56"
                        value={projectId}
                        onChange={(event) => setProjectId(event.target.value)}
                    >
                        <option value="">Select a project…</option>
                        {(projects.data?.data ?? []).map((project) => (
                            <option key={project.id} value={project.id}>
                                {project.name}
                            </option>
                        ))}
                    </Select>
                }
            />

            {!projectId ? (
                <EmptyState
                    icon={TrendingUp}
                    title="Choose a project"
                    description="Select a project to compare findings and build outcomes across its application versions."
                />
            ) : (
                <>
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <h2 className="text-sm font-medium text-zinc-200">Severity breakdown per version</h2>
                            <span className="text-xs text-zinc-500">latest build per version</span>
                        </div>

                        {trends.loading && !trends.data ? (
                            <div className="h-72 animate-pulse rounded-lg bg-zinc-800/50" />
                        ) : trendRows.length === 0 ? (
                            <div className="flex h-72 items-center justify-center text-sm text-zinc-500">
                                No builds recorded for this project yet.
                            </div>
                        ) : (
                            <div className="h-72 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={trendRows} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
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
                                            <Bar
                                                key={key}
                                                dataKey={key}
                                                name={name}
                                                stackId="findings"
                                                fill={color}
                                            />
                                        ))}
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>

                    <div className="mt-6">
                        <h2 className="mb-3 text-sm font-medium text-zinc-200">Version history</h2>

                        {history.loading && !history.data ? (
                            <div className="space-y-3">
                                {[0, 1].map((row) => (
                                    <div key={row} className="h-24 animate-pulse rounded-xl bg-zinc-900" />
                                ))}
                            </div>
                        ) : versions.length === 0 ? (
                            <EmptyState
                                icon={GitCommitHorizontal}
                                title="No version history"
                                description="Ingest scans with an app_version to build the release timeline."
                            />
                        ) : (
                            <div className="flex flex-col gap-4">
                                {versions.map((version) => (
                                    <div
                                        key={`${version.app_version}-${version.latest_build_id}`}
                                        className="rounded-xl border border-zinc-800 bg-zinc-900"
                                    >
                                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <span className="font-mono text-sm font-semibold text-zinc-100">
                                                    v{version.app_version}
                                                </span>
                                                <BuildStatusBadge status={version.latest_status} />
                                                <span className="text-xs text-zinc-500">
                                                    {version.build_count} build{version.build_count === 1 ? '' : 's'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="overflow-x-auto">
                                            <table className="min-w-full text-left text-sm">
                                                <thead>
                                                    <tr className="border-b border-zinc-800/70 text-[11px] uppercase tracking-wide text-zinc-500">
                                                        <th className="px-5 py-2.5 font-medium">Commit</th>
                                                        <th className="px-5 py-2.5 font-medium">Branch</th>
                                                        <th className="px-5 py-2.5 font-medium">Status</th>
                                                        <th className="px-5 py-2.5 font-medium">C</th>
                                                        <th className="px-5 py-2.5 font-medium">H</th>
                                                        <th className="px-5 py-2.5 font-medium">M</th>
                                                        <th className="px-5 py-2.5 font-medium">L</th>
                                                        <th className="px-5 py-2.5 font-medium">Scanned</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-zinc-800/50">
                                                    {version.builds.map((build) => (
                                                        <tr key={build.id} className="hover:bg-zinc-800/30">
                                                            <td className="px-5 py-3 font-mono text-xs text-zinc-500">
                                                                {shortHash(build.commit_hash)}
                                                            </td>
                                                            <td className="px-5 py-3 font-mono text-xs text-zinc-400">
                                                                {build.branch}
                                                            </td>
                                                            <td className="px-5 py-3">
                                                                <BuildStatusBadge status={build.status} />
                                                            </td>
                                                            <td className="px-5 py-3 font-medium text-red-400">
                                                                {build.total_critical}
                                                            </td>
                                                            <td className="px-5 py-3 font-medium text-orange-400">
                                                                {build.total_high}
                                                            </td>
                                                            <td className="px-5 py-3 font-medium text-amber-400">
                                                                {build.total_medium}
                                                            </td>
                                                            <td className="px-5 py-3 font-medium text-sky-400">
                                                                {build.total_low}
                                                            </td>
                                                            <td className="px-5 py-3 text-zinc-500">
                                                                {formatDate(build.created_at)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </AppLayout>
    );
}

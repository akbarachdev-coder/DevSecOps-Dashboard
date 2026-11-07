import { Head } from '@inertiajs/react';
import { GitBranch, Search } from 'lucide-react';
import { useState } from 'react';
import { get } from '../api/client';
import BuildStatusBadge from '../components/BuildStatusBadge';
import EmptyState from '../components/EmptyState';
import { Input, Select } from '../components/FormControls';
import PageHeader from '../components/PageHeader';
import Pagination from '../components/Pagination';
import { useAsync } from '../hooks/useAsync';
import AppLayout from '../layouts/AppLayout';
import { formatDuration, formatDate, shortHash } from '../utils/format';

const STATUS_OPTIONS = [
    { value: '', label: 'All statuses' },
    { value: 'passed', label: 'Passed' },
    { value: 'failed', label: 'Failed' },
    { value: 'action_required', label: 'Action required' },
];

export default function Builds() {
    const [filters, setFilters] = useState({
        project_id: '',
        status: '',
        app_version: '',
        page: 1,
    });

    const projects = useAsync(() => get('/projects', { per_page: 100 }), []);

    const builds = useAsync(
        () =>
            get('/builds', {
                project_id: filters.project_id || undefined,
                status: filters.status || undefined,
                app_version: filters.app_version || undefined,
                page: filters.page,
                per_page: 15,
            }),
        [filters.project_id, filters.status, filters.app_version, filters.page],
    );

    const projectName = (id) => projects.data?.data?.find((project) => project.id === id)?.name ?? `#${id}`;

    const updateFilter = (key, value) => {
        setFilters((previous) => ({ ...previous, [key]: value, page: 1 }));
    };

    const rows = builds.data?.data ?? [];

    return (
        <AppLayout title="Build History">
            <Head title="Build History" />

            <PageHeader
                title="Build history"
                description="Every ingested scan with its security gate status."
            />

            <div className="mb-4 flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4 sm:flex-row sm:items-end">
                <div className="flex-1">
                    <label htmlFor="filter-project" className="mb-1.5 block text-xs font-medium text-zinc-500">
                        Project
                    </label>
                    <Select
                        id="filter-project"
                        value={filters.project_id}
                        onChange={(event) => updateFilter('project_id', event.target.value)}
                    >
                        <option value="">All projects</option>
                        {(projects.data?.data ?? []).map((project) => (
                            <option key={project.id} value={project.id}>
                                {project.name}
                            </option>
                        ))}
                    </Select>
                </div>

                <div className="flex-1">
                    <label htmlFor="filter-status" className="mb-1.5 block text-xs font-medium text-zinc-500">
                        Status
                    </label>
                    <Select
                        id="filter-status"
                        value={filters.status}
                        onChange={(event) => updateFilter('status', event.target.value)}
                    >
                        {STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </Select>
                </div>

                <div className="flex-1">
                    <label htmlFor="filter-version" className="mb-1.5 block text-xs font-medium text-zinc-500">
                        App version
                    </label>
                    <Input
                        id="filter-version"
                        type="text"
                        placeholder="e.g. 1.2.0"
                        value={filters.app_version}
                        onChange={(event) => updateFilter('app_version', event.target.value)}
                    />
                </div>

                <button
                    type="button"
                    onClick={() => builds.refetch()}
                    className="flex items-center justify-center gap-2 rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800"
                >
                    <Search className="h-4 w-4" aria-hidden="true" />
                    Refresh
                </button>
            </div>

            {builds.error ? (
                <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                    Failed to load builds.
                </p>
            ) : null}

            <div className="rounded-xl border border-zinc-800 bg-zinc-900">
                {builds.loading && !builds.data ? (
                    <div className="space-y-3 p-5">
                        {[0, 1, 2, 3, 4].map((row) => (
                            <div key={row} className="h-10 animate-pulse rounded bg-zinc-800/50" />
                        ))}
                    </div>
                ) : rows.length === 0 ? (
                    <div className="p-5">
                        <EmptyState
                            icon={GitBranch}
                            title="No builds found"
                            description="Adjust your filters, or ingest a scan from CI to get started."
                        />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-zinc-800 text-[11px] uppercase tracking-wide text-zinc-500">
                                    <th className="px-5 py-3 font-medium">Project</th>
                                    <th className="px-5 py-3 font-medium">Commit</th>
                                    <th className="px-5 py-3 font-medium">Branch</th>
                                    <th className="px-5 py-3 font-medium">Version</th>
                                    <th className="px-5 py-3 font-medium">Scanner</th>
                                    <th className="px-5 py-3 font-medium">Status</th>
                                    <th className="px-5 py-3 font-medium">C</th>
                                    <th className="px-5 py-3 font-medium">H</th>
                                    <th className="px-5 py-3 font-medium">M</th>
                                    <th className="px-5 py-3 font-medium">L</th>
                                    <th className="px-5 py-3 font-medium">Duration</th>
                                    <th className="px-5 py-3 font-medium">Scanned</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/70">
                                {rows.map((build) => (
                                    <tr key={build.id} className="transition hover:bg-zinc-800/30">
                                        <td className="px-5 py-3 text-zinc-200">{projectName(build.project_id)}</td>
                                        <td className="px-5 py-3 font-mono text-xs text-zinc-500">
                                            {shortHash(build.commit_hash)}
                                        </td>
                                        <td className="px-5 py-3 font-mono text-xs text-zinc-400">{build.branch}</td>
                                        <td className="px-5 py-3 text-zinc-300">{build.app_version}</td>
                                        <td className="px-5 py-3 text-zinc-500">{build.scanner_tool}</td>
                                        <td className="px-5 py-3">
                                            <BuildStatusBadge status={build.status} />
                                        </td>
                                        <td className="px-5 py-3 font-medium text-red-400">{build.total_critical}</td>
                                        <td className="px-5 py-3 font-medium text-orange-400">{build.total_high}</td>
                                        <td className="px-5 py-3 font-medium text-amber-400">{build.total_medium}</td>
                                        <td className="px-5 py-3 font-medium text-sky-400">{build.total_low}</td>
                                        <td className="px-5 py-3 text-zinc-500">{formatDuration(build.duration_seconds)}</td>
                                        <td className="px-5 py-3 text-zinc-500">{formatDate(build.created_at)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <Pagination
                meta={builds.data?.meta}
                onPageChange={(page) => setFilters((previous) => ({ ...previous, page }))}
            />
        </AppLayout>
    );
}

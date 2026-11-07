import { Head } from '@inertiajs/react';
import { Check, EyeOff, RotateCcw, ShieldAlert } from 'lucide-react';
import { useState } from 'react';
import { get, patch } from '../api/client';
import EmptyState from '../components/EmptyState';
import FindingStatusBadge from '../components/FindingStatusBadge';
import { Select } from '../components/FormControls';
import PageHeader from '../components/PageHeader';
import Pagination from '../components/Pagination';
import SeverityBadge from '../components/SeverityBadge';
import { useAsync } from '../hooks/useAsync';
import AppLayout from '../layouts/AppLayout';
import { SEVERITY_ORDER } from '../utils/format';

const STATUS_OPTIONS = [
    { value: '', label: 'All statuses' },
    { value: 'open', label: 'Open' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'ignored_false_positive', label: 'False positive' },
];

export default function Vulnerabilities() {
    const [filters, setFilters] = useState({
        project_id: '',
        severity: '',
        status: 'open',
        page: 1,
    });
    const [actionError, setActionError] = useState(null);
    const [pendingId, setPendingId] = useState(null);
    const [expandedId, setExpandedId] = useState(null);

    const projects = useAsync(() => get('/projects', { per_page: 100 }), []);

    const vulnerabilities = useAsync(
        () =>
            get('/vulnerabilities', {
                project_id: filters.project_id || undefined,
                severity: filters.severity || undefined,
                status: filters.status || undefined,
                page: filters.page,
                per_page: 15,
            }),
        [filters.project_id, filters.severity, filters.status, filters.page],
    );

    const rows = vulnerabilities.data?.data ?? [];

    const updateFilter = (key, value) => {
        setFilters((previous) => ({ ...previous, [key]: value, page: 1 }));
    };

    const updateStatus = async (vulnerability, status) => {
        setPendingId(vulnerability.id);
        setActionError(null);

        try {
            await patch(`/vulnerabilities/${vulnerability.id}`, { status });
            await vulnerabilities.refetch();
        } catch (error) {
            setActionError(error.message || 'Failed to update finding.');
        } finally {
            setPendingId(null);
        }
    };

    return (
        <AppLayout title="Findings">
            <Head title="Findings" />

            <PageHeader
                title="Security findings"
                description="Track dependency vulnerabilities by severity and triage their status."
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
                    <label htmlFor="filter-severity" className="mb-1.5 block text-xs font-medium text-zinc-500">
                        Severity
                    </label>
                    <Select
                        id="filter-severity"
                        value={filters.severity}
                        onChange={(event) => updateFilter('severity', event.target.value)}
                    >
                        <option value="">All severities</option>
                        {SEVERITY_ORDER.map((severity) => (
                            <option key={severity} value={severity}>
                                {severity}
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
            </div>

            {actionError ? (
                <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                    {actionError}
                </p>
            ) : null}

            {vulnerabilities.error ? (
                <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                    Failed to load findings.
                </p>
            ) : null}

            <div className="rounded-xl border border-zinc-800 bg-zinc-900">
                {vulnerabilities.loading && !vulnerabilities.data ? (
                    <div className="space-y-3 p-5">
                        {[0, 1, 2, 3, 4].map((row) => (
                            <div key={row} className="h-10 animate-pulse rounded bg-zinc-800/50" />
                        ))}
                    </div>
                ) : rows.length === 0 ? (
                    <div className="p-5">
                        <EmptyState
                            icon={ShieldAlert}
                            title="No findings"
                            description="Nothing matches the current filters. Clean scans show up here once ingested."
                        />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-zinc-800 text-[11px] uppercase tracking-wide text-zinc-500">
                                    <th className="px-5 py-3 font-medium">Severity</th>
                                    <th className="px-5 py-3 font-medium">Finding</th>
                                    <th className="px-5 py-3 font-medium">Package</th>
                                    <th className="px-5 py-3 font-medium">Status</th>
                                    <th className="px-5 py-3 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/70">
                                {rows.map((vulnerability) => {
                                    const expanded = expandedId === vulnerability.id;
                                    const busy = pendingId === vulnerability.id;

                                    return (
                                        <tr key={vulnerability.id} className="align-top transition hover:bg-zinc-800/30">
                                            <td className="px-5 py-3.5">
                                                <SeverityBadge severity={vulnerability.severity} />
                                            </td>
                                            <td className="max-w-md px-5 py-3.5">
                                                <button
                                                    type="button"
                                                    className="text-left text-zinc-100 hover:text-emerald-300"
                                                    onClick={() =>
                                                        setExpandedId(expanded ? null : vulnerability.id)
                                                    }
                                                >
                                                    <span className="font-medium">{vulnerability.title}</span>
                                                    {vulnerability.vulnerability_id ? (
                                                        <span className="ml-2 font-mono text-xs text-zinc-500">
                                                            {vulnerability.vulnerability_id}
                                                        </span>
                                                    ) : null}
                                                </button>
                                                {expanded ? (
                                                    <div className="mt-2 rounded-lg border border-zinc-800 bg-zinc-950/60 p-3 text-xs leading-relaxed text-zinc-400">
                                                        {vulnerability.description || 'No description provided.'}
                                                        {vulnerability.file_path ? (
                                                            <p className="mt-2 font-mono text-zinc-500">
                                                                {vulnerability.file_path}
                                                                {vulnerability.line_number
                                                                    ? `:${vulnerability.line_number}`
                                                                    : ''}
                                                            </p>
                                                        ) : null}
                                                    </div>
                                                ) : null}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <p className="font-mono text-xs text-zinc-300">
                                                    {vulnerability.package_name || '—'}
                                                </p>
                                                <p className="mt-0.5 font-mono text-[11px] text-zinc-500">
                                                    {vulnerability.installed_version || '?'}
                                                    {vulnerability.fixed_version
                                                        ? ` → ${vulnerability.fixed_version}`
                                                        : ''}
                                                </p>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <FindingStatusBadge status={vulnerability.status} />
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex justify-end gap-1.5">
                                                    {vulnerability.status !== 'resolved' ? (
                                                        <button
                                                            type="button"
                                                            disabled={busy}
                                                            onClick={() => updateStatus(vulnerability, 'resolved')}
                                                            title="Mark resolved"
                                                            className="rounded-md border border-zinc-700 p-1.5 text-zinc-400 transition hover:border-emerald-500/40 hover:text-emerald-400 disabled:opacity-40"
                                                        >
                                                            <Check className="h-4 w-4" />
                                                        </button>
                                                    ) : null}

                                                    {vulnerability.status !== 'ignored_false_positive' ? (
                                                        <button
                                                            type="button"
                                                            disabled={busy}
                                                            onClick={() =>
                                                                updateStatus(vulnerability, 'ignored_false_positive')
                                                            }
                                                            title="Mark false positive"
                                                            className="rounded-md border border-zinc-700 p-1.5 text-zinc-400 transition hover:border-zinc-500 hover:text-zinc-200 disabled:opacity-40"
                                                        >
                                                            <EyeOff className="h-4 w-4" />
                                                        </button>
                                                    ) : null}

                                                    {vulnerability.status !== 'open' ? (
                                                        <button
                                                            type="button"
                                                            disabled={busy}
                                                            onClick={() => updateStatus(vulnerability, 'open')}
                                                            title="Reopen finding"
                                                            className="rounded-md border border-zinc-700 p-1.5 text-zinc-400 transition hover:border-amber-500/40 hover:text-amber-400 disabled:opacity-40"
                                                        >
                                                            <RotateCcw className="h-4 w-4" />
                                                        </button>
                                                    ) : null}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <Pagination
                meta={vulnerabilities.data?.meta}
                onPageChange={(page) => setFilters((previous) => ({ ...previous, page }))}
            />
        </AppLayout>
    );
}

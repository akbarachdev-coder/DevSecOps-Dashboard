import { Head } from '@inertiajs/react';
import { Bell, CheckCheck, MailOpen } from 'lucide-react';
import { useState } from 'react';
import { get, post } from '../api/client';
import EmptyState from '../components/EmptyState';
import { Select } from '../components/FormControls';
import PageHeader from '../components/PageHeader';
import Pagination from '../components/Pagination';
import SeverityBadge from '../components/SeverityBadge';
import { useAsync } from '../hooks/useAsync';
import AppLayout from '../layouts/AppLayout';
import { formatDate, SEVERITY_ORDER } from '../utils/format';

export default function Notifications() {
    const [filters, setFilters] = useState({
        unread_only: false,
        severity: '',
        page: 1,
    });
    const [busy, setBusy] = useState(false);
    const [actionError, setActionError] = useState(null);

    const notifications = useAsync(
        () =>
            get('/notifications', {
                unread_only: filters.unread_only ? 1 : undefined,
                severity: filters.severity || undefined,
                page: filters.page,
                per_page: 15,
            }),
        [filters.unread_only, filters.severity, filters.page],
    );

    const rows = notifications.data?.data ?? [];

    const markRead = async (notification) => {
        setActionError(null);

        try {
            await post(`/notifications/${notification.id}/read`);
            await notifications.refetch();
        } catch (error) {
            setActionError(error.message);
        }
    };

    const markAllRead = async () => {
        setBusy(true);
        setActionError(null);

        try {
            await post('/notifications/read-all');
            await notifications.refetch();
        } catch (error) {
            setActionError(error.message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <AppLayout title="Notifications">
            <Head title="Notifications" />

            <PageHeader
                title="Notifications"
                description="Alerts generated when new findings appear in an ingested scan."
                actions={
                    <button
                        type="button"
                        onClick={markAllRead}
                        disabled={busy || rows.length === 0}
                        className="flex items-center gap-2 rounded-lg border border-zinc-700 px-3.5 py-2 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <CheckCheck className="h-4 w-4" aria-hidden="true" />
                        {busy ? 'Marking…' : 'Mark all read'}
                    </button>
                }
            />

            <div className="mb-4 flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4 sm:flex-row sm:items-end">
                <label className="flex cursor-pointer items-center gap-2.5 pb-2 text-sm text-zinc-400">
                    <input
                        type="checkbox"
                        checked={filters.unread_only}
                        onChange={(event) =>
                            setFilters((previous) => ({
                                ...previous,
                                unread_only: event.target.checked,
                                page: 1,
                            }))
                        }
                        className="h-4 w-4 rounded border-zinc-600 bg-zinc-900 text-emerald-500 focus:ring-emerald-500/40"
                    />
                    Unread only
                </label>

                <div className="flex-1 sm:max-w-56">
                    <label htmlFor="filter-severity" className="mb-1.5 block text-xs font-medium text-zinc-500">
                        Severity
                    </label>
                    <Select
                        id="filter-severity"
                        value={filters.severity}
                        onChange={(event) =>
                            setFilters((previous) => ({ ...previous, severity: event.target.value, page: 1 }))
                        }
                    >
                        <option value="">All severities</option>
                        {SEVERITY_ORDER.map((severity) => (
                            <option key={severity} value={severity}>
                                {severity}
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

            <div className="rounded-xl border border-zinc-800 bg-zinc-900">
                {notifications.loading && !notifications.data ? (
                    <div className="space-y-3 p-5">
                        {[0, 1, 2, 3].map((row) => (
                            <div key={row} className="h-14 animate-pulse rounded bg-zinc-800/50" />
                        ))}
                    </div>
                ) : rows.length === 0 ? (
                    <div className="p-5">
                        <EmptyState
                            icon={Bell}
                            title="No notifications"
                            description="You are all caught up. New findings from scans will show up here."
                        />
                    </div>
                ) : (
                    <ul className="divide-y divide-zinc-800/70">
                        {rows.map((notification) => {
                            const unread = notification.read_at === null;

                            return (
                                <li
                                    key={notification.id}
                                    className={`flex flex-col gap-3 px-5 py-4 transition sm:flex-row sm:items-start sm:justify-between ${
                                        unread ? 'bg-emerald-500/[0.04]' : ''
                                    } hover:bg-zinc-800/30`}
                                >
                                    <div className="flex min-w-0 gap-3">
                                        <span
                                            className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                                                unread ? 'bg-emerald-400' : 'bg-zinc-700'
                                            }`}
                                            aria-hidden="true"
                                        />
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <SeverityBadge severity={notification.severity} />
                                                <span className="text-[11px] uppercase tracking-wide text-zinc-600">
                                                    {notification.type?.replaceAll('_', ' ')}
                                                </span>
                                            </div>
                                            <p className="mt-1.5 text-sm font-medium text-zinc-100">
                                                {notification.title}
                                            </p>
                                            {notification.message ? (
                                                <p className="mt-1 text-sm text-zinc-400">{notification.message}</p>
                                            ) : null}
                                            <p className="mt-1.5 text-xs text-zinc-600">
                                                {formatDate(notification.created_at)}
                                            </p>
                                        </div>
                                    </div>

                                    {unread ? (
                                        <button
                                            type="button"
                                            onClick={() => markRead(notification)}
                                            className="flex shrink-0 items-center gap-1.5 self-start rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-emerald-500/40 hover:text-emerald-400 sm:self-center"
                                        >
                                            <MailOpen className="h-3.5 w-3.5" aria-hidden="true" />
                                            Mark read
                                        </button>
                                    ) : (
                                        <span className="shrink-0 self-start text-xs text-zinc-600 sm:self-center">
                                            Read
                                        </span>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            <Pagination
                meta={notifications.data?.meta}
                onPageChange={(page) => setFilters((previous) => ({ ...previous, page }))}
            />
        </AppLayout>
    );
}

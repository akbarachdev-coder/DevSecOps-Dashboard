export const SEVERITY_STYLES = {
    CRITICAL: {
        label: 'Critical',
        badge: 'bg-red-500/15 text-red-400 ring-1 ring-inset ring-red-500/30',
        dot: 'bg-red-500',
        bar: 'bg-red-500',
        chart: '#ef4444',
    },
    HIGH: {
        label: 'High',
        badge: 'bg-orange-500/15 text-orange-400 ring-1 ring-inset ring-orange-500/30',
        dot: 'bg-orange-500',
        bar: 'bg-orange-500',
        chart: '#f97316',
    },
    MEDIUM: {
        label: 'Medium',
        badge: 'bg-amber-500/15 text-amber-400 ring-1 ring-inset ring-amber-500/30',
        dot: 'bg-amber-500',
        bar: 'bg-amber-500',
        chart: '#f59e0b',
    },
    LOW: {
        label: 'Low',
        badge: 'bg-sky-500/15 text-sky-400 ring-1 ring-inset ring-sky-500/30',
        dot: 'bg-sky-500',
        bar: 'bg-sky-500',
        chart: '#0ea5e9',
    },
    INFO: {
        label: 'Info',
        badge: 'bg-zinc-500/15 text-zinc-400 ring-1 ring-inset ring-zinc-500/30',
        dot: 'bg-zinc-400',
        bar: 'bg-zinc-400',
        chart: '#a1a1aa',
    },
};

export const SEVERITY_ORDER = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'];

export const BUILD_STATUS_STYLES = {
    passed: {
        label: 'Passed',
        badge: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-inset ring-emerald-500/30',
    },
    failed: {
        label: 'Failed',
        badge: 'bg-red-500/15 text-red-400 ring-1 ring-inset ring-red-500/30',
    },
    action_required: {
        label: 'Action required',
        badge: 'bg-amber-500/15 text-amber-400 ring-1 ring-inset ring-amber-500/30',
    },
};

export const FINDING_STATUS_STYLES = {
    open: {
        label: 'Open',
        badge: 'bg-blue-500/15 text-blue-400 ring-1 ring-inset ring-blue-500/30',
    },
    resolved: {
        label: 'Resolved',
        badge: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-inset ring-emerald-500/30',
    },
    ignored_false_positive: {
        label: 'False positive',
        badge: 'bg-zinc-500/15 text-zinc-400 ring-1 ring-inset ring-zinc-500/30',
    },
};

export function formatDate(value, { withTime = true } = {}) {
    if (!value) {
        return '—';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '—';
    }

    return date.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
    });
}

export function formatDuration(seconds) {
    if (seconds === null || seconds === undefined) {
        return '—';
    }

    const total = Number(seconds);

    if (Number.isNaN(total)) {
        return '—';
    }

    if (total < 60) {
        return `${total}s`;
    }

    const minutes = Math.floor(total / 60);
    const remaining = total % 60;

    return `${minutes}m ${remaining}s`;
}

export function shortHash(hash) {
    if (!hash) {
        return '—';
    }

    return hash.slice(0, 7);
}

export function severityStyle(severity) {
    return SEVERITY_STYLES[severity] || SEVERITY_STYLES.INFO;
}

export function buildStatusStyle(status) {
    return BUILD_STATUS_STYLES[status] || {
        label: status || 'Unknown',
        badge: 'bg-zinc-500/15 text-zinc-400 ring-1 ring-inset ring-zinc-500/30',
    };
}

export function findingStatusStyle(status) {
    return FINDING_STATUS_STYLES[status] || {
        label: status || 'Unknown',
        badge: 'bg-zinc-500/15 text-zinc-400 ring-1 ring-inset ring-zinc-500/30',
    };
}

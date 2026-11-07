import { severityStyle } from '../utils/format';

export default function SeverityBadge({ severity, className = '' }) {
    const style = severityStyle(severity);

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium uppercase tracking-wide ${style.badge} ${className}`}
        >
            <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
            {style.label}
        </span>
    );
}

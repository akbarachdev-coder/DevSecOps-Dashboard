import { findingStatusStyle } from '../utils/format';

export default function FindingStatusBadge({ status }) {
    const style = findingStatusStyle(status);

    return (
        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${style.badge}`}>
            {style.label}
        </span>
    );
}

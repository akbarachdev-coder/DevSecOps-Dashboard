const baseClass =
    'w-full rounded-lg border border-zinc-700 bg-zinc-950/70 px-3 py-2 text-sm text-zinc-100 shadow-sm transition placeholder:text-zinc-600 focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50';

export function Input({ className = '', ...props }) {
    return <input className={`${baseClass} ${className}`} {...props} />;
}

export function Select({ className = '', children, ...props }) {
    return (
        <select className={`${baseClass} appearance-none pr-8 ${className}`} {...props}>
            {children}
        </select>
    );
}

export function Textarea({ className = '', ...props }) {
    return <textarea className={`${baseClass} ${className}`} {...props} />;
}

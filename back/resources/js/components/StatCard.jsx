export default function StatCard({ label, value, hint, icon: Icon, accent = 'text-zinc-100' }) {
    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm text-zinc-500">{label}</p>
                    <p className={`mt-2 text-3xl font-semibold tracking-tight ${accent}`}>{value}</p>
                    {hint ? <p className="mt-1 text-xs text-zinc-500">{hint}</p> : null}
                </div>
                {Icon ? (
                    <span className="rounded-lg bg-zinc-800/80 p-2 text-zinc-400">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                ) : null}
            </div>
        </div>
    );
}

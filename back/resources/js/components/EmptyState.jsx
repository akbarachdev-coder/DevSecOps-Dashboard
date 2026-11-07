export default function EmptyState({ icon: Icon, title, description, action }) {
    return (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 bg-zinc-900/40 px-6 py-14 text-center">
            {Icon ? (
                <span className="rounded-full bg-zinc-800/80 p-3 text-zinc-500">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                </span>
            ) : null}
            <h3 className="mt-4 text-sm font-medium text-zinc-200">{title}</h3>
            {description ? <p className="mt-1 max-w-sm text-sm text-zinc-500">{description}</p> : null}
            {action ? <div className="mt-4">{action}</div> : null}
        </div>
    );
}

export default function PageHeader({ title, description, actions }) {
    return (
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h1 className="text-xl font-semibold tracking-tight text-zinc-100">{title}</h1>
                {description ? <p className="mt-1 text-sm text-zinc-500">{description}</p> : null}
            </div>
            {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
    );
}

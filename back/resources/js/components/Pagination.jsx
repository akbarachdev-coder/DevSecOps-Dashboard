export default function Pagination({ meta, onPageChange }) {
    if (!meta || meta.last_page <= 1) {
        return null;
    }

    const { current_page: currentPage, last_page: lastPage, from, to, total } = meta;

    const pages = [];

    const start = Math.max(1, currentPage - 2);
    const end = Math.min(lastPage, currentPage + 2);

    for (let page = start; page <= end; page += 1) {
        pages.push(page);
    }

    return (
        <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-sm text-zinc-500">
                Showing <span className="text-zinc-300">{from ?? 0}</span>–<span className="text-zinc-300">{to ?? 0}</span> of{' '}
                <span className="text-zinc-300">{total ?? 0}</span>
            </p>

            <div className="flex items-center gap-1">
                <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => onPageChange(currentPage - 1)}
                    className="rounded-md border border-zinc-800 px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    Prev
                </button>

                {start > 1 ? (
                    <>
                        <button
                            type="button"
                            onClick={() => onPageChange(1)}
                            className="rounded-md border border-zinc-800 px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-zinc-800"
                        >
                            1
                        </button>
                        {start > 2 ? <span className="px-1 text-sm text-zinc-600">…</span> : null}
                    </>
                ) : null}

                {pages.map((page) => (
                    <button
                        key={page}
                        type="button"
                        onClick={() => onPageChange(page)}
                        aria-current={page === currentPage ? 'page' : undefined}
                        className={`rounded-md border px-3 py-1.5 text-sm transition ${
                            page === currentPage
                                ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400'
                                : 'border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                        }`}
                    >
                        {page}
                    </button>
                ))}

                {end < lastPage ? (
                    <>
                        {end < lastPage - 1 ? <span className="px-1 text-sm text-zinc-600">…</span> : null}
                        <button
                            type="button"
                            onClick={() => onPageChange(lastPage)}
                            className="rounded-md border border-zinc-800 px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-zinc-800"
                        >
                            {lastPage}
                        </button>
                    </>
                ) : null}

                <button
                    type="button"
                    disabled={currentPage >= lastPage}
                    onClick={() => onPageChange(currentPage + 1)}
                    className="rounded-md border border-zinc-800 px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    Next
                </button>
            </div>
        </div>
    );
}

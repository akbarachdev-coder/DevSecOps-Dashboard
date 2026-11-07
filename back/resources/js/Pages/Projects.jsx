import { Head } from '@inertiajs/react';
import { Check, Copy, FolderGit2, KeyRound, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { del, get, post } from '../api/client';
import EmptyState from '../components/EmptyState';
import { Input } from '../components/FormControls';
import PageHeader from '../components/PageHeader';
import Pagination from '../components/Pagination';
import { useAsync } from '../hooks/useAsync';
import AppLayout from '../layouts/AppLayout';
import { formatDate } from '../utils/format';

function CreateProjectForm({ onCreated }) {
    const [name, setName] = useState('');
    const [repositoryUrl, setRepositoryUrl] = useState('');
    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);
    const [formError, setFormError] = useState(null);

    const submit = async (event) => {
        event.preventDefault();
        setProcessing(true);
        setErrors({});
        setFormError(null);

        try {
            const response = await post('/projects', { name, repository_url: repositoryUrl });

            setName('');
            setRepositoryUrl('');
            onCreated(response);
        } catch (error) {
            if (error.errors && Object.keys(error.errors).length > 0) {
                setErrors(error.errors);
            } else {
                setFormError(error.message);
            }
        } finally {
            setProcessing(false);
        }
    };

    return (
        <form onSubmit={submit} className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-zinc-200">Add project</h2>
                <span className="text-xs text-zinc-500">name + repository URL</span>
            </div>

            {formError ? (
                <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                    {formError}
                </p>
            ) : null}

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1">
                    <label htmlFor="project-name" className="mb-1.5 block text-xs font-medium text-zinc-500">
                        Project name
                    </label>
                    <Input
                        id="project-name"
                        type="text"
                        required
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="payments-api"
                    />
                    {errors.name ? <p className="mt-1.5 text-xs text-red-400">{errors.name}</p> : null}
                </div>

                <div className="flex-[2]">
                    <label htmlFor="project-repo" className="mb-1.5 block text-xs font-medium text-zinc-500">
                        Repository URL
                    </label>
                    <Input
                        id="project-repo"
                        type="url"
                        required
                        value={repositoryUrl}
                        onChange={(event) => setRepositoryUrl(event.target.value)}
                        placeholder="https://github.com/your-org/payments-api"
                    />
                    {errors.repository_url ? (
                        <p className="mt-1.5 text-xs text-red-400">{errors.repository_url}</p>
                    ) : null}
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    {processing ? 'Creating…' : 'Create'}
                </button>
            </div>
        </form>
    );
}

function TokenPanel({ token, onDismiss }) {
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(token);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
        } catch {
            setCopied(false);
        }
    };

    return (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-medium text-emerald-300">
                        <KeyRound className="h-4 w-4" aria-hidden="true" />
                        Project API token
                    </p>
                    <p className="mt-1 text-xs text-emerald-200/70">
                        Store this token in CI. It is shown only once — rotate it if it leaks.
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                        <code className="block max-w-full truncate rounded-md bg-zinc-950/70 px-3 py-2 font-mono text-xs text-zinc-200">
                            {token}
                        </code>
                        <button
                            type="button"
                            onClick={copy}
                            className="rounded-md border border-emerald-500/30 p-2 text-emerald-300 transition hover:bg-emerald-500/20"
                            title="Copy token"
                        >
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </button>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={onDismiss}
                    className="self-end rounded-md p-1.5 text-emerald-300/70 transition hover:bg-emerald-500/15 hover:text-emerald-200"
                    title="Dismiss"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}

export default function Projects() {
    const [page, setPage] = useState(1);
    const [revealedTokens, setRevealedTokens] = useState({});
    const [notice, setNotice] = useState(null);
    const [busyId, setBusyId] = useState(null);

    const projects = useAsync(() => get('/projects', { page, per_page: 10 }), [page]);

    const rows = projects.data?.data ?? [];

    const revealToken = async (project) => {
        setBusyId(project.id);

        try {
            const response = await get(`/projects/${project.id}`, { include_token: 1 });

            setRevealedTokens((previous) => ({ ...previous, [project.id]: response.data.api_token }));
        } catch (error) {
            setNotice({ type: 'error', message: error.message });
        } finally {
            setBusyId(null);
        }
    };

    const rotateToken = async (project) => {
        if (!window.confirm(`Rotate the API token for "${project.name}"? CI pipelines using the old token will stop working.`)) {
            return;
        }

        setBusyId(project.id);

        try {
            const response = await post(`/projects/${project.id}/rotate-token`);

            setRevealedTokens((previous) => ({ ...previous, [project.id]: response.api_token }));
            setNotice({ type: 'success', message: response.message || 'Token rotated.' });
        } catch (error) {
            setNotice({ type: 'error', message: error.message });
        } finally {
            setBusyId(null);
        }
    };

    const removeProject = async (project) => {
        if (!window.confirm(`Delete "${project.name}" and all of its builds and findings? This cannot be undone.`)) {
            return;
        }

        setBusyId(project.id);

        try {
            await del(`/projects/${project.id}`);
            setNotice({ type: 'success', message: 'Project deleted.' });
            await projects.refetch();
        } catch (error) {
            setNotice({ type: 'error', message: error.message });
        } finally {
            setBusyId(null);
        }
    };

    const handleCreated = async (response) => {
        setRevealedTokens((previous) => ({ ...previous, [response.data.id]: response.data.api_token }));
        setNotice({ type: 'success', message: response.message || 'Project created.' });
        await projects.refetch();
    };

    return (
        <AppLayout title="Projects">
            <Head title="Projects" />

            <PageHeader
                title="Projects"
                description="Repositories connected to SecureCI. Each project owns an API token for CI ingestion."
            />

            <CreateProjectForm onCreated={handleCreated} />

            {notice ? (
                <div
                    className={`mt-4 flex items-center justify-between rounded-lg border px-4 py-3 text-sm ${
                        notice.type === 'error'
                            ? 'border-red-500/30 bg-red-500/10 text-red-400'
                            : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                    }`}
                >
                    <span>{notice.message}</span>
                    <button
                        type="button"
                        onClick={() => setNotice(null)}
                        className="rounded p-1 hover:bg-white/5"
                        title="Dismiss"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            ) : null}

            <div className="mt-4 flex flex-col gap-4">
                {Object.entries(revealedTokens)
                    .filter(([id, token]) => Number(id) !== 0 && token)
                    .map(([id, token]) => (
                        <div key={`token-${id}`} className="order-first">
                            <TokenPanel
                                token={token}
                                onDismiss={() =>
                                    setRevealedTokens((previous) => {
                                        const next = { ...previous };
                                        delete next[id];
                                        return next;
                                    })
                                }
                            />
                        </div>
                    ))}
            </div>

            <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900">
                {projects.loading && !projects.data ? (
                    <div className="space-y-3 p-5">
                        {[0, 1, 2].map((row) => (
                            <div key={row} className="h-12 animate-pulse rounded bg-zinc-800/50" />
                        ))}
                    </div>
                ) : rows.length === 0 ? (
                    <div className="p-5">
                        <EmptyState
                            icon={FolderGit2}
                            title="No projects yet"
                            description="Create your first project above to get an ingestion token."
                        />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-zinc-800 text-[11px] uppercase tracking-wide text-zinc-500">
                                    <th className="px-5 py-3 font-medium">Name</th>
                                    <th className="px-5 py-3 font-medium">Repository</th>
                                    <th className="px-5 py-3 font-medium">Created</th>
                                    <th className="px-5 py-3 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/70">
                                {rows.map((project) => (
                                    <tr key={project.id} className="transition hover:bg-zinc-800/30">
                                        <td className="px-5 py-4 font-medium text-zinc-100">{project.name}</td>
                                        <td className="px-5 py-4">
                                            <a
                                                href={project.repository_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="font-mono text-xs text-zinc-400 hover:text-emerald-400"
                                            >
                                                {project.repository_url}
                                            </a>
                                        </td>
                                        <td className="px-5 py-4 text-zinc-500">
                                            {formatDate(project.created_at, { withTime: false })}
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex justify-end gap-1.5">
                                                <button
                                                    type="button"
                                                    disabled={busyId === project.id}
                                                    onClick={() => revealToken(project)}
                                                    title="Show API token"
                                                    className="rounded-md border border-zinc-700 p-1.5 text-zinc-400 transition hover:border-emerald-500/40 hover:text-emerald-400 disabled:opacity-40"
                                                >
                                                    <KeyRound className="h-4 w-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={busyId === project.id}
                                                    onClick={() => rotateToken(project)}
                                                    title="Rotate API token"
                                                    className="rounded-md border border-zinc-700 p-1.5 text-zinc-400 transition hover:border-amber-500/40 hover:text-amber-400 disabled:opacity-40"
                                                >
                                                    <RefreshCw className="h-4 w-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={busyId === project.id}
                                                    onClick={() => removeProject(project)}
                                                    title="Delete project"
                                                    className="rounded-md border border-zinc-700 p-1.5 text-zinc-400 transition hover:border-red-500/40 hover:text-red-400 disabled:opacity-40"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <Pagination meta={projects.data?.meta} onPageChange={setPage} />
        </AppLayout>
    );
}

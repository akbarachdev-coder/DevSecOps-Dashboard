import { Form, Head } from '@inertiajs/react';
import { ShieldCheck } from 'lucide-react';

export default function Login() {
    return (
        <>
            <Head title="Log in" />

            <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-12">
                <div className="w-full max-w-sm">
                    <div className="mb-8 flex flex-col items-center text-center">
                        <span className="rounded-xl bg-emerald-500/15 p-3 text-emerald-400 ring-1 ring-inset ring-emerald-500/30">
                            <ShieldCheck className="h-7 w-7" aria-hidden="true" />
                        </span>
                        <h1 className="mt-4 text-xl font-semibold tracking-tight text-zinc-100">SecureCI</h1>
                        <p className="mt-1 text-sm text-zinc-500">DevSecOps Security Dashboard</p>
                    </div>

                    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl shadow-black/20">
                        <h2 className="text-sm font-medium text-zinc-200">Sign in to your account</h2>

                        <Form
                            action="/login"
                            method="post"
                            resetOnError
                            className="mt-5 flex flex-col gap-4"
                        >
                            {({ errors, processing }) => (
                                <>
                                    <div>
                                        <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-zinc-400">
                                            Email address
                                        </label>
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            autoComplete="email"
                                            required
                                            defaultValue=""
                                            className="w-full rounded-lg border border-zinc-700 bg-zinc-950/70 px-3 py-2 text-sm text-zinc-100 shadow-sm transition placeholder:text-zinc-600 focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                            placeholder="you@example.com"
                                        />
                                        {errors.email ? (
                                            <p className="mt-1.5 text-xs text-red-400">{errors.email}</p>
                                        ) : null}
                                    </div>

                                    <div>
                                        <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-zinc-400">
                                            Password
                                        </label>
                                        <input
                                            id="password"
                                            name="password"
                                            type="password"
                                            autoComplete="current-password"
                                            required
                                            defaultValue=""
                                            className="w-full rounded-lg border border-zinc-700 bg-zinc-950/70 px-3 py-2 text-sm text-zinc-100 shadow-sm transition placeholder:text-zinc-600 focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                            placeholder="••••••••"
                                        />
                                        {errors.password ? (
                                            <p className="mt-1.5 text-xs text-red-400">{errors.password}</p>
                                        ) : null}
                                    </div>

                                    <label className="flex items-center gap-2 text-sm text-zinc-400">
                                        <input
                                            type="checkbox"
                                            name="remember"
                                            value="1"
                                            className="h-4 w-4 rounded border-zinc-600 bg-zinc-900 text-emerald-500 focus:ring-emerald-500/40"
                                        />
                                        Remember me
                                    </label>

                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="mt-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {processing ? 'Signing in…' : 'Sign in'}
                                    </button>
                                </>
                            )}
                        </Form>

                        <div className="mt-5 rounded-lg border border-zinc-800 bg-zinc-950/60 p-3">
                            <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">Demo account</p>
                            <p className="mt-1 font-mono text-xs text-zinc-400">test@example.com</p>
                            <p className="font-mono text-xs text-zinc-400">password</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

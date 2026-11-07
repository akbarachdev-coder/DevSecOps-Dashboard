import { Link, usePage } from '@inertiajs/react';
import {
    Bell,
    FolderGit2,
    History,
    LayoutDashboard,
    LogOut,
    Menu,
    ShieldCheck,
    ShieldAlert,
    TrendingUp,
    X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { get } from '../api/client';

const NAV_ITEMS = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Build History', href: '/builds', icon: History },
    { label: 'Findings', href: '/vulnerabilities', icon: ShieldAlert },
    { label: 'Version Trends', href: '/trends', icon: TrendingUp },
    { label: 'Projects', href: '/projects', icon: FolderGit2 },
    { label: 'Notifications', href: '/notifications', icon: Bell },
];

function isActive(url, href) {
    if (href === '/dashboard') {
        return url === href || url === '/';
    }

    return url === href || url.startsWith(`${href}/`);
}

function NavLinks({ onNavigate }) {
    const url = usePage().url;

    return (
        <nav className="flex flex-col gap-1 px-3">
            {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
                const active = isActive(url, href);

                return (
                    <Link
                        key={href}
                        href={href}
                        onClick={onNavigate}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                            active
                                ? 'bg-zinc-800 text-white shadow-sm'
                                : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100'
                        }`}
                    >
                        <Icon className={`h-4.5 w-4.5 ${active ? 'text-emerald-400' : ''}`} aria-hidden="true" />
                        {label}
                    </Link>
                );
            })}
        </nav>
    );
}

function SidebarBrand() {
    return (
        <div className="flex items-center gap-2.5 px-5 py-5">
            <span className="rounded-lg bg-emerald-500/15 p-2 text-emerald-400 ring-1 ring-inset ring-emerald-500/30">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
                <p className="text-sm font-semibold tracking-tight text-zinc-100">SecureCI</p>
                <p className="text-[11px] text-zinc-500">DevSecOps Dashboard</p>
            </div>
        </div>
    );
}

export default function AppLayout({ title, children }) {
    const { auth } = usePage().props;
    const [mobileOpen, setMobileOpen] = useState(false);
    const [unread, setUnread] = useState(0);

    useEffect(() => {
        let active = true;

        const fetchUnread = async () => {
            try {
                const response = await get('/notifications', { unread_only: 1, per_page: 1 });

                if (active) {
                    setUnread(response?.meta?.total ?? 0);
                }
            } catch {
                // Session expiry is handled by the API client redirect.
            }
        };

        fetchUnread();
        const interval = window.setInterval(fetchUnread, 30000);

        return () => {
            active = false;
            window.clearInterval(interval);
        };
    }, []);

    return (
        <div className="flex min-h-screen bg-zinc-950">
            <aside className="hidden w-60 shrink-0 flex-col border-r border-zinc-800 bg-zinc-900/40 md:flex">
                <SidebarBrand />
                <div className="flex-1 overflow-y-auto py-2">
                    <NavLinks />
                </div>
                <div className="border-t border-zinc-800 px-5 py-4">
                    <p className="truncate text-xs text-zinc-500" title={auth.user?.email}>
                        {auth.user?.email}
                    </p>
                </div>
            </aside>

            {mobileOpen ? (
                <div className="fixed inset-0 z-40 md:hidden">
                    <button
                        type="button"
                        aria-label="Close menu"
                        className="absolute inset-0 bg-zinc-950/70"
                        onClick={() => setMobileOpen(false)}
                    />
                    <div className="relative flex h-full w-64 flex-col border-r border-zinc-800 bg-zinc-900">
                        <div className="flex items-center justify-between pr-3">
                            <SidebarBrand />
                            <button
                                type="button"
                                aria-label="Close menu"
                                className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                                onClick={() => setMobileOpen(false)}
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto py-2">
                            <NavLinks onNavigate={() => setMobileOpen(false)} />
                        </div>
                    </div>
                </div>
            ) : null}

            <div className="flex min-w-0 flex-1 flex-col">
                <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-950/90 px-4 backdrop-blur md:px-6">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            aria-label="Open menu"
                            className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 md:hidden"
                            onClick={() => setMobileOpen(true)}
                        >
                            <Menu className="h-5 w-5" />
                        </button>
                        <div>
                            <p className="text-sm font-medium text-zinc-200">{title ?? 'SecureCI'}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href="/notifications"
                            aria-label="Notifications"
                            className="relative rounded-md p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100"
                        >
                            <Bell className="h-5 w-5" />
                            {unread > 0 ? (
                                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                                    {unread > 99 ? '99+' : unread}
                                </span>
                            ) : null}
                        </Link>

                        <div className="hidden items-center gap-2.5 border-l border-zinc-800 pl-3 sm:flex">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold text-zinc-300">
                                {(auth.user?.name || '?')
                                    .split(' ')
                                    .map((part) => part[0])
                                    .slice(0, 2)
                                    .join('')
                                    .toUpperCase()}
                            </span>
                            <span className="max-w-32 truncate text-sm text-zinc-300">{auth.user?.name}</span>
                        </div>

                        <Link
                            href="/logout"
                            method="post"
                            as="button"
                            type="button"
                            title="Log out"
                            className="rounded-md p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-red-400"
                        >
                            <LogOut className="h-5 w-5" />
                        </Link>
                    </div>
                </header>

                <main className="flex-1 px-4 py-6 md:px-6">{children}</main>
            </div>
        </div>
    );
}

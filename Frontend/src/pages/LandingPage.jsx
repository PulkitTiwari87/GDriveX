import { Link } from 'react-router-dom';
import {
    HardDrive,
    Shield,
    Zap,
    ArrowRight,
    LayoutDashboard,
    PieChart,
    Sun,
    Moon,
    Folder,
    FileText,
    Image as ImageIcon,
    ArrowLeftRight,
    Link2,
} from 'lucide-react';
import useThemeStore from '../store/useThemeStore';
import useReveal from '../hooks/useReveal';
import useScrollParallax from '../hooks/useScrollParallax';

// ─── Reveal wrapper: fades/slides/scales an element in the first time it
// scrolls into view. `variant` picks the motion so scroll-through has
// hierarchy instead of one identical animation repeated down the page.
// `delay` staggers siblings (e.g. a row of feature cells). ──────────────────
const VARIANT_CLASS = { up: 'reveal', fade: 'reveal-fade', scale: 'reveal-scale', side: 'reveal-side' };
const Reveal = ({ children, delay = 0, variant = 'up', fromRight = false, className = '' }) => {
    const { ref, visible } = useReveal();
    return (
        <div
            ref={ref}
            className={`${VARIANT_CLASS[variant]} ${visible ? 'is-visible' : ''} ${className}`}
            style={{ '--reveal-delay': `${delay}ms`, '--reveal-x': fromRight ? '24px' : '-24px' }}
        >
            {children}
        </div>
    );
};

// ─── Product preview — a self-drawn mock of the actual dashboard (not a
// stock photo), so the hero shows the real product's shape. Account colors
// match the lane tokens used in the convergence effect above it. ───────────
const DashboardPreview = () => (
    <div className="rounded-xl bg-gray-900 border border-white/10 overflow-hidden text-left select-none">
        <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/10 bg-white/5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
            <span className="ml-3 text-xs text-gray-400 font-mono">app.gdrivex.com/dashboard</span>
        </div>

        <div className="flex">
            <div className="hidden sm:block w-40 shrink-0 border-r border-white/10 p-4 space-y-2">
                {['Dashboard', 'Analytics', 'Settings'].map((label, i) => (
                    <div
                        key={label}
                        className={`h-8 rounded-lg flex items-center px-3 text-xs font-medium ${i === 0 ? 'bg-teal-500/20 text-teal-300' : 'text-gray-500'
                            }`}
                    >
                        {label}
                    </div>
                ))}
            </div>

            <div className="flex-1 p-5 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: 'Personal', pct: 62, color: 'var(--color-lane-personal)' },
                        { label: 'Work', pct: 34, color: 'var(--color-lane-work)' },
                        { label: 'Backup', pct: 81, color: 'var(--color-lane-backup)' },
                    ].map((acc) => (
                        <div key={acc.label} className="rounded-lg bg-white/5 border border-white/10 p-3">
                            <p className="text-[11px] text-gray-400 mb-2">{acc.label}</p>
                            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${acc.pct}%`, background: acc.color }} />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="rounded-lg bg-white/5 border border-white/10 divide-y divide-white/5">
                    {[
                        { Icon: Folder, name: 'Q3 Reports', meta: 'Personal · Folder' },
                        { Icon: ImageIcon, name: 'brand-assets.zip', meta: 'Work · 128 MB' },
                        { Icon: FileText, name: 'roadmap.pdf', meta: 'Backup · 2.4 MB' },
                    ].map(({ Icon, name, meta }) => (
                        <div key={name} className="flex items-center gap-3 px-3 py-2.5">
                            <Icon className="w-4 h-4 text-teal-400 shrink-0" />
                            <div className="min-w-0">
                                <p className="text-xs font-medium text-gray-200 truncate">{name}</p>
                                <p className="text-[10px] text-gray-500">{meta}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

// ─── Convergence hero visual — the product's signature idea made literal:
// three distinct account "lanes" spread apart, converging into the single
// unified dashboard as the user scrolls. Driven entirely by transform/
// opacity from useScrollParallax; collapses to a static converged state
// when the user prefers reduced motion (the hook returns progress=1 then). ─
// x offsets are deliberately conservative (not viewport-scaled) so the
// spread lanes stay within a 360px-wide mobile viewport without clipping —
// verified at 375px width.
const LANES = [
    { key: 'personal', label: 'Personal', color: 'var(--color-lane-personal)', icon: Folder, x: -128, y: -30, rotate: -10 },
    { key: 'work', label: 'Work', color: 'var(--color-lane-work)', icon: FileText, x: 0, y: -105, rotate: 0 },
    { key: 'backup', label: 'Backup', color: 'var(--color-lane-backup)', icon: ImageIcon, x: 128, y: -30, rotate: 10 },
];

const ConvergenceHero = () => {
    const { progress } = useScrollParallax();
    const spread = 1 - progress;
    const previewScale = 0.9 + progress * 0.1;
    const previewOpacity = 0.45 + progress * 0.55;

    return (
        <div className="relative mt-24 sm:mt-28 max-w-4xl mx-auto">
            {/* Lanes occupy their own reserved space in normal flow (not an
                absolute overlay reaching up into the CTAs above) — a small
                negative margin lets them settle just over the preview's top
                edge once converged, without ever colliding with the text. */}
            <div className="relative h-36 sm:h-40 mb-[-32px] sm:mb-[-40px]" aria-hidden="true">
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-10">
                    {LANES.map((lane) => (
                        <div
                            key={lane.key}
                            className="absolute w-24 h-28 sm:w-28 sm:h-32 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 text-xs font-semibold"
                            style={{
                                transform: `translate(${lane.x * spread}px, ${lane.y * spread}px) rotate(${lane.rotate * spread}deg)`,
                                opacity: spread,
                                borderColor: lane.color,
                                color: lane.color,
                                background: `color-mix(in srgb, ${lane.color} 10%, transparent)`,
                            }}
                        >
                            <lane.icon className="w-6 h-6" />
                            {lane.label}
                        </div>
                    ))}
                </div>
            </div>

            <div
                className="relative rounded-xl"
                style={{ transform: `scale(${previewScale})`, opacity: previewOpacity }}
            >
                <div className="absolute -inset-1 bg-gradient-to-r from-teal-600/40 to-transparent rounded-2xl blur-xl opacity-30" />
                <div className="relative shadow-2xl rounded-xl">
                    <DashboardPreview />
                </div>
            </div>
        </div>
    );
};

// ─── Capability grid — an asymmetric bento layout instead of six identical
// cards: one large lead cell for the core value prop, five smaller cells
// for the rest. Same content as before, real compositional hierarchy. ─────
const CAPABILITIES = [
    {
        icon: LayoutDashboard,
        title: 'One dashboard, every drive',
        description: "Stop switching tabs. Every account you link — personal, work, backup — shows up in a single merged view, or browse each one on its own.",
        color: 'var(--color-lane-personal)',
        lead: true,
    },
    {
        icon: ArrowLeftRight,
        title: 'Drag files between accounts',
        description: 'Copy or move files across accounts by dragging — GDriveX streams the transfer server-side.',
        color: 'var(--color-lane-work)',
    },
    {
        icon: PieChart,
        title: 'Storage analytics',
        description: 'See usage across every account at a glance, before you hit a quota wall.',
        color: 'var(--color-lane-backup)',
    },
    {
        icon: Shield,
        title: 'AES-256 token encryption',
        description: 'OAuth refresh tokens are encrypted at rest. Your Google password never touches our servers.',
        color: 'var(--color-lane-personal)',
    },
    {
        icon: Zap,
        title: 'Link an account in seconds',
        description: 'Standard Google OAuth consent — no browser extension, no desktop app.',
        color: 'var(--color-lane-work)',
    },
    {
        icon: Link2,
        title: 'Full account control',
        description: 'Link or unlink any account at any time. Nothing stays connected without your say-so.',
        color: 'var(--color-lane-backup)',
    },
];

// Lead cell only: a compact echo of the hero's three account lanes, merging
// into one line — gives the tall bento cell real content instead of empty
// space, and threads the "convergence" idea through into the feature grid.
const MiniLanes = () => (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 py-6" aria-hidden="true">
        <div className="flex items-center gap-3">
            {[
                { color: 'var(--color-lane-personal)', label: 'Personal' },
                { color: 'var(--color-lane-work)', label: 'Work' },
                { color: 'var(--color-lane-backup)', label: 'Backup' },
            ].map((lane) => (
                <span
                    key={lane.label}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold border"
                    style={{ borderColor: lane.color, color: lane.color, background: `color-mix(in srgb, ${lane.color} 8%, transparent)` }}
                >
                    {lane.label}
                </span>
            ))}
        </div>
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-700" />
        <div className="px-4 py-2 rounded-lg bg-gray-900 dark:bg-gray-800 text-white text-xs font-semibold tracking-wide">
            ONE MERGED VIEW
        </div>
    </div>
);

const CapabilityCell = ({ item }) => (
    <div
        className={`group relative h-full rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 sm:p-7 overflow-hidden transition-colors duration-[var(--dur-normal)] hover:border-gray-300 dark:hover:border-gray-700 ${item.lead ? 'flex flex-col' : ''
            }`}
    >
        <div
            className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 transition-transform duration-[var(--dur-normal)] ease-[var(--ease-out)] group-hover:scale-110"
            style={{ background: `color-mix(in srgb, ${item.color} 14%, transparent)`, color: item.color }}
        >
            <item.icon className="w-5 h-5" />
        </div>

        {item.lead && <MiniLanes />}

        <div>
            <h3 className={`font-display font-semibold text-gray-900 dark:text-gray-100 mb-2 ${item.lead ? 'text-2xl sm:text-3xl tracking-tight leading-tight' : 'text-lg'}`}>
                {item.title}
            </h3>
            <p className={`text-gray-500 dark:text-gray-400 leading-relaxed ${item.lead ? 'text-base max-w-md' : 'text-sm'}`}>
                {item.description}
            </p>
        </div>
    </div>
);

const LandingPage = () => {
    const { theme, toggleTheme } = useThemeStore();

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300 overflow-x-hidden">

            {/* ── Navbar ─────────────────────────────────────────────────────── */}
            <nav className="fixed w-full bg-white/80 dark:bg-gray-950/80 backdrop-blur-md z-50 transition-colors duration-300">
                {/* Scroll-edge fade instead of a hard 1px divider — this bar floats
                    over scrolling content, so the seam should read as a soft edge
                    where the material meets the page, not a drawn line. */}
                <div className="pointer-events-none absolute inset-x-0 top-full h-4 bg-gradient-to-b from-black/[0.06] dark:from-white/[0.06] to-transparent" aria-hidden="true" />
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2.5">
                            <div className="bg-teal-600 p-2 rounded-lg">
                                <HardDrive className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-lg font-display font-bold text-gray-900 dark:text-gray-100">
                                GDriveX
                            </span>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3">
                            <button
                                onClick={toggleTheme}
                                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                                className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-[var(--dur-fast)] active:scale-[0.97]"
                            >
                                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                            </button>

                            <Link to="/login" className="hidden sm:inline text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium transition-colors duration-[var(--dur-fast)]">
                                Login
                            </Link>
                            <Link
                                to="/register"
                                className="bg-teal-600 hover:bg-teal-500 text-white px-4 sm:px-5 py-2.5 rounded-lg font-medium transition-all duration-[var(--dur-fast)] active:scale-[0.97]"
                            >
                                Get Started
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* ── Hero ───────────────────────────────────────────────────────── */}
            <section className="relative pt-36 sm:pt-40 pb-28 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center">
                <Reveal>
                    <h1 className="font-display text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-6 text-gray-900 dark:text-white">
                        All your drives.
                        <br />
                        <span className="text-teal-600 dark:text-teal-400">Converged.</span>
                    </h1>
                </Reveal>

                <Reveal delay={80} variant="fade">
                    <p className="text-lg sm:text-xl text-gray-500 dark:text-gray-400 max-w-xl mx-auto mb-10 leading-relaxed">
                        GDriveX merges every Google Drive account you own into one secure
                        dashboard — browse, transfer, and analyze files without switching tabs.
                    </p>
                </Reveal>

                <Reveal delay={160} variant="fade">
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            to="/register"
                            className="w-full sm:w-auto bg-teal-600 hover:bg-teal-500 text-white px-7 py-3.5 rounded-lg font-semibold text-base transition-all duration-[var(--dur-fast)] active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            Start for free <ArrowRight className="w-4 h-4" />
                        </Link>
                        <a
                            href="#capabilities"
                            className="w-full sm:w-auto text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 px-7 py-3.5 rounded-lg font-semibold text-base transition-all duration-[var(--dur-fast)] active:scale-[0.98] flex items-center justify-center"
                        >
                            See how it works
                        </a>
                    </div>
                </Reveal>

                <ConvergenceHero />
            </section>

            {/* ── Capabilities (bento grid) ─────────────────────────────────── */}
            <section id="capabilities" className="py-24 sm:py-28 bg-gray-50 dark:bg-gray-900/40 transition-colors duration-300 scroll-mt-16">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Reveal className="max-w-xl mb-14">
                        <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight leading-tight text-gray-900 dark:text-gray-100 mb-4">
                            Built for people juggling more than one drive
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 text-lg">
                            Every feature exists because managing scattered Google accounts is genuinely annoying.
                        </p>
                    </Reveal>

                    {/* auto-rows-fr only from sm: up — at the single-column mobile
                        width there's no row-spanning happening, so equal-height rows
                        would just stretch every short cell to match the tall lead
                        cell and leave large empty gaps. */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:auto-rows-fr">
                        {CAPABILITIES.map((item, i) => (
                            <Reveal
                                key={item.title}
                                delay={i * 70}
                                variant={i % 2 === 0 ? 'up' : 'scale'}
                                className={item.lead ? 'sm:col-span-2 lg:row-span-2' : ''}
                            >
                                <CapabilityCell item={item} />
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA ────────────────────────────────────────────────────────── */}
            <section className="py-24 sm:py-28 bg-white dark:bg-gray-950 transition-colors duration-300">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Reveal variant="scale">
                        <div className="relative bg-gray-900 dark:bg-gray-900 rounded-3xl p-12 md:p-16 text-center text-white overflow-hidden border border-gray-800">
                            <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-3 opacity-[0.15]" aria-hidden="true">
                                <span className="w-2 h-2 rounded-full" style={{ background: 'var(--color-lane-personal)' }} />
                                <span className="w-2 h-2 rounded-full" style={{ background: 'var(--color-lane-work)' }} />
                                <span className="w-2 h-2 rounded-full" style={{ background: 'var(--color-lane-backup)' }} />
                            </div>
                            <div className="relative z-10">
                                <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight leading-tight mb-5">Ready to converge your drives?</h2>
                                <p className="text-gray-400 text-lg mb-9 max-w-xl mx-auto">
                                    Free for personal use. Link your first account in under a minute.
                                </p>
                                <Link
                                    to="/register"
                                    className="bg-teal-500 hover:bg-teal-400 text-gray-950 px-9 py-4 rounded-lg font-bold text-lg transition-all duration-[var(--dur-fast)] active:scale-[0.98] inline-flex items-center gap-2"
                                >
                                    Get started free <ArrowRight className="w-5 h-5" />
                                </Link>
                            </div>
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* ── Footer ─────────────────────────────────────────────────────── */}
            <footer className="bg-white dark:bg-gray-950 py-10 border-t border-gray-100 dark:border-gray-800 transition-colors duration-300">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <HardDrive className="w-5 h-5 text-gray-400" />
                        <span className="font-display font-semibold text-gray-900 dark:text-gray-100">GDriveX</span>
                    </div>
                    <div className="text-gray-500 dark:text-gray-500 text-sm">
                        © {new Date().getFullYear()} GDriveX. All rights reserved.
                    </div>
                    <div className="flex gap-6 text-sm">
                        <a href="#" className="text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Privacy</a>
                        <a href="#" className="text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Terms</a>
                        <a href="#" className="text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">GitHub</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;

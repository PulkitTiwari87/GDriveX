import { Link } from 'react-router-dom';
import {
    HardDrive,
    Share2,
    Shield,
    Zap,
    CheckCircle,
    ArrowRight,
    LayoutDashboard,
    PieChart,
    Sun,
    Moon,
} from 'lucide-react';
import useThemeStore from '../store/useThemeStore';

const LandingPage = () => {
    const { theme, toggleTheme } = useThemeStore();

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">

            {/* ── Navbar ─────────────────────────────────────────────────────── */}
            <nav className="fixed w-full bg-white/80 dark:bg-gray-950/80 backdrop-blur-md z-50 border-b border-gray-100 dark:border-gray-800 transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">

                        {/* Logo */}
                        <div className="flex items-center gap-2">
                            <div className="bg-indigo-600 p-2 rounded-lg">
                                <HardDrive className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                                G-DriveX
                            </span>
                        </div>

                        {/* Nav Actions */}
                        <div className="flex items-center gap-3">
                            {/* Dark mode toggle */}
                            <button
                                onClick={toggleTheme}
                                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                                className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                            </button>

                            <Link to="/login" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors">
                                Login
                            </Link>
                            <Link to="/register" className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-full font-medium transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40">
                                Get Started
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* ── Hero ───────────────────────────────────────────────────────── */}
            <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
                <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-4 py-1.5 rounded-full text-sm font-semibold mb-8 border border-blue-100 dark:border-indigo-800">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
                    </span>
                    Base v1.0 is Live
                </div>

                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 dark:from-white dark:via-gray-200 dark:to-white pb-2">
                    Unified Cloud Storage <br />
                    <span className="text-indigo-600 dark:text-indigo-400">Mastered.</span>
                </h1>

                <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                    G-DriveX brings all your Google Drive accounts into one powerful dashboard.
                    Manage, transfer, and analyze your files with unprecedented ease and security.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link to="/register" className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-full font-bold text-lg transition-all shadow-xl shadow-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/40 hover:-translate-y-1 flex items-center justify-center gap-2">
                        Start for Free <ArrowRight className="w-5 h-5" />
                    </Link>
                    <Link to="/login" className="w-full sm:w-auto bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 px-8 py-4 rounded-full font-bold text-lg transition-all flex items-center justify-center">
                        Live Demo
                    </Link>
                </div>

                {/* Hero Visual */}
                <div className="mt-20 relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl blur opacity-20"></div>
                    <div className="relative bg-gray-900 rounded-2xl p-2 shadow-2xl border border-gray-800">
                        <img
                            src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=2874&auto=format&fit=crop"
                            alt="Dashboard Preview"
                            className="rounded-xl w-full object-cover opacity-90 hover:opacity-100 transition-opacity"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="bg-black/50 text-white px-6 py-3 rounded-lg backdrop-blur-sm border border-white/10">Dashboard Preview</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Features ───────────────────────────────────────────────────── */}
            <section className="py-24 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">Why choose G-DriveX?</h2>
                        <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
                            Stop switching between tabs. Get a unified view of your digital life with enterprise-grade features.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { icon: <LayoutDashboard className="w-6 h-6" />, title: "Unified Dashboard", description: "See all your files from multiple Google Drive accounts in one single, organized view." },
                            { icon: <Zap className="w-6 h-6" />, title: "Lightning Fast Link", description: "Connect new accounts in seconds with our secure OAuth 2.0 integration." },
                            { icon: <PieChart className="w-6 h-6" />, title: "Storage Analytics", description: "Visualise your storage usage across all accounts with beautiful interactive charts." },
                            { icon: <Shield className="w-6 h-6" />, title: "Bank-Grade Security", description: "Your tokens are encrypted using AES-256. We never see or store your passwords." },
                            { icon: <Share2 className="w-6 h-6" />, title: "Easy File Management", description: "Upload, delete, and manage files directly from the dashboard with drag-and-drop." },
                            { icon: <CheckCircle className="w-6 h-6" />, title: "Account Control", description: "Easily link and unlink accounts. You have total control over your connected data." },
                        ].map((feature, i) => (
                            <div key={i} className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                                <div className="bg-blue-50 dark:bg-indigo-900/30 w-12 h-12 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform mb-6">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">{feature.title}</h3>
                                <p className="text-gray-500 dark:text-gray-400 leading-relaxed">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA ────────────────────────────────────────────────────────── */}
            <section className="py-24 bg-white dark:bg-gray-950 transition-colors duration-300">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-indigo-600 rounded-3xl p-12 md:p-16 text-center text-white relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
                        <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-40"></div>
                        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-40"></div>

                        <div className="relative z-10">
                            <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to take control?</h2>
                            <p className="text-indigo-100 text-lg mb-10 max-w-2xl mx-auto">
                                Join thousands of users who are organizing their digital life with G-DriveX.
                                Free forever for personal use.
                            </p>
                            <Link to="/register" className="bg-white text-indigo-600 px-10 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-colors inline-flex items-center gap-2 shadow-lg">
                                Get Started Now <ArrowRight className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Footer ─────────────────────────────────────────────────────── */}
            <footer className="bg-white dark:bg-gray-950 py-12 border-t border-gray-100 dark:border-gray-800 transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <HardDrive className="w-5 h-5 text-gray-400" />
                        <span className="font-semibold text-gray-900 dark:text-gray-100">G-DriveX</span>
                    </div>
                    <div className="text-gray-500 dark:text-gray-500 text-sm">
                        © {new Date().getFullYear()} G-DriveX. All rights reserved.
                    </div>
                    <div className="flex gap-6">
                        <a href="#" className="text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Privacy</a>
                        <a href="#" className="text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Terms</a>
                        <a href="#" className="text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Github</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;

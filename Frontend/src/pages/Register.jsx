import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import useThemeStore from '../store/useThemeStore';
import { HardDrive, Sun, Moon, FolderOpen } from 'lucide-react';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { register, isLoading, error } = useAuthStore();
    const { theme, toggleTheme } = useThemeStore();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await register(name, email, password);
            navigate('/dashboard');
        } catch {
            // Error handled in store
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">

            {/* Navbar */}
            <nav className="w-full bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2">
                            <div className="bg-teal-600 p-2 rounded-lg">
                                <HardDrive className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-cyan-600">
                                G-DriveX
                            </span>
                        </Link>

                        {/* Right side */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={toggleTheme}
                                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                                className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all active:scale-[0.97]"
                            >
                                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                            </button>
                            <Link
                                to="/login"
                                className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                            >
                                Sign in
                            </Link>
                            <Link
                                to="/login"
                                className="text-sm bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-full font-medium transition-colors"
                            >
                                Login
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Form Card */}
            <div className="relative flex items-center justify-center px-4 py-16 overflow-hidden">
                <div className="pointer-events-none absolute inset-0 -z-10">
                    <div className="animate-float absolute top-10 left-10 w-64 h-64 bg-teal-300/20 dark:bg-teal-600/10 rounded-full blur-3xl" />
                    <div className="animate-float-slow absolute bottom-10 right-10 w-72 h-72 bg-cyan-300/20 dark:bg-cyan-600/10 rounded-full blur-3xl" />
                </div>
                <div className="animate-fade-in max-w-md w-full p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 transition-colors duration-300">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 mb-4">
                            <FolderOpen className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Create Account</h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">Start managing your drives today</p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-100 dark:border-red-800">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                placeholder="John Doe"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                placeholder="you@example.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={8}
                                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                placeholder="••••••••"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed mt-2"
                        >
                            {isLoading ? 'Creating account...' : 'Create Account'}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                        Already have an account?{' '}
                        <Link to="/login" className="text-teal-600 dark:text-teal-400 font-medium hover:underline">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;

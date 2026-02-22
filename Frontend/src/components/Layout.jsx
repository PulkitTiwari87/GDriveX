import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, FolderOpen, LogOut, HardDrive, Settings, Sun, Moon } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import useThemeStore from '../store/useThemeStore';
import clsx from 'clsx';
import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const Layout = () => {
    const { user, logout, fetchProfile } = useAuthStore();
    const { theme, toggleTheme } = useThemeStore();
    const navigate = useNavigate();
    const location = useLocation();

    // Refresh profile from server on mount so name/picture are always fresh
    useEffect(() => {
        fetchProfile();
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Analytics', path: '/analytics', icon: HardDrive },
        { name: 'Settings', path: '/settings', icon: Settings },
    ];

    const avatarUrl = user?.profilePicture
        ? `${BACKEND_URL}${user.profilePicture}`
        : null;

    const initials = user?.name?.[0]?.toUpperCase() || '?';

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
            {/* Sidebar */}
            <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 hidden md:flex flex-col">
                {/* Logo */}
                <div className="p-6">
                    <h1 className="text-2xl font-bold text-indigo-600 flex items-center gap-2">
                        <FolderOpen className="w-8 h-8" />
                        G-DriveX
                    </h1>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-4 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={clsx(
                                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                                    isActive
                                        ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-medium'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                                )}
                            >
                                <Icon className="w-5 h-5" />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom section */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
                    {/* Dark mode toggle */}
                    <button
                        onClick={toggleTheme}
                        className="flex w-full items-center gap-3 px-4 py-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                    >
                        {theme === 'dark'
                            ? <Sun className="w-5 h-5 text-amber-400" />
                            : <Moon className="w-5 h-5" />
                        }
                        {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                    </button>

                    {/* User profile area */}
                    <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                        {/* Avatar: profile picture or initials */}
                        {avatarUrl ? (
                            <img
                                src={avatarUrl}
                                alt={user?.name}
                                className="w-9 h-9 rounded-full object-cover ring-2 ring-indigo-200 dark:ring-indigo-700 shrink-0"
                            />
                        ) : (
                            <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold text-sm shrink-0">
                                {initials}
                            </div>
                        )}
                        <div className="overflow-hidden flex-1">
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                                {user?.name || 'User'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                        </div>
                    </div>

                    {/* Logout */}
                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
                <div className="p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;

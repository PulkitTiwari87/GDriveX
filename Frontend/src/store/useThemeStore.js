import { create } from 'zustand';

const getInitialTheme = () => {
    const stored = localStorage.getItem('theme');
    if (stored) return stored;
    // Respect OS preference on first visit
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const applyTheme = (theme) => {
    const root = document.documentElement;
    if (theme === 'dark') {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
};

// Apply theme immediately on store creation (before React renders)
applyTheme(getInitialTheme());

const useThemeStore = create((set, get) => ({
    theme: getInitialTheme(),

    toggleTheme: () => {
        const next = get().theme === 'light' ? 'dark' : 'light';
        applyTheme(next);
        set({ theme: next });
    },

    setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
    },
}));

export default useThemeStore;

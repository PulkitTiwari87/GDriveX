import { create } from 'zustand';
import api from '../lib/axios';

// Load persisted user from localStorage
const storedUser = (() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
})();

const useAuthStore = create((set) => ({
    user: storedUser || null,
    isAuthenticated: !!localStorage.getItem('token'),
    isLoading: false,
    isUpdating: false,
    error: null,

    login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
            const { data } = await api.post('/auth/login', { email, password });
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data));
            set({ user: data, isAuthenticated: true, isLoading: false });
            return data;
        } catch (error) {
            set({ error: error.response?.data?.message || 'Login failed', isLoading: false });
            throw error;
        }
    },

    register: async (name, email, password) => {
        set({ isLoading: true, error: null });
        try {
            const { data } = await api.post('/auth/register', { name, email, password });
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data));
            set({ user: data, isAuthenticated: true, isLoading: false });
            return data;
        } catch (error) {
            set({ error: error.response?.data?.message || 'Registration failed', isLoading: false });
            throw error;
        }
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ user: null, isAuthenticated: false });
    },

    // Fetch latest profile from API and sync to store + localStorage
    fetchProfile: async () => {
        try {
            const { data } = await api.get('/auth/me');
            localStorage.setItem('user', JSON.stringify({ ...data, token: localStorage.getItem('token') }));
            set((state) => ({ user: { ...state.user, ...data } }));
        } catch (error) {
            console.error('Failed to fetch profile:', error);
        }
    },

    // Update profile (name, bio, profilePicture) via multipart/form-data
    updateProfile: async (formData) => {
        // Use separate `isUpdating` flag so ProtectedRoute's `isLoading` check
        // doesn't unmount the layout while the save is in progress.
        set({ isUpdating: true, error: null });
        try {
            // Do NOT set Content-Type manually — axios detects FormData and sets
            // 'multipart/form-data; boundary=...' automatically with the correct boundary.
            const { data } = await api.put('/auth/me', formData);
            const updated = { ...data, token: localStorage.getItem('token') };
            localStorage.setItem('user', JSON.stringify(updated));
            set({ user: updated, isUpdating: false });
            return data;
        } catch (error) {
            set({ error: error.response?.data?.message || 'Update failed', isUpdating: false });
            throw error;
        }
    },
}));

export default useAuthStore;

import axios from 'axios';

const BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const api = axios.create({
    baseURL: `${BASE}/api`,
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        // Only force a logout+redirect when a session actually existed and was
        // rejected (e.g. an expired/invalid token on an authenticated request).
        // A 401 with no stored token — e.g. a plain wrong-password login
        // attempt — is a normal business error the calling page should show
        // inline, not a reason to nuke state and hard-navigate away.
        if (error.response?.status === 401 && localStorage.getItem('token')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;

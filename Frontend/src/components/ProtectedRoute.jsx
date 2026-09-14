import { Navigate, Outlet } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

const ProtectedRoute = () => {
    const { isAuthenticated, isLoading } = useAuthStore();

    if (isLoading) {
        return (
            <div role="status" className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
                <Loader2 className="w-8 h-8 text-teal-600 dark:text-teal-400 animate-spin" />
                <span className="sr-only">Loading…</span>
            </div>
        );
    }

    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;

import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../lib/axios';
import { Loader2 } from 'lucide-react';

const AuthCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const code = searchParams.get('code');
    const processed = useRef(false);

    useEffect(() => {
        const linkAccount = async () => {
            if (!code || processed.current) return;
            processed.current = true;

            try {
                await api.post('/drive/callback', { code });
                navigate('/dashboard?success=drive_linked');
            } catch (error) {
                console.error('Failed to link account', error);
                navigate('/dashboard?error=link_failed');
            }
        };

        linkAccount();
    }, [code, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 flex-col">
            <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
            <h2 className="text-xl font-medium text-gray-900">Linking your Google Account...</h2>
        </div>
    );
};

export default AuthCallback;

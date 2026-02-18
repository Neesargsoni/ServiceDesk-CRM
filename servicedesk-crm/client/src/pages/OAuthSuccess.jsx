import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { useSocket } from '../context/SocketContext';

function OAuthSuccess() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { connectSocket } = useSocket();

    useEffect(() => {
        const token = searchParams.get('token');

        if (token) {
            localStorage.setItem('token', token);

            // Fetch user details
            // The API endpoint is /api/me because AuthRoutes is mounted at /api
            // and we added router.get('/me')
            api.get('/api/me')
                .then(res => {
                    localStorage.setItem('user', JSON.stringify(res.data));
                    connectSocket(res.data);
                    navigate('/dashboard');
                })
                .catch(err => {
                    console.error("Failed to fetch user:", err);
                    navigate('/login?error=Failed+to+load+user+profile');
                });
        } else {
            navigate('/login?error=No+token+provided');
        }
    }, [searchParams, navigate, connectSocket]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
            <div className="text-center">
                <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">Authenticating...</h2>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
        </div>
    );
}

export default OAuthSuccess;

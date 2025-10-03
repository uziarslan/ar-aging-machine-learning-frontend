import React from 'react';
import axiosInstance from '../services/axiosInstance';
import API_CONFIG from '../config/api';

const Header = ({ onMenuClick, onUploadClick, onLogout, user }) => {
    const [open, setOpen] = React.useState(false);
    const [isOnline, setIsOnline] = React.useState(true);
    const initials = React.useMemo(() => {
        const n = (user?.name || user?.email || '')
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map(s => s.charAt(0).toUpperCase())
            .join('');
        return n || 'U';
    }, [user]);

    React.useEffect(() => {
        let mounted = true;
        const checkHealth = async () => {
            try {
                const base = axiosInstance?.defaults?.baseURL || '';
                const res = await fetch(`${base}${API_CONFIG.ENDPOINTS.HEALTH}`, { method: 'GET' });
                if (mounted) setIsOnline(res && res.ok);
            } catch (e) {
                if (mounted) setIsOnline(false);
            }
        };
        checkHealth();
        const id = setInterval(checkHealth, 15000);
        const goOffline = () => setIsOnline(false);
        const goOnline = () => setIsOnline(true);
        window.addEventListener('offline', goOffline);
        window.addEventListener('online', goOnline);
        return () => {
            mounted = false;
            clearInterval(id);
            window.removeEventListener('offline', goOffline);
            window.removeEventListener('online', goOnline);
        };
    }, []);
    return (
        <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="px-3 sm:px-6 py-3 sm:py-4">
                <div className="flex items-center justify-between">
                    {/* Left side */}
                    <div className="flex items-center min-w-0 flex-1">
                        <button
                            onClick={onMenuClick}
                            className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200"
                            aria-label="Toggle navigation menu"
                        >
                            <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>

                        <div className="ml-2 sm:ml-4 lg:ml-0 min-w-0 flex-1">
                            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">AR Aging</h1>
                            <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Machine Learning Powered Financial Forecasting</p>
                        </div>
                    </div>

                    {/* Right side */}
                    <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-4 relative flex-shrink-0">
                        <button
                            onClick={onUploadClick}
                            className="btn-primary flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm"
                        >
                            <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <span className="hidden sm:inline">Upload Data</span>
                            <span className="sm:hidden">Upload</span>
                        </button>

                        {/* Status indicator */}
                        <div className="flex items-center space-x-1 sm:space-x-2">
                            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-success-500' : 'bg-red-500'}`}></div>
                            <span className="text-xs sm:text-sm text-gray-600 hidden sm:inline">{isOnline ? 'System Online' : 'System Offline'}</span>
                            <span className="text-xs text-gray-600 sm:hidden">{isOnline ? 'Online' : 'Offline'}</span>
                        </div>
                        {user && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setOpen(o => !o)}
                                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                                    aria-label="User menu"
                                >
                                    <span className="text-xs sm:text-sm font-semibold">{initials}</span>
                                </button>
                                {open && (
                                    <div className="absolute right-0 top-10 sm:top-12 w-48 sm:w-56 bg-white border border-gray-200 rounded-md shadow-md z-40">
                                        <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-100">
                                            <div className="text-sm font-medium text-gray-900 truncate">{user.name || 'User'}</div>
                                            <div className="text-xs text-gray-600 truncate">{user.email}</div>
                                        </div>
                                        <button
                                            onClick={onLogout}
                                            className="w-full text-left px-3 sm:px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                                        >
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;


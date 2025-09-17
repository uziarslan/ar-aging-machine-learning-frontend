import React from 'react';
import { useLocation } from 'react-router-dom';

const Sidebar = ({ isOpen, onClose, onNavigation }) => {
    const location = useLocation();

    const menuItems = [
        {
            id: 'dashboard',
            name: 'Dashboard',
            path: '/',
            icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
                </svg>
            ),
            description: 'Generate predictions'
        },
        {
            id: 'clients',
            name: 'Clients',
            path: '/clients',
            icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            ),
            description: 'View client history'
        }
    ];

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden transition-opacity duration-300"
                    onClick={onClose}
                    aria-label="Close navigation menu"
                />
            )}

            {/* Sidebar */}
            <div className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 lg:shadow-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
                <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Navigation</h2>
                    <button
                        onClick={onClose}
                        className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-200"
                        aria-label="Close navigation menu"
                    >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <nav className="mt-6 px-3">
                    <div className="space-y-1">
                        {menuItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        if (onNavigation) {
                                            onNavigation(item.path);
                                        }
                                        onClose();
                                    }}
                                    className={`
                  w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors duration-200
                  ${isActive
                                            ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-600'
                                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                                        }
                `}
                                >
                                    <span className={`mr-3 ${isActive ? 'text-primary-600' : 'text-gray-400'}`}>
                                        {item.icon}
                                    </span>
                                    <div className="flex-1 text-left">
                                        <div className="font-medium">{item.name}</div>
                                        <div className="text-xs text-gray-500">{item.description}</div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </nav>

                {/* Footer */}
                <div className="absolute bottom-0 w-full p-4 border-t border-gray-200">
                    <div className="text-xs text-gray-500 text-center">
                        <p>AR Aging Predictions</p>
                        <p>v1.0.0</p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Sidebar;


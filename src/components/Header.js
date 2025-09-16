import React from 'react';

const Header = ({ onMenuClick, onUploadClick }) => {
    return (
        <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="px-6 py-4">
                <div className="flex items-center justify-between">
                    {/* Left side */}
                    <div className="flex items-center">
                        <button
                            onClick={onMenuClick}
                            className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200"
                            aria-label="Toggle navigation menu"
                        >
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>

                        <div className="ml-4 lg:ml-0">
                            <h1 className="text-2xl font-bold text-gray-900">AR Aging Predictions</h1>
                            <p className="text-sm text-gray-600">Machine Learning Powered Financial Forecasting</p>
                        </div>
                    </div>

                    {/* Right side */}
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={onUploadClick}
                            className="btn-primary flex items-center space-x-2"
                        >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <span>Upload Data</span>
                        </button>

                        {/* Status indicator */}
                        <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-success-500 rounded-full"></div>
                            <span className="text-sm text-gray-600">System Online</span>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;


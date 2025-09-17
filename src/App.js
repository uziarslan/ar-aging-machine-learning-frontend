import React, { useState, useRef, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Clients from './components/Clients';
import UploadModal from './components/UploadModal';
import Header from './components/Header';
import Sidebar from './components/Sidebar';

// Main App Content Component
function AppContent() {
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
    const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
    const [pendingView, setPendingView] = useState(null);
    const dashboardRef = useRef(null);
    const location = useLocation();
    const navigate = useNavigate();

    // Handle window resize for responsive behavior
    React.useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            // Auto-close sidebar on mobile when switching views
            if (mobile && sidebarOpen) {
                setSidebarOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [sidebarOpen]);

    // Function to handle accordion expansion (will be passed to Clients component)
    const handleAccordionExpand = () => {
        // Always close sidebar on mobile when accordion expands to prevent horizontal scroll
        if (isMobile) {
            setSidebarOpen(false);
        }
    };


    // Handle unsaved dialog actions
    const handleSaveAndSwitch = () => {
        if (dashboardRef.current) {
            dashboardRef.current.saveAndSwitch(pendingView);
        }
        setShowUnsavedDialog(false);
        setPendingView(null);
    };

    const handleSkipAndSwitch = () => {
        if (dashboardRef.current) {
            dashboardRef.current.clearPredictions();
        }
        navigate(pendingView);
        setShowUnsavedDialog(false);
        setPendingView(null);
    };

    // Function to handle navigation with unsaved predictions check
    const handleNavigation = useCallback((newPath) => {
        // Check if there are unsaved predictions
        if (location.pathname === '/' && dashboardRef.current) {
            const hasUnsavedPredictions = dashboardRef.current.hasUnsavedPredictions();
            if (hasUnsavedPredictions) {
                setPendingView(newPath);
                setShowUnsavedDialog(true);
                return;
            }
        }
        navigate(newPath);
    }, [location.pathname, navigate]);

    const handleCancelSwitch = () => {
        setShowUnsavedDialog(false);
        setPendingView(null);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <Header
                onMenuClick={() => setSidebarOpen(!sidebarOpen)}
                onUploadClick={() => setIsUploadModalOpen(true)}
            />

            <div className="flex">
                {/* Sidebar */}
                <Sidebar
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                    onNavigation={handleNavigation}
                />

                {/* Main Content */}
                <main className={`flex-1 transition-all duration-300 overflow-hidden ${sidebarOpen && !isMobile ? 'lg:ml-0' : ''}`}>
                    <div className="p-2 sm:p-4 min-w-0">
                        <Routes>
                            <Route path="/" element={<Dashboard ref={dashboardRef} onNavigation={handleNavigation} />} />
                            <Route path="/clients" element={<Clients onAccordionExpand={handleAccordionExpand} />} />
                        </Routes>
                    </div>
                </main>
            </div>

            {/* Upload Modal */}
            {isUploadModalOpen && (
                <UploadModal
                    onClose={() => setIsUploadModalOpen(false)}
                    onSuccess={(result) => {
                        setIsUploadModalOpen(false);
                        navigate('/');
                        // Update client list with data from upload response
                        if (dashboardRef.current && result.clients) {
                            dashboardRef.current.updateClients(result.clients);
                        }
                        // Show success message
                        if (result && result.records_processed) {
                            setTimeout(() => {
                                alert(`Success! Processed ${result.records_processed} records and trained model.`);
                            }, 100);
                        }
                    }}
                />
            )}

            {/* Unsaved Predictions Dialog */}
            {showUnsavedDialog && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
                        <div className="p-6">
                            <div className="flex items-center mb-4">
                                <svg className="h-6 w-6 text-amber-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                                <h3 className="text-lg font-semibold text-gray-900">Unsaved Predictions</h3>
                            </div>
                            <p className="text-gray-600 mb-6">
                                You have unsaved predictions. Would you like to save and retrain the model before switching tabs?
                            </p>
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={handleCancelSwitch}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSkipAndSwitch}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                >
                                    Skip & Switch
                                </button>
                                <button
                                    onClick={handleSaveAndSwitch}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Save & Switch
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Main App Component with Router
function App() {
    return (
        <Router>
            <AppContent />
        </Router>
    );
}

export default App;

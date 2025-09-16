import React, { useState, useRef } from 'react';
import Dashboard from './components/Dashboard';
import Clients from './components/Clients';
import UploadModal from './components/UploadModal';
import Header from './components/Header';
import Sidebar from './components/Sidebar';

function App() {
    const [currentView, setCurrentView] = useState('dashboard');
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
    const dashboardRef = useRef(null);

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
                    currentView={currentView}
                    onViewChange={setCurrentView}
                />

                {/* Main Content */}
                <main className={`flex-1 transition-all duration-300 overflow-hidden ${sidebarOpen && !isMobile ? 'lg:ml-0' : ''}`}>
                    <div className="p-2 sm:p-4 min-w-0">
                        {/* Always render Dashboard to ensure update function is available */}
                        <div style={{ display: currentView === 'dashboard' ? 'block' : 'none' }}>
                            <Dashboard ref={dashboardRef} />
                        </div>
                        {currentView === 'clients' && (
                            <Clients onAccordionExpand={handleAccordionExpand} />
                        )}
                        {currentView === 'upload' && (
                            <div className="max-w-4xl mx-auto">
                                <div className="text-center py-12">
                                    <h1 className="text-3xl font-bold text-gray-900 mb-4">Upload Client Data</h1>
                                    <p className="text-gray-600 mb-8">Upload Excel files to train models for new clients</p>
                                    <button
                                        onClick={() => setIsUploadModalOpen(true)}
                                        className="btn-primary text-lg px-8 py-3"
                                    >
                                        Upload Excel File
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Upload Modal */}
            {isUploadModalOpen && (
                <UploadModal
                    onClose={() => setIsUploadModalOpen(false)}
                    onSuccess={(result) => {
                        setIsUploadModalOpen(false);
                        setCurrentView('dashboard');
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
        </div>
    );
}

export default App;

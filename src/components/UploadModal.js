import React, { useState, useEffect } from 'react';
import API_CONFIG, { getUploadHeaders } from '../config/api';

const UploadModal = ({ onClose, onSuccess }) => {
    const [file, setFile] = useState(null);
    const [clientName, setClientName] = useState('');
    const [description, setDescription] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStartTime, setUploadStartTime] = useState(null);
    const [elapsedTime, setElapsedTime] = useState(0);

    // No need for useApi in this component since we're using direct fetch

    // Timer for upload elapsed time
    useEffect(() => {
        let interval = null;
        if (isUploading && uploadStartTime) {
            interval = setInterval(() => {
                const now = Date.now();
                setElapsedTime(Math.floor((now - uploadStartTime) / 1000));
            }, 1000);
        } else {
            setElapsedTime(0);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isUploading, uploadStartTime]);

    const formatElapsedTime = (seconds) => {
        if (seconds < 60) {
            return `${seconds}s`;
        } else {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            return `${minutes}m ${remainingSeconds}s`;
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        const fileExtension = selectedFile.name.split('.').pop().toLowerCase();

        if (fileExtension === 'xlsx' || fileExtension === 'xls') {
            setFile(selectedFile);
        } else {
            alert('Please select an Excel file (.xlsx/.xls)');
        }
    };

    const handleUpload = async () => {
        if (!file || !clientName.trim()) {
            alert('Please select a file and enter a client name');
            return;
        }

        setIsUploading(true);
        setUploadStartTime(Date.now());
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('client_name', clientName.trim());
            formData.append('description', description.trim());

            const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.UPLOAD}`, {
                method: 'POST',
                headers: getUploadHeaders(),
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `Upload failed: ${response.status}`);
            }

            const result = await response.json();
            // Success - let the parent handle the success message and navigation
            onSuccess(result);
        } catch (error) {
            console.error('Upload failed:', error);
            alert(`Upload failed: ${error.message}`);
        } finally {
            setIsUploading(false);
            setUploadStartTime(null);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Upload Client Data</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                        >
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Form */}
                    <div className="space-y-6">
                        {/* Client Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Client Name *
                            </label>
                            <input
                                type="text"
                                value={clientName}
                                onChange={(e) => setClientName(e.target.value)}
                                className="input-field"
                                placeholder="Enter client name"
                                required
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description (Optional)
                            </label>
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="input-field"
                                placeholder="Brief description of the data"
                            />
                        </div>

                        {/* File Upload */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Excel File *
                            </label>
                            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors duration-200">
                                <div className="space-y-1 text-center">
                                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    <div className="flex text-sm text-gray-600">
                                        <label className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                                            <span>Upload a file</span>
                                            <input
                                                type="file"
                                                accept=".xlsx,.xls"
                                                onChange={handleFileChange}
                                                className="sr-only"
                                                required
                                            />
                                        </label>
                                        <p className="pl-1">or drag and drop</p>
                                    </div>
                                    <p className="text-xs text-gray-500">Excel files up to 10MB</p>
                                </div>
                            </div>
                            {file && (
                                <div className="mt-2 p-3 bg-success-50 border border-success-200 rounded-lg">
                                    <div className="flex items-center">
                                        <svg className="h-5 w-5 text-success-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <div className="ml-3">
                                            <p className="text-sm font-medium text-success-800">File Selected</p>
                                            <p className="text-sm text-success-700">{file.name}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* File Requirements */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-blue-800 mb-2">Excel File Requirements:</h4>
                            <ul className="text-xs text-blue-700 space-y-1">
                                <li>• Supported formats: Excel (.xlsx/.xls) only</li>
                                <li>• Each sheet should contain AR aging data for one month</li>
                                <li>• Sheet names should contain month/year (e.g., "AR-CAD Sept-2021")</li>
                                <li>• Each sheet should have headers like: Description, 0-30, 31-60, 61-90, 90+, Total</li>
                                <li>• All sheets will be automatically processed</li>
                                <li>• System will detect headers and clean data automatically</li>
                            </ul>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end space-x-3 pt-4">
                            <button
                                onClick={onClose}
                                className={`btn-secondary ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                disabled={isUploading}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpload}
                                disabled={!file || !clientName.trim() || isUploading}
                                className={`btn-primary flex items-center space-x-2 ${(!file || !clientName.trim() || isUploading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {isUploading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Uploading & Training... {formatElapsedTime(elapsedTime)}</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                        Upload & Train Model
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UploadModal;

import React, { useState, useRef, useEffect } from 'react';

const ClientSelector = ({ clients, selectedClient, onClientChange, loading, error, onEntriesChange, lastMonthEntriesCount = 0 }) => {
    const [entries, setEntries] = useState([{ description: '', amount: '' }]);

    // Upload modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [uploadedData, setUploadedData] = useState(null);
    const [selectedDescriptionColumn, setSelectedDescriptionColumn] = useState('');
    const [selectedAmountColumn, setSelectedAmountColumn] = useState('');
    const [modalError, setModalError] = useState('');
    const [modalSuccess, setModalSuccess] = useState('');

    const fileInputRef = useRef(null);
    const modalRef = useRef(null);

    // Handle file upload
    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const fileName = file.name.toLowerCase();
        const isExcel = fileName.endsWith('.xlsx');
        const isCSV = fileName.endsWith('.csv');

        if (!isExcel && !isCSV) {
            setModalError('Please select a valid .xlsx or .csv file');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                let jsonData = [];

                if (isExcel) {
                    // Handle Excel files
                    const data = new Uint8Array(e.target.result);
                    const workbook = window.XLSX.read(data, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    jsonData = window.XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                } else if (isCSV) {
                    // Handle CSV files
                    const csvText = e.target.result;
                    const lines = csvText.split('\n').filter(line => line.trim() !== '');

                    jsonData = lines.map(line => {
                        // Simple CSV parsing - handles basic cases
                        // For more complex CSV with quoted fields, we'd need a proper CSV parser
                        const values = line.split(',').map(value => value.trim().replace(/^"|"$/g, ''));
                        return values;
                    });
                }

                if (jsonData.length === 0) {
                    setModalError('The file appears to be empty');
                    return;
                }

                const headers = jsonData[0];
                const allRows = jsonData.slice(1);

                // Filter out rows that contain "Total" or "Totals" in any column
                const rows = allRows.filter(row => {
                    return !row.some(cell => {
                        const cellValue = cell?.toString().toLowerCase().trim() || '';
                        return cellValue === 'total' || cellValue === 'totals';
                    });
                });

                setUploadedData({ headers, rows });
                setSelectedDescriptionColumn('');
                setSelectedAmountColumn('');
                setModalError('');
                setModalSuccess('');
                setIsModalOpen(true);
            } catch (error) {
                setModalError(`Error parsing file. Please ensure it's a valid ${isExcel ? 'Excel' : 'CSV'} file.`);
            }
        };

        if (isExcel) {
            reader.readAsArrayBuffer(file);
        } else {
            reader.readAsText(file);
        }
    };

    // Handle upload button click
    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    // Handle modal close
    const handleModalClose = () => {
        setIsModalOpen(false);
        setUploadedData(null);
        setSelectedDescriptionColumn('');
        setSelectedAmountColumn('');
        setModalError('');
        setModalSuccess('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Handle column mapping confirmation
    const handleConfirmMapping = () => {
        if (!selectedDescriptionColumn || !selectedAmountColumn) {
            setModalError('Please select both Description and 0-30 Days columns');
            return;
        }

        if (!uploadedData) {
            setModalError('No data to process');
            return;
        }

        const descriptionIndex = uploadedData.headers.indexOf(selectedDescriptionColumn);
        const amountIndex = uploadedData.headers.indexOf(selectedAmountColumn);

        const newEntries = [];
        let validRows = 0;

        for (const row of uploadedData.rows) {
            const description = row[descriptionIndex]?.toString().trim() || '';
            const amountValue = row[amountIndex];

            if (!description) continue;

            // Validate amount
            const amount = parseFloat(amountValue);
            if (isNaN(amount) || amount < 0) {
                continue; // Skip invalid rows
            }

            newEntries.push({
                description,
                amount: amount.toString()
            });
            validRows++;
        }

        if (newEntries.length === 0) {
            setModalError('No valid entries found. Please check your data and column selections.');
            return;
        }

        // First, populate any existing empty entries, then append new ones
        const updatedEntries = [...entries];
        let newEntryIndex = 0;

        // Fill existing empty entries first
        for (let i = 0; i < updatedEntries.length && newEntryIndex < newEntries.length; i++) {
            const existingEntry = updatedEntries[i];
            if (!existingEntry.description.trim() && !existingEntry.amount.trim()) {
                // This entry is empty, populate it
                updatedEntries[i] = newEntries[newEntryIndex];
                newEntryIndex++;
            }
        }

        // Add remaining new entries
        while (newEntryIndex < newEntries.length) {
            updatedEntries.push(newEntries[newEntryIndex]);
            newEntryIndex++;
        }

        setEntries(updatedEntries);

        if (onEntriesChange) {
            onEntriesChange(updatedEntries);
        }

        setModalSuccess(`Successfully imported ${validRows} entries`);
        setTimeout(() => {
            handleModalClose();
        }, 1500);
    };

    // Handle escape key and outside click
    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === 'Escape' && isModalOpen) {
                handleModalClose();
            }
        };

        const handleOutsideClick = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target) && isModalOpen) {
                handleModalClose();
            }
        };

        if (isModalOpen) {
            document.addEventListener('keydown', handleEscape);
            document.addEventListener('mousedown', handleOutsideClick);
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.removeEventListener('mousedown', handleOutsideClick);
        };
    }, [isModalOpen]);

    const handleEntryChange = (index, field, value) => {
        const newEntries = [...entries];
        newEntries[index][field] = value;
        setEntries(newEntries);
        if (onEntriesChange) {
            onEntriesChange(newEntries);
        }
    };

    const addEntry = () => {
        const newEntries = [...entries, { description: '', amount: '' }];
        setEntries(newEntries);
        if (onEntriesChange) {
            onEntriesChange(newEntries);
        }
    };

    const removeEntry = (index) => {
        if (entries.length > 1) {
            const newEntries = entries.filter((_, i) => i !== index);
            setEntries(newEntries);
            if (onEntriesChange) {
                onEntriesChange(newEntries);
            }
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    // Count only entries that have actual values (not empty)
    const getValidEntriesCount = () => {
        return entries.filter(entry =>
            entry.description.trim() !== '' || entry.amount.trim() !== ''
        ).length;
    };

    if (loading) {
        return (
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                    Client
                </label>
                <div className="animate-pulse bg-gray-200 h-10 rounded-md"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                    Client
                </label>
                <div className="text-red-600 text-sm">
                    Error loading clients: {error}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Client Selection */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                    Client *
                </label>
                <select
                    value={selectedClient?.id || ''}
                    onChange={(e) => {
                        const client = clients.find(c => c.id === e.target.value);
                        onClientChange(client);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                >
                    <option value="">Select a client</option>
                    {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                            {client.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Entries Summary */}
            <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-sm font-medium text-blue-800">Entries Summary:</span>
                    </div>
                    <div className="text-sm text-blue-700">
                        {lastMonthEntriesCount > 0 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                                {lastMonthEntriesCount} from last month
                            </span>
                        )}
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {getValidEntriesCount()} new entries
                        </span>
                    </div>
                </div>
                <div className="mt-2 text-xs text-blue-600">
                    Total entries: <span className="font-semibold">{lastMonthEntriesCount + getValidEntriesCount()}</span>
                </div>
            </div>

            {/* Dynamic Entries Section */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">
                        Additional Entries
                    </label>
                    <div className="flex space-x-2">
                        <button
                            type="button"
                            onClick={handleUploadClick}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            Upload
                        </button>
                        <button
                            type="button"
                            onClick={addEntry}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Entry
                        </button>
                    </div>
                </div>

                {/* Hidden file input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                />

                <div className="space-y-3">
                    {entries.map((entry, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                            <div className="md:col-span-2">
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Description
                                </label>
                                <input
                                    type="text"
                                    value={entry.description}
                                    onChange={(e) => handleEntryChange(index, 'description', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    placeholder="Enter description"
                                />
                            </div>
                            <div className="flex items-end space-x-2">
                                <div className="flex-1">
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                        Amount
                                        {entry.amount && (
                                            <span className="ml-2 text-gray-500 font-normal">
                                                ({formatCurrency(parseFloat(entry.amount) || 0)})
                                            </span>
                                        )}
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="text-gray-500 text-sm">$</span>
                                        </div>
                                        <input
                                            type="number"
                                            value={entry.amount}
                                            onChange={(e) => handleEntryChange(index, 'amount', e.target.value)}
                                            className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                            placeholder="0"
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>
                                </div>
                                {entries.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeEntry(index)}
                                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                                        title="Remove entry"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>


                {/* Total Amount Display */}
                {entries.some(entry => entry.amount && entry.amount.trim() !== '') && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-md">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">Total Amount:</span>
                            <span className="text-lg font-bold text-gray-900">
                                {formatCurrency(entries.reduce((sum, entry) => sum + (parseFloat(entry.amount) || 0), 0))}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Upload Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div
                        ref={modalRef}
                        className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
                    >
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Map File Columns
                                </h3>
                                <button
                                    onClick={handleModalClose}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {modalError && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                                    <div className="flex">
                                        <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p className="text-sm text-red-700">{modalError}</p>
                                    </div>
                                </div>
                            )}

                            {modalSuccess && (
                                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                                    <div className="flex">
                                        <svg className="w-5 h-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <p className="text-sm text-green-700">{modalSuccess}</p>
                                    </div>
                                </div>
                            )}

                            {uploadedData && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Select Description Column
                                        </label>
                                        <select
                                            value={selectedDescriptionColumn}
                                            onChange={(e) => setSelectedDescriptionColumn(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="">Choose a column...</option>
                                            {uploadedData.headers.map((header, index) => (
                                                <option key={index} value={header}>
                                                    {header}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Select 0-30 Days Column
                                        </label>
                                        <select
                                            value={selectedAmountColumn}
                                            onChange={(e) => setSelectedAmountColumn(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="">Choose a column...</option>
                                            {uploadedData.headers.map((header, index) => (
                                                <option key={index} value={header}>
                                                    {header}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Data Preview Table */}
                                    <div className="mt-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Data Preview (First 10 rows)
                                        </label>
                                        <div className="border border-gray-200 rounded-md overflow-hidden">
                                            <div className="overflow-x-auto max-h-64">
                                                <table className="min-w-full divide-y divide-gray-200">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            {uploadedData.headers.map((header, index) => (
                                                                <th key={index} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                    {header}
                                                                </th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {uploadedData.rows.slice(0, 10).map((row, rowIndex) => (
                                                            <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                                {row.map((cell, cellIndex) => {
                                                                    const cellValue = cell?.toString() || '';
                                                                    const isNumeric = !isNaN(parseFloat(cellValue)) && isFinite(cellValue);
                                                                    return (
                                                                        <td key={cellIndex} className="px-3 py-2 text-xs text-gray-900">
                                                                            {isNumeric ? (
                                                                                <span className="text-gray-400 italic">[numeric]</span>
                                                                            ) : (
                                                                                <span className={cellValue.length > 30 ? 'truncate block max-w-xs' : ''} title={cellValue}>
                                                                                    {cellValue || '-'}
                                                                                </span>
                                                                            )}
                                                                        </td>
                                                                    );
                                                                })}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                        {uploadedData.rows.length > 10 && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                Showing first 10 rows of {uploadedData.rows.length} total rows
                                            </p>
                                        )}
                                    </div>

                                    <div className="text-xs text-gray-500">
                                        <p>Total rows: {uploadedData.rows.length}</p>
                                        <p>Note: Only rows with valid numeric amounts will be imported</p>
                                        <p>Rows containing "Total" or "Totals" are automatically excluded</p>
                                        <p>Supported formats: Excel (.xlsx) and CSV (.csv)</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    onClick={handleModalClose}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmMapping}
                                    disabled={!selectedDescriptionColumn || !selectedAmountColumn}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Confirm
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientSelector;

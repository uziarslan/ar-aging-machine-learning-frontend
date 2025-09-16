import React, { useState } from 'react';

const ClientSelector = ({ clients, selectedClient, onClientChange, loading, error, onEntriesChange, lastMonthEntriesCount = 0 }) => {
    const [entries, setEntries] = useState([{ description: '', amount: '' }]);

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
                                    {entry.amount && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            {formatCurrency(parseFloat(entry.amount) || 0)}
                                        </p>
                                    )}
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
        </div>
    );
};

export default ClientSelector;

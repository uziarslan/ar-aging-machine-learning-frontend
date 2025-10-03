import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ClientSelector from './ClientSelector';
import PredictionForm from './PredictionForm';
import PredictionsTable from './PredictionsTable';
import ApproveModal from './ApproveModal';
import DownloadButton from './DownloadButton';
import StatsCards from './StatsCards';
import useApi from '../hooks/useApi';
import API_CONFIG from '../config/api';

const Dashboard = forwardRef(({ onNavigation }, ref) => {
    const navigate = useNavigate();
    const [selectedClient, setSelectedClient] = useState(null);
    const [targetMonth, setTargetMonth] = useState('');
    const [carryThreshold, setCarryThreshold] = useState(0.2);
    const [predictions, setPredictions] = useState([]);
    const [lastMonthData, setLastMonthData] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationStartTime, setGenerationStartTime] = useState(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [modelInfo, setModelInfo] = useState(null);
    const [clientLastMonth, setClientLastMonth] = useState(null);
    const [minTargetMonth, setMinTargetMonth] = useState('');
    const [targetMismatch, setTargetMismatch] = useState({ show: false, grandTotal: 0, targetTotal: 0 });
    const [clientEntries, setClientEntries] = useState([]);
    const [pendingViewAfterApproval, setPendingViewAfterApproval] = useState(null);

    // Column-specific targets state (now default)
    const [columnTargets, setColumnTargets] = useState({
        b0_30: '',
        b31_60: '',
        b61_90: '',
        b90_plus: ''
    });

    const { data: clients, loading: clientsLoading, error: clientsError } = useApi(API_CONFIG.ENDPOINTS.CLIENTS);
    const { post: generatePrediction, loading: predictionLoading } = useApi(null, { autoFetch: false });
    const { get: getClientLastMonth } = useApi(null, { autoFetch: false });

    // State to hold clients data that can be updated directly
    const [clientsData, setClientsData] = useState(clients || []);

    // Ref to track if we've set the month for the current client to prevent loops
    const monthSetForClient = useRef(null);

    // Update local clients data when API data changes
    useEffect(() => {
        setClientsData(clients || []);
    }, [clients]);

    // Timer for generation elapsed time
    useEffect(() => {
        let interval = null;
        if (isGenerating && generationStartTime) {
            interval = setInterval(() => {
                const now = Date.now();
                setElapsedTime(Math.floor((now - generationStartTime) / 1000));
            }, 1000);
        } else {
            setElapsedTime(0);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isGenerating, generationStartTime]);

    // Expose methods to parent component via ref
    useImperativeHandle(ref, () => ({
        updateClients: (newClients) => {
            setClientsData(newClients || []);
        },
        hasUnsavedPredictions: () => {
            return predictions.length > 0;
        },
        saveAndSwitch: (newPath) => {
            // Trigger the approve modal
            setShowApproveModal(true);
            // Store the view to switch to after approval
            setPendingViewAfterApproval(newPath);
        },
        navigateTo: (path) => {
            if (onNavigation) {
                onNavigation(path);
            } else {
                navigate(path);
            }
        },
        clearPredictions: () => {
            setPredictions([]);
        }
    }), [predictions, navigate, onNavigation]);

    // eslint-disable-next-line no-unused-vars
    const fetchLastMonthData = useCallback(async (clientId, targetMonth) => {
        try {
            // Calculate previous month
            const targetDate = new Date(targetMonth + '-01');
            const prevMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() - 1, 1);
            const prevMonthStr = prevMonth.toISOString().slice(0, 7); // YYYY-MM format

            const response = await getClientLastMonth(`${API_CONFIG.ENDPOINTS.CLIENT_HISTORY}/${clientId}/history?month=${prevMonthStr}`);

            if (response && Array.isArray(response)) {
                setLastMonthData(response);
            }
        } catch (error) {
            console.error('Failed to fetch last month data:', error);
            // Don't show error to user, just log it
        }
    }, [getClientLastMonth]);

    // Initialize with default month only once
    useEffect(() => {
        if (!targetMonth) {  // Only set if not already set
            const nextMonth = new Date();
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            setTargetMonth(nextMonth.toISOString().slice(0, 7));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty dependency array - runs only once, targetMonth excluded intentionally

    // Fetch last available month and last month data when client is selected
    // We intentionally depend only on selectedClient to avoid loops from unstable function identities
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        const fetchClientLastMonth = async () => {
            if (selectedClient) {
                // Check if we've already set the month for this client
                if (monthSetForClient.current === selectedClient.id) {
                    return; // Skip to prevent loops
                }

                try {
                    const response = await getClientLastMonth(`${API_CONFIG.ENDPOINTS.CLIENT_LAST_MONTH}/${selectedClient.id}/last_month`);
                    if (response && response.last_month) {
                        setClientLastMonth(response.last_month);

                        // Calculate the next month after the last available month
                        const lastDate = new Date(response.last_month + '-01');
                        lastDate.setMonth(lastDate.getMonth() + 1);
                        const nextAvailableMonth = lastDate.toISOString().slice(0, 7);

                        setMinTargetMonth(nextAvailableMonth);
                        setTargetMonth(nextAvailableMonth);

                        // Fetch exact last month's data (not derived), to ensure correct entries count
                        const prevMonthData = await getClientLastMonth(`${API_CONFIG.ENDPOINTS.CLIENT_HISTORY}/${selectedClient.id}/history?month=${response.last_month}`);
                        if (prevMonthData && Array.isArray(prevMonthData)) {
                            setLastMonthData(prevMonthData);
                        } else {
                            setLastMonthData([]);
                        }

                        // Mark that we've set the month for this client
                        monthSetForClient.current = selectedClient.id;
                    } else {
                        // No data for this client, allow any future month
                        setClientLastMonth(null);
                        const nextMonth = new Date();
                        nextMonth.setMonth(nextMonth.getMonth() + 1);
                        const nextAvailableMonth = nextMonth.toISOString().slice(0, 7);
                        setMinTargetMonth(nextAvailableMonth);
                        setTargetMonth(nextAvailableMonth);

                        // Clear last month data
                        setLastMonthData([]);

                        // Mark that we've set the month for this client
                        monthSetForClient.current = selectedClient.id;
                    }
                } catch (error) {
                    console.error('Failed to fetch client last month:', error);
                    // Fallback to next month
                    const nextMonth = new Date();
                    nextMonth.setMonth(nextMonth.getMonth() + 1);
                    const nextAvailableMonth = nextMonth.toISOString().slice(0, 7);
                    setMinTargetMonth(nextAvailableMonth);
                    setTargetMonth(nextAvailableMonth);

                    // Clear last month data
                    setLastMonthData([]);

                    // Mark that we've set the month for this client
                    monthSetForClient.current = selectedClient.id;
                }
            } else {
                // No client selected, reset everything
                setClientLastMonth(null);
                setMinTargetMonth('');
                setLastMonthData([]);
                monthSetForClient.current = null;

                // Set to default next month when no client
                const nextMonth = new Date();
                nextMonth.setMonth(nextMonth.getMonth() + 1);
                const nextAvailableMonth = nextMonth.toISOString().slice(0, 7);
                setTargetMonth(nextAvailableMonth);
            }
        };

        fetchClientLastMonth();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedClient]); // targetMonth intentionally excluded; other deps intentionally omitted to avoid loops

    // Handle target month change with validation
    const handleTargetMonthChange = (newMonth) => {
        // Only allow months that are >= minTargetMonth
        if (minTargetMonth && newMonth < minTargetMonth) {
            // Don't update if the selected month is before the minimum
            return;
        }
        setTargetMonth(newMonth);
        // Reset the ref so the month can be updated again if client changes
        monthSetForClient.current = null;
    };

    const handleGenerate = async () => {
        if (!selectedClient || !targetMonth) {
            alert('Please fill in all required fields');
            return;
        }

        // Calculate target total from column targets
        const targetTotal = (parseFloat(columnTargets.b0_30 || 0) +
            parseFloat(columnTargets.b31_60 || 0) +
            parseFloat(columnTargets.b61_90 || 0) +
            parseFloat(columnTargets.b90_plus || 0));

        if (targetTotal <= 0) {
            alert('Please enter values for at least one column target');
            return;
        }

        setIsGenerating(true);
        setGenerationStartTime(Date.now());
        try {
            // Prepare additional entries: only include rows with values
            const validEntries = (clientEntries || [])
                .filter(e => (e.description && e.description.trim() !== '') || (e.amount && String(e.amount).trim() !== ''))
                .map(e => ({
                    description: (e.description || '').trim(),
                    amount: parseFloat(e.amount) || 0
                }))
                .filter(e => e.description !== '' && e.amount > 0);

            // Prepare request payload
            const requestPayload = {
                client_id: selectedClient.id,
                target_month: targetMonth,
                target_total: parseFloat(targetTotal),
                carry_threshold: carryThreshold,
                additional_entries: validEntries
            };

            // Add column targets (always enabled now)
            requestPayload.column_targets = {
                b0_30: parseFloat(columnTargets.b0_30 || 0),
                b31_60: parseFloat(columnTargets.b31_60 || 0),
                b61_90: parseFloat(columnTargets.b61_90 || 0),
                b90_plus: parseFloat(columnTargets.b90_plus || 0)
            };

            const response = await generatePrediction(API_CONFIG.ENDPOINTS.PREDICT, requestPayload);

            if (response) {
                console.log('DEBUG: Backend response received:', JSON.stringify(response, null, 2));
                console.log('DEBUG: Predictions count:', response.predictions?.length);
                if (response.predictions && response.predictions.length > 0) {
                    console.log('DEBUG: Sample prediction from backend:', JSON.stringify(response.predictions[0], null, 2));
                    // Calculate totals from backend data
                    const backendTotals = {
                        '0_30': response.predictions.reduce((sum, p) => sum + (p['0_30'] || 0), 0),
                        '31_60': response.predictions.reduce((sum, p) => sum + (p['31_60'] || 0), 0),
                        '61_90': response.predictions.reduce((sum, p) => sum + (p['61_90'] || 0), 0),
                        '90_plus': response.predictions.reduce((sum, p) => sum + (p['90_plus'] || 0), 0),
                        'total': response.predictions.reduce((sum, p) => sum + (p['total'] || 0), 0)
                    };
                    console.log('DEBUG: Backend totals:', JSON.stringify(backendTotals, null, 2));
                }
                setPredictions(response.predictions || []);
                setModelInfo(response.model_meta);
            }
        } catch (error) {
            console.error('Generation failed:', error);
            alert('Failed to generate results. Please try again.');
        } finally {
            setIsGenerating(false);
            setGenerationStartTime(null);
        }
    };

    const handlePredictionsChange = (newPredictions) => {
        setPredictions(newPredictions);
    };

    const handleTargetMismatch = useCallback((isMismatched, grand, target) => {
        // Guard against redundant state updates that can cause loops
        setTargetMismatch(prev => {
            if (
                prev.show === isMismatched &&
                Math.abs(prev.grandTotal - grand) < 0.01 &&
                Math.abs(prev.targetTotal - target) < 0.01
            ) {
                return prev;
            }
            return { show: isMismatched, grandTotal: grand, targetTotal: target };
        });
    }, []);

    // Column targets handlers
    const handleColumnTargetsChange = (field, value) => {
        setColumnTargets(prev => ({
            ...prev,
            [field]: value
        }));
    };


    const handleApprove = () => {
        if (predictions.length === 0) {
            alert('Nothing to approve');
            return;
        }
        setShowApproveModal(true);
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const grandTotal = predictions.reduce((sum, pred) => sum + (pred.total || 0), 0);
    const calculatedTargetTotal = (parseFloat(columnTargets.b0_30 || 0) +
        parseFloat(columnTargets.b31_60 || 0) +
        parseFloat(columnTargets.b61_90 || 0) +
        parseFloat(columnTargets.b90_plus || 0));
    const isTargetMatched = Math.abs(grandTotal - calculatedTargetTotal) < 0.01;

    return (
        <div className="space-y-4">
            {/* Page Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">AR Aging</h1>
                        <p className="text-gray-600 mt-1">Generate accurate financial forecasts using machine learning</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <div className="text-right">
                            <div className="text-sm text-gray-500">Grand Total</div>
                            <div className={`text-2xl font-bold ${isTargetMatched ? 'text-success-600' : 'text-danger-600'}`}>
                                {formatCurrency(grandTotal)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Target Mismatch Flash Message - Absolute Positioned at Top */}
            {targetMismatch.show && (
                <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-2xl mx-4">
                    <div className="bg-warning-50 border border-warning-200 rounded-lg p-4 shadow-lg animate-pulse">
                        <div className="flex items-center">
                            <svg className="h-5 w-5 text-warning-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            <div className="flex-1">
                                <h3 className="text-sm font-medium text-warning-800">Target Mismatch</h3>
                                <p className="text-sm text-warning-700 mt-1">
                                    The grand total ({formatCurrency(targetMismatch.grandTotal)}) does not match the target total ({formatCurrency(targetMismatch.targetTotal)}).
                                </p>
                            </div>
                            <button
                                onClick={() => setTargetMismatch({ show: false, grandTotal: 0, targetTotal: 0 })}
                                className="text-warning-400 hover:text-warning-600 ml-4"
                            >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Cards */}
            <StatsCards
                clientsCount={clientsData?.length || 0}
                predictionsCount={predictions.length}
                targetTotal={calculatedTargetTotal}
                grandTotal={grandTotal}
                isTargetMatched={isTargetMatched}
            />

            {/* Controls Section - Vertical Layout */}
            <div className="space-y-4 mb-6">
                {/* Client Selector */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Client Selection</h3>
                    <ClientSelector
                        clients={clientsData || []}
                        selectedClient={selectedClient}
                        onClientChange={setSelectedClient}
                        loading={clientsLoading}
                        error={clientsError}
                        onEntriesChange={setClientEntries}
                        lastMonthEntriesCount={lastMonthData?.length || 0}
                    />
                </div>

                {/* Settings */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <PredictionForm
                        targetMonth={targetMonth}
                        carryThreshold={carryThreshold}
                        onTargetMonthChange={handleTargetMonthChange}
                        onCarryThresholdChange={setCarryThreshold}
                        onGenerate={handleGenerate}
                        isGenerating={isGenerating || predictionLoading}
                        disabled={!selectedClient}
                        minTargetMonth={minTargetMonth}
                        clientLastMonth={clientLastMonth}
                        columnTargets={columnTargets}
                        onColumnTargetsChange={handleColumnTargetsChange}
                        lastMonthData={lastMonthData}
                        elapsedTime={elapsedTime}
                    />
                </div>
            </div>

            {/* Results Section - Full Width */}
            <div className="w-full">
                {predictions.length > 0 ? (
                    <div className="space-y-6">
                        {/* Download Button - Moved above table */}
                        <div className="flex justify-end">
                            <DownloadButton
                                predictions={predictions}
                                clientName={selectedClient?.name || 'Unknown'}
                                targetMonth={targetMonth}
                            />
                        </div>

                        <PredictionsTable
                            predictions={predictions}
                            lastMonthData={lastMonthData}
                            onPredictionsChange={handlePredictionsChange}
                            onTargetMismatch={handleTargetMismatch}
                            targetTotal={calculatedTargetTotal}
                        />

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setPredictions([])}
                                className="btn-secondary"
                            >
                                Clear Results
                            </button>
                            <button
                                onClick={handleApprove}
                                className="btn-success"
                            >
                                Approve & Save
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                        <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Yet</h3>
                        <p className="text-gray-600 mb-4">Select a client and generate to see results here.</p>
                        <div className="text-sm text-gray-500">
                            <p>• Choose a client from the dropdown</p>
                            <p>• Set target month and total amount</p>
                            <p>• Click "Generate"</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Approve Modal */}
            {showApproveModal && (
                <ApproveModal
                    predictions={predictions}
                    clientId={selectedClient?.id}
                    targetMonth={targetMonth}
                    modelVersion={modelInfo?.model_version}
                    onClose={() => setShowApproveModal(false)}
                    onSuccess={() => {
                        setShowApproveModal(false);
                        setPredictions([]);
                        alert('Approved and saved successfully!');
                        // If there's a pending view after approval, switch to it
                        if (pendingViewAfterApproval) {
                            if (onNavigation) {
                                onNavigation(pendingViewAfterApproval);
                            } else {
                                navigate(pendingViewAfterApproval);
                            }
                            setPendingViewAfterApproval(null);
                        }
                    }}
                />
            )}
        </div>
    );
});

Dashboard.displayName = 'Dashboard';

export default Dashboard;

import React, { useState, useEffect, useRef } from 'react';
import useApi from '../hooks/useApi';
import MonthComparisonChart from './MonthComparisonChart';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Popover component for showing previous month values
const ComparisonPopover = ({ children, previousValue, currentValue, bucket, isVisible, onMouseEnter, onMouseLeave, onPopoverMouseEnter, onPopoverMouseLeave, formatCurrency }) => {
    // Get the correct previous month bucket name based on aging logic
    const getPreviousBucketName = (currentBucket) => {
        switch (currentBucket) {
            case 'current':
                return 'Current';
            case '0_30':
                return '0-30 Days';
            case '31_60':
                return '0-30 Days (aged)'; // Previous month's 0-30 becomes current month's 31-60
            case '61_90':
                return '31-60 Days (aged)'; // Previous month's 31-60 becomes current month's 61-90
            case '90_plus':
                return '61-90+ Days (aged)'; // Previous month's 61-90 + 90+ becomes current month's 90+
            case 'total':
                return 'Total';
            default:
                return 'Unknown';
        }
    };

    return (
        <div
            className="relative inline-block"
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            style={{ zIndex: isVisible ? 10000 : 'auto' }}
        >
            {children}
            {isVisible && (
                <div
                    className="absolute z-[9999] w-72 p-4 mt-2 text-sm bg-white rounded-xl shadow-2xl border border-gray-200 transform transition-all duration-200 ease-out"
                    style={{
                        left: '50%',
                        top: '100%',
                        transform: 'translateX(-50%)',
                        maxWidth: '90vw',
                        // Ensure popover stays within viewport bounds
                        maxHeight: '60vh',
                        overflowY: 'auto'
                    }}
                    onMouseEnter={onPopoverMouseEnter}
                    onMouseLeave={onPopoverMouseLeave}
                >
                    {/* Header with gradient background */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 -m-1 mb-3">
                        <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <div className="font-semibold text-blue-700 text-sm">Previous Month Value</div>
                        </div>
                    </div>

                    {/* Main content */}
                    <div className="space-y-3">
                        {/* Previous value - prominent display */}
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-800 mb-1">
                                {formatCurrency(previousValue)}
                            </div>
                            <div className="text-xs font-medium text-gray-500 bg-gray-100 rounded-full px-3 py-1 inline-block">
                                {getPreviousBucketName(bucket)}
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-gray-200"></div>

                        {/* Current value for comparison */}
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500 font-medium">Current:</span>
                            <span className="text-sm font-semibold text-gray-700">
                                {formatCurrency(currentValue)}
                            </span>
                        </div>

                        {/* Change indicator */}
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500 font-medium">Change:</span>
                            <span className={`text-sm font-semibold ${currentValue > previousValue ? 'text-green-600' :
                                currentValue < previousValue ? 'text-red-600' : 'text-gray-600'
                                }`}>
                                {currentValue > previousValue ? '+' : ''}{formatCurrency(currentValue - previousValue)}
                            </span>
                        </div>
                    </div>

                    {/* Arrow pointing up */}
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                        <div className="w-4 h-4 bg-white border-l border-t border-gray-200 rotate-45"></div>
                    </div>
                </div>
            )}
        </div>
    );
};

const Clients = ({ onAccordionExpand }) => {
    const [selectedClient, setSelectedClient] = useState(null);
    const [expandedMonths, setExpandedMonths] = useState(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [sortOrder, setSortOrder] = useState('asc');
    const [chartYearFilter, setChartYearFilter] = useState('all');
    const [hoveredPoint, setHoveredPoint] = useState(null);
    const [clientHistory, setClientHistory] = useState(null);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState(null);
    const lastFetchedClientId = useRef(null);

    // State for popover visibility
    const [popoverVisible, setPopoverVisible] = useState(null); // {bucket: 'current', recordId: 'someId'}
    const [isMouseOverPopover, setIsMouseOverPopover] = useState(false);

    // State for chart visibility toggle per month
    const [showCharts, setShowCharts] = useState(new Set());

    const { data: clientsSummary, loading: summaryLoading, error: summaryError } = useApi('/api/clients/summary');

    // Fetch client history when a client is selected
    useEffect(() => {
        if (selectedClient && selectedClient.id !== lastFetchedClientId.current) {
            lastFetchedClientId.current = selectedClient.id;
            setHistoryLoading(true);
            setHistoryError(null);
            setChartYearFilter('all'); // Reset year filter for new client

            fetch(`${API_BASE_URL}/api/client/${selectedClient.id}/history`)
                .then(response => response.json())
                .then(data => {
                    setClientHistory(data);
                    setHistoryLoading(false);
                })
                .catch(error => {
                    setHistoryError(error.message);
                    setHistoryLoading(false);
                });
        } else if (!selectedClient) {
            // Clear history when no client is selected
            setClientHistory(null);
            setHistoryLoading(false);
            setHistoryError(null);
            lastFetchedClientId.current = null;
            setChartYearFilter('all');
        }
    }, [selectedClient]);

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    // Helper functions for popover
    const popoverTimeoutRef = useRef(null);

    const handlePopoverEnter = (bucket, recordId, previousValue, currentValue) => {
        // Clear any existing timeout
        if (popoverTimeoutRef.current) {
            clearTimeout(popoverTimeoutRef.current);
        }

        // Immediately clear any existing popover and reset state
        setPopoverVisible(null);
        setIsMouseOverPopover(false);

        // Add a small delay to prevent flickering
        popoverTimeoutRef.current = setTimeout(() => {
            setPopoverVisible({ bucket, recordId });
        }, 50);
    };

    const handlePopoverLeave = () => {
        // Clear any pending show timeout
        if (popoverTimeoutRef.current) {
            clearTimeout(popoverTimeoutRef.current);
        }

        // Only hide if mouse is not over the popover itself
        popoverTimeoutRef.current = setTimeout(() => {
            if (!isMouseOverPopover) {
                setPopoverVisible(null);
            }
        }, 100);
    };

    const handlePopoverMouseEnter = () => {
        setIsMouseOverPopover(true);
        // Clear any pending hide timeout
        if (popoverTimeoutRef.current) {
            clearTimeout(popoverTimeoutRef.current);
        }
    };

    const handlePopoverMouseLeave = () => {
        setIsMouseOverPopover(false);
        // Hide popover after a short delay
        popoverTimeoutRef.current = setTimeout(() => {
            setPopoverVisible(null);
        }, 100);
    };

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (popoverTimeoutRef.current) {
                clearTimeout(popoverTimeoutRef.current);
            }
        };
    }, []);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Download CSV function for monthly data
    const downloadMonthCSV = (monthData, clientName) => {
        if (!monthData || !monthData.records || monthData.records.length === 0) {
            alert('No data available for this month');
            return;
        }

        // Prepare CSV headers
        const headers = [
            'Description',
            'Current',
            '0-30 Days',
            '31-60 Days',
            '61-90 Days',
            '90+ Days',
            'Total'
        ];

        // Prepare CSV data
        const csvData = monthData.records.map(record => [
            record.description || '',
            record.aging?.current || 0,
            record.aging?.['0_30'] || 0,
            record.aging?.['31_60'] || 0,
            record.aging?.['61_90'] || 0,
            record.aging?.['90_plus'] || 0,
            record.total || 0
        ]);

        // Add totals row
        const totals = [
            'TOTALS',
            monthData.records.reduce((sum, r) => sum + (r.aging?.current || 0), 0),
            monthData.records.reduce((sum, r) => sum + (r.aging?.['0_30'] || 0), 0),
            monthData.records.reduce((sum, r) => sum + (r.aging?.['31_60'] || 0), 0),
            monthData.records.reduce((sum, r) => sum + (r.aging?.['61_90'] || 0), 0),
            monthData.records.reduce((sum, r) => sum + (r.aging?.['90_plus'] || 0), 0),
            monthData.records.reduce((sum, r) => sum + (r.total || 0), 0)
        ];

        // Combine headers, data, and totals
        const csvContent = [headers, ...csvData, totals]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');

        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${clientName}_${monthData.month}_AR_Aging.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const formatMonth = (monthString) => {
        if (!monthString) return 'N/A';
        const [year, month] = monthString.split('-');
        const date = new Date(year, month - 1);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long'
        });
    };

    // Calculate analytics from client history
    const calculateAnalytics = (history) => {
        if (!history || !history.history || history.history.length === 0) {
            return {
                totalGrowth: 0,
                avgMonthlyGrowth: 0,
                growthRate: 0,
                agingTrends: {},
                predictionAccuracy: 0,
                volatility: 0,
                peakMonth: null,
                lowMonth: null,
                monthlyStats: []
            };
        }

        const monthlyData = history.history;
        const monthlyStats = monthlyData.map(month => ({
            month: month.month,
            total: month.total_amount,
            historicalCount: month.historical_count,
            predictedCount: month.predicted_count,
            hasPredictions: month.has_predictions
        }));

        // Calculate growth metrics
        const totals = monthlyStats.map(m => m.total);
        const firstTotal = totals[0] || 0;
        const lastTotal = totals[totals.length - 1] || 0;
        const totalGrowth = lastTotal - firstTotal;
        const avgMonthlyGrowth = totals.length > 1 ? totalGrowth / (totals.length - 1) : 0;
        const growthRate = firstTotal > 0 ? (totalGrowth / firstTotal) * 100 : 0;

        // Calculate volatility (standard deviation of monthly changes)
        const monthlyChanges = [];
        for (let i = 1; i < totals.length; i++) {
            const change = totals[i] - totals[i - 1];
            monthlyChanges.push(change);
        }
        const avgChange = monthlyChanges.reduce((sum, change) => sum + change, 0) / monthlyChanges.length || 0;
        const variance = monthlyChanges.reduce((sum, change) => sum + Math.pow(change - avgChange, 2), 0) / monthlyChanges.length || 0;
        const volatility = Math.sqrt(variance);

        // Find peak and low months
        const peakIndex = totals.indexOf(Math.max(...totals));
        const lowIndex = totals.indexOf(Math.min(...totals));
        const peakMonth = peakIndex >= 0 ? monthlyStats[peakIndex].month : null;
        const lowMonth = lowIndex >= 0 ? monthlyStats[lowIndex].month : null;

        // Calculate aging trends
        const agingTrends = {
            current: { trend: 0, avg: 0, values: [] },
            '0_30': { trend: 0, avg: 0, values: [] },
            '31_60': { trend: 0, avg: 0, values: [] },
            '61_90': { trend: 0, avg: 0, values: [] },
            '90_plus': { trend: 0, avg: 0, values: [] }
        };

        // Calculate aging bucket trends
        monthlyData.forEach(month => {
            month.records.forEach(record => {
                const aging = record.aging;
                agingTrends.current.values.push(aging.current || 0);
                agingTrends['0_30'].values.push(aging['0_30'] || 0);
                agingTrends['31_60'].values.push(aging['31_60'] || 0);
                agingTrends['61_90'].values.push(aging['61_90'] || 0);
                agingTrends['90_plus'].values.push(aging['90_plus'] || 0);
            });
        });

        // Calculate averages and trends for each bucket
        Object.keys(agingTrends).forEach(bucket => {
            const values = agingTrends[bucket].values;
            if (values.length > 0) {
                agingTrends[bucket].avg = values.reduce((sum, val) => sum + val, 0) / values.length;

                // Calculate trend (simple linear regression slope)
                if (values.length > 1) {
                    const n = values.length;
                    const xSum = (n * (n - 1)) / 2;
                    const ySum = values.reduce((sum, val) => sum + val, 0);
                    const xySum = values.reduce((sum, val, index) => sum + (val * index), 0);
                    const xSquaredSum = (n * (n - 1) * (2 * n - 1)) / 6;

                    const slope = (n * xySum - xSum * ySum) / (n * xSquaredSum - xSum * xSum);
                    agingTrends[bucket].trend = slope;
                }
            }
        });

        // Calculate prediction accuracy (if we have both historical and predicted data)
        let predictionAccuracy = 0;
        const predictionMonths = monthlyData.filter(m => m.has_predictions);
        if (predictionMonths.length > 0) {
            // Simple accuracy calculation - in a real scenario, you'd compare predicted vs actual
            predictionAccuracy = (predictionMonths.length / monthlyData.length) * 100;
        }

        return {
            totalGrowth,
            avgMonthlyGrowth,
            growthRate,
            agingTrends,
            predictionAccuracy,
            volatility,
            peakMonth,
            lowMonth,
            monthlyStats,
            totalMonths: monthlyData.length,
            avgMonthlyTotal: totals.reduce((sum, total) => sum + total, 0) / totals.length || 0
        };
    };

    // Calculate month-over-month comparison for totals with aging logic
    const getMonthComparison = (currentMonth, historyData) => {
        if (!historyData || !historyData.history) return null;

        // Sort history by month
        const sortedHistory = [...historyData.history].sort((a, b) => new Date(a.month) - new Date(b.month));
        const currentIndex = sortedHistory.findIndex(month => month.month === currentMonth);

        if (currentIndex <= 0) return null; // No previous month to compare

        const previousMonth = sortedHistory[currentIndex - 1];
        const currentMonthData = sortedHistory[currentIndex];

        // Calculate totals for each aging bucket
        const calculateBucketTotals = (monthData) => {
            const totals = {
                current: 0,
                '0_30': 0,
                '31_60': 0,
                '61_90': 0,
                '90_plus': 0,
                total: 0
            };

            monthData.records.forEach(record => {
                totals.current += record.aging.current || 0;
                totals['0_30'] += record.aging['0_30'] || 0;
                totals['31_60'] += record.aging['31_60'] || 0;
                totals['61_90'] += record.aging['61_90'] || 0;
                totals['90_plus'] += record.aging['90_plus'] || 0;
                totals.total += record.total || 0;
            });

            return totals;
        };

        const currentTotals = calculateBucketTotals(currentMonthData);
        const previousTotals = calculateBucketTotals(previousMonth);

        // Calculate differences with aging progression logic
        const differences = {};

        // Current bucket: Compare current month current vs previous month current
        const currentDiff = currentTotals.current - previousTotals.current;
        const currentPercent = previousTotals.current !== 0 ? (currentDiff / previousTotals.current) * 100 : 0;
        differences.current = { absolute: currentDiff, percentage: currentPercent };

        // 0-30 bucket: Compare current month 0-30 vs previous month 0-30
        const diff0_30 = currentTotals['0_30'] - previousTotals['0_30'];
        const percent0_30 = previousTotals['0_30'] !== 0 ? (diff0_30 / previousTotals['0_30']) * 100 : 0;
        differences['0_30'] = { absolute: diff0_30, percentage: percent0_30 };

        // 31-60 bucket: Compare current month 31-60 vs previous month 0-30 (aged receivables)
        const diff31_60 = currentTotals['31_60'] - previousTotals['0_30'];
        const percent31_60 = previousTotals['0_30'] !== 0 ? (diff31_60 / previousTotals['0_30']) * 100 : 0;
        differences['31_60'] = { absolute: diff31_60, percentage: percent31_60 };

        // 61-90 bucket: Compare current month 61-90 vs previous month 31-60 (aged receivables)
        const diff61_90 = currentTotals['61_90'] - previousTotals['31_60'];
        const percent61_90 = previousTotals['31_60'] !== 0 ? (diff61_90 / previousTotals['31_60']) * 100 : 0;
        differences['61_90'] = { absolute: diff61_90, percentage: percent61_90 };

        // 90+ bucket: Compare current month 90+ vs previous month 61-90 + 90+ (aged receivables)
        const previousTotalFor90_plus = previousTotals['61_90'] + previousTotals['90_plus'];
        const diff90_plus = currentTotals['90_plus'] - previousTotalFor90_plus;
        const percent90_plus = previousTotalFor90_plus !== 0 ? (diff90_plus / previousTotalFor90_plus) * 100 : 0;
        differences['90_plus'] = { absolute: diff90_plus, percentage: percent90_plus };

        // Total: Compare current month total vs previous month total
        const diffTotal = currentTotals.total - previousTotals.total;
        const percentTotal = previousTotals.total !== 0 ? (diffTotal / previousTotals.total) * 100 : 0;
        differences.total = {
            absolute: diffTotal,
            percentage: percentTotal,
            previousValue: previousTotals.total,
            currentValue: currentTotals.total
        };

        return differences;
    };

    // Calculate month-over-month comparison for individual records with aging logic
    const getRecordComparison = (currentRecord, currentMonth, historyData) => {
        if (!historyData || !historyData.history) return null;

        // Sort history by month
        const sortedHistory = [...historyData.history].sort((a, b) => new Date(a.month) - new Date(b.month));
        const currentIndex = sortedHistory.findIndex(month => month.month === currentMonth);

        if (currentIndex <= 0) return null; // No previous month to compare

        const previousMonth = sortedHistory[currentIndex - 1];

        // Find the same record in the previous month by description
        // First try exact match
        let previousRecord = previousMonth.records.find(record =>
            record.description === currentRecord.description
        );

        // If no exact match, try normalized matching (remove extra spaces, standardize punctuation)
        if (!previousRecord) {
            const normalizeString = (str) => {
                return str.toLowerCase()
                    .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
                    .replace(/\./g, '')     // Remove periods
                    .replace(/,/g, '')      // Remove commas
                    .trim();
            };

            const normalizedCurrent = normalizeString(currentRecord.description);
            previousRecord = previousMonth.records.find(record =>
                normalizeString(record.description) === normalizedCurrent
            );
        }

        // Debug specific records that are known to have issues
        if (!previousRecord) {
            const normalizeString = (str) => {
                return str.toLowerCase()
                    .replace(/\s+/g, ' ')
                    .replace(/\./g, '')
                    .replace(/,/g, '')
                    .replace(/sloutions/g, 'solutions') // Handle "sloutions" typo specifically
                    .replace(/solutions?/g, 'solutions') // Handle "solutions" vs "solution"
                    .replace(/transportation/g, 'transport') // Handle "transportation" vs "transport"
                    .replace(/logistics/g, 'logistics') // Ensure consistent spelling
                    .trim();
            };

            const normalizedCurrent = normalizeString(currentRecord.description);
            const normalizedPrevious = previousMonth.records.map(r => ({
                original: r.description,
                normalized: normalizeString(r.description)
            }));

            // Find the match using the normalizedPrevious array
            const normalizedMatch = normalizedPrevious.find(record =>
                record.normalized === normalizedCurrent
            );

            if (normalizedMatch) {
                // Find the actual record from previousMonth.records using the original description
                previousRecord = previousMonth.records.find(record =>
                    record.description === normalizedMatch.original
                );
            }
        }

        if (!previousRecord) return null; // No matching record in previous month


        // Calculate differences for each aging bucket with aging progression logic
        const differences = {};

        // Current bucket: Compare current month current vs previous month current
        const currentCurrent = currentRecord.aging.current || 0;
        const previousCurrent = previousRecord.aging.current || 0;
        const currentDiff = currentCurrent - previousCurrent;
        const currentPercent = previousCurrent !== 0 ? (currentDiff / previousCurrent) * 100 : 0;

        differences.current = {
            absolute: currentDiff,
            percentage: currentPercent,
            previousValue: previousCurrent
        };

        // 0-30 bucket: Compare current month 0-30 vs previous month 0-30
        const current0_30 = currentRecord.aging['0_30'] || 0;
        const previous0_30 = previousRecord.aging['0_30'] || 0;
        const diff0_30 = current0_30 - previous0_30;
        const percent0_30 = previous0_30 !== 0 ? (diff0_30 / previous0_30) * 100 : 0;

        differences['0_30'] = {
            absolute: diff0_30,
            percentage: percent0_30,
            previousValue: previous0_30
        };

        // 31-60 bucket: Compare current month 31-60 vs previous month 0-30 (aged receivables)
        const current31_60 = currentRecord.aging['31_60'] || 0;
        const previous0_30For31_60 = previousRecord.aging['0_30'] || 0;
        const diff31_60 = current31_60 - previous0_30For31_60;
        const percent31_60 = previous0_30For31_60 !== 0 ? (diff31_60 / previous0_30For31_60) * 100 : 0;

        differences['31_60'] = {
            absolute: diff31_60,
            percentage: percent31_60,
            previousValue: previous0_30For31_60
        };

        // 61-90 bucket: Compare current month 61-90 vs previous month 31-60 (aged receivables)
        const current61_90 = currentRecord.aging['61_90'] || 0;
        const previous31_60For61_90 = previousRecord.aging['31_60'] || 0;
        const diff61_90 = current61_90 - previous31_60For61_90;
        const percent61_90 = previous31_60For61_90 !== 0 ? (diff61_90 / previous31_60For61_90) * 100 : 0;

        differences['61_90'] = {
            absolute: diff61_90,
            percentage: percent61_90,
            previousValue: previous31_60For61_90
        };

        // 90+ bucket: Compare current month 90+ vs previous month 61-90 + 90+ (aged receivables)
        const current90_plus = currentRecord.aging['90_plus'] || 0;
        const previous61_90For90_plus = previousRecord.aging['61_90'] || 0;
        const previous90_plusFor90_plus = previousRecord.aging['90_plus'] || 0;
        const previousTotalFor90_plus = previous61_90For90_plus + previous90_plusFor90_plus;
        const diff90_plus = current90_plus - previousTotalFor90_plus;
        const percent90_plus = previousTotalFor90_plus !== 0 ? (diff90_plus / previousTotalFor90_plus) * 100 : 0;

        differences['90_plus'] = {
            absolute: diff90_plus,
            percentage: percent90_plus,
            previousValue: previousTotalFor90_plus
        };

        // Total: Compare current month total vs previous month total
        const currentTotal = currentRecord.total || 0;
        const previousTotal = previousRecord.total || 0;
        const diffTotal = currentTotal - previousTotal;
        const percentTotal = previousTotal !== 0 ? (diffTotal / previousTotal) * 100 : 0;

        differences.total = {
            absolute: diffTotal,
            percentage: percentTotal,
            previousValue: previousTotal
        };


        return differences;
    };

    // Generate simple chart data for visualization
    const generateChartData = (monthlyStats, historyData, yearFilter = 'all') => {
        let filteredStats = monthlyStats;

        // Filter by year if not 'all'
        if (yearFilter !== 'all') {
            filteredStats = monthlyStats.filter(stat => {
                const year = stat.month.split('-')[0];
                return year === yearFilter;
            });
        }

        return filteredStats.map(stat => {
            // Find the corresponding month data to check if it has predictions
            const monthData = historyData?.find(m => m.month === stat.month);
            const [year, month] = stat.month.split('-');
            const date = new Date(year, month - 1);

            return {
                month: stat.month,
                monthName: date.toLocaleDateString('en-US', { month: 'short' }),
                year: year,
                total: stat.total,
                isPrediction: monthData?.has_predictions || false
            };
        });
    };

    // Get available years from data
    const getAvailableYears = (monthlyStats) => {
        const years = [...new Set(monthlyStats.map(stat => stat.month.split('-')[0]))];
        return years.sort((a, b) => b - a); // Most recent first
    };

    // Simple line chart component
    const SimpleLineChart = ({ data, title, height = 200, showLabels = true }) => {
        if (!data || data.length === 0) return null;

        const maxValue = Math.max(...data.map(d => d.total));
        const minValue = Math.min(...data.map(d => d.total));
        const range = maxValue - minValue || 1;
        const padding = 20;
        const chartWidth = 500; // Increased width to accommodate date labels
        const chartHeight = height - padding * 2 - 30; // Extra space for X-axis labels

        const points = data.map((d, index) => {
            const x = padding + (index / (data.length - 1)) * (chartWidth - padding * 2);
            const y = padding + ((maxValue - d.total) / range) * chartHeight;
            return { x, y, ...d };
        });

        const pathData = points.map((point, index) =>
            `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
        ).join(' ');

        return (
            <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-3">{title}</h4>
                <div className="relative" style={{ height }}>
                    <svg width="100%" height={height} viewBox={`0 0 ${chartWidth} ${height}`}>
                        {/* Grid lines */}
                        {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
                            <line
                                key={ratio}
                                x1={padding}
                                y1={padding + ratio * chartHeight}
                                x2={chartWidth - padding}
                                y2={padding + ratio * chartHeight}
                                stroke="#f3f4f6"
                                strokeWidth="1"
                            />
                        ))}

                        {/* Chart line */}
                        <path
                            d={pathData}
                            fill="none"
                            stroke="#10b981"
                            strokeWidth="2"
                        />

                        {/* Data points */}
                        {points.map((point, index) => (
                            <circle
                                key={index}
                                cx={point.x}
                                cy={point.y}
                                r="4"
                                fill={point.isPrediction ? "#f59e0b" : "#10b981"}
                                stroke="white"
                                strokeWidth="2"
                                style={{ cursor: 'pointer' }}
                                onMouseEnter={() => setHoveredPoint(point)}
                                onMouseLeave={() => setHoveredPoint(null)}
                            />
                        ))}

                        {/* Small tick marks for data points without labels - only when labels are shown */}
                        {showLabels && points.map((point, index) => {
                            const totalPoints = points.length;
                            let showLabel = false;

                            if (totalPoints <= 12) {
                                showLabel = true;
                            } else if (totalPoints <= 24) {
                                showLabel = index % 2 === 0;
                            } else if (totalPoints <= 36) {
                                showLabel = index % 3 === 0;
                            } else {
                                showLabel = index % 4 === 0;
                            }

                            if (index === 0 || index === totalPoints - 1) {
                                showLabel = true;
                            }

                            // Show small tick mark for points without labels
                            if (!showLabel) {
                                return (
                                    <line
                                        key={`tick-${index}`}
                                        x1={point.x}
                                        y1={padding + chartHeight + 5}
                                        x2={point.x}
                                        y2={padding + chartHeight + 10}
                                        stroke="#d1d5db"
                                        strokeWidth="1"
                                    />
                                );
                            }
                            return null;
                        })}

                        {/* Y-axis labels */}
                        {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
                            const value = maxValue - (ratio * range);
                            return (
                                <text
                                    key={ratio}
                                    x={padding - 5}
                                    y={padding + ratio * chartHeight + 4}
                                    textAnchor="end"
                                    className="text-xs fill-gray-500"
                                >
                                    {formatCurrency(value)}
                                </text>
                            );
                        })}

                        {/* X-axis labels (dates) - Only show when showLabels is true */}
                        {showLabels && points.map((point, index) => {
                            // Show labels based on data density
                            const totalPoints = points.length;
                            let showLabel = false;

                            if (totalPoints <= 12) {
                                // Show all labels if 12 months or less
                                showLabel = true;
                            } else if (totalPoints <= 24) {
                                // Show every other month if 12-24 months
                                showLabel = index % 2 === 0;
                            } else if (totalPoints <= 36) {
                                // Show every 3rd month if 24-36 months
                                showLabel = index % 3 === 0;
                            } else {
                                // Show every 4th month if more than 36 months
                                showLabel = index % 4 === 0;
                            }

                            // Always show first and last labels
                            if (index === 0 || index === totalPoints - 1) {
                                showLabel = true;
                            }

                            if (!showLabel) return null;

                            return (
                                <text
                                    key={index}
                                    x={point.x}
                                    y={padding + chartHeight + 20}
                                    textAnchor="middle"
                                    className="text-xs fill-gray-500"
                                    transform={`rotate(-45, ${point.x}, ${padding + chartHeight + 20})`}
                                >
                                    {point.monthName} {point.year}
                                </text>
                            );
                        })}
                    </svg>

                    {/* Hover Tooltip */}
                    {hoveredPoint && (
                        <div
                            className="absolute bg-gray-900 text-white text-xs rounded-lg px-2 py-1 shadow-lg z-10 pointer-events-none"
                            style={{
                                left: `${hoveredPoint.x + padding + 50}px`, // Adjusted for container
                                top: `${hoveredPoint.y + padding - 25}px`,
                                transform: 'translateX(-50%)'
                            }}
                        >
                            <div className="font-medium">{hoveredPoint.monthName} {hoveredPoint.year}</div>
                            <div className="text-gray-300">
                                {formatCurrency(hoveredPoint.total)}
                            </div>
                            <div className="text-gray-400">
                                {hoveredPoint.isPrediction ? 'Generated' : 'Historical'}
                            </div>
                            {/* Tooltip arrow pointing down to the dot */}
                            <div
                                className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-3 border-r-3 border-t-3 border-transparent border-t-gray-900"
                            ></div>
                        </div>
                    )}

                    {/* Legend and Info */}
                    <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1">
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                <span className="text-xs text-gray-600">Historical</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                                <span className="text-xs text-gray-600">Generated</span>
                            </div>
                        </div>
                        {!showLabels && (
                            <div className="text-xs text-gray-500">
                                Hover over dots for details
                            </div>
                        )}
                        {showLabels && data.length > 12 && (
                            <div className="text-xs text-gray-500">
                                Showing key months only - use year filter for detailed view
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const toggleMonthExpansion = (month) => {
        const newExpanded = new Set(expandedMonths);
        if (newExpanded.has(month)) {
            newExpanded.delete(month);
        } else {
            newExpanded.add(month);
            // Call the callback to close sidebar on mobile when accordion expands
            if (onAccordionExpand) {
                onAccordionExpand();
            }
        }
        setExpandedMonths(newExpanded);
    };

    const toggleMonthChart = (month, event) => {
        event.stopPropagation(); // Prevent accordion toggle
        const newShowCharts = new Set(showCharts);
        if (newShowCharts.has(month)) {
            newShowCharts.delete(month);
        } else {
            newShowCharts.add(month);
        }
        setShowCharts(newShowCharts);
    };

    const filteredClients = clientsSummary?.clients?.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    const sortedClients = [...filteredClients].sort((a, b) => {
        let aValue = a[sortBy];
        let bValue = b[sortBy];

        if (sortBy === 'created_at' || sortBy === 'last_prediction_date') {
            aValue = new Date(aValue || 0);
            bValue = new Date(bValue || 0);
        }

        if (sortOrder === 'asc') {
            return aValue > bValue ? 1 : -1;
        } else {
            return aValue < bValue ? 1 : -1;
        }
    });


    const getSortIcon = (field) => {
        if (sortBy !== field) return '↕️';
        return sortOrder === 'asc' ? '↑' : '↓';
    };

    if (summaryLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (summaryError) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Error loading clients</h3>
                        <div className="mt-2 text-sm text-red-700">
                            <p>{summaryError}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6 overflow-hidden">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Clients & History</h1>
                        <p className="text-gray-600 mt-1 text-sm sm:text-base">View all clients and their complete data history</p>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold text-primary-600">
                            {clientsSummary?.total_clients || 0}
                        </div>
                        <div className="text-sm text-gray-500">Total Clients</div>
                    </div>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-500">Total Records</p>
                            <p className="text-2xl font-semibold text-gray-900">{clientsSummary?.total_records || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-500">Historical Data</p>
                            <p className="text-2xl font-semibold text-gray-900">{clientsSummary?.total_historical || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-500">Generated</p>
                            <p className="text-2xl font-semibold text-gray-900">{clientsSummary?.total_predictions || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                            </div>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-500">With Models</p>
                            <p className="text-2xl font-semibold text-gray-900">
                                {clientsSummary?.clients?.filter(c => c.has_model).length || 0}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search and Filter */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Search clients..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <select
                            value={sortBy}
                            onChange={(e) => {
                                setSortBy(e.target.value);
                                setSortOrder('asc');
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        >
                            <option value="name">Name</option>
                            <option value="created_at">Created Date</option>
                            <option value="last_prediction">Last Generated</option>
                            <option value="total_records">Total Records</option>
                        </select>
                        <button
                            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 sm:text-sm hover:bg-gray-50"
                            title={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
                        >
                            {getSortIcon(sortBy)}
                        </button>
                    </div>
                </div>
            </div>

            {/* Clients List */}
            <div className="space-y-4">
                {sortedClients.map((client) => (
                    <div
                        key={client.id}
                        className={`bg-white rounded-xl shadow-sm border transition-all duration-200 ${selectedClient?.id === client.id
                            ? 'border-primary-300 ring-2 ring-primary-100'
                            : 'border-gray-200 hover:border-gray-300'
                            }`}
                    >
                        {/* Client Header */}
                        <div
                            className="p-4 sm:p-6 cursor-pointer transition-colors duration-200"
                            onClick={() => setSelectedClient(selectedClient?.id === client.id ? null : client)}
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
                                <div className="flex items-start sm:items-center space-x-3 sm:space-x-4">
                                    <div className="flex-shrink-0">
                                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center ${client.has_model ? 'bg-green-100' : 'bg-gray-100'
                                            }`}>
                                            <span className={`text-sm sm:text-lg font-semibold ${client.has_model ? 'text-green-600' : 'text-gray-600'
                                                }`}>
                                                {client.name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{client.name}</h3>
                                        <div className="flex flex-col space-y-1 text-xs sm:text-sm text-gray-500">
                                            <span>Created: {formatDate(client.created_at)}</span>
                                            <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                                                <span>{client.total_records} records</span>
                                                <span className="hidden sm:inline">•</span>
                                                <span>{client.historical_records} historical</span>
                                                <span className="hidden sm:inline">•</span>
                                                <span>{client.predicted_records} generated</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                                    <div className="text-left sm:text-right">
                                        <div className="text-xs sm:text-sm text-gray-500">Data Range</div>
                                        <div className="text-xs sm:text-sm font-medium text-gray-900">
                                            {client.first_month ? formatMonth(client.first_month) : 'N/A'} - {client.last_month ? formatMonth(client.last_month) : 'N/A'}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between sm:justify-end space-x-2">
                                        {client.has_model && (
                                            <span className="inline-flex items-center px-2 py-0.5 sm:px-2.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                Model v{client.model_version}
                                            </span>
                                        )}
                                        <svg
                                            className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-400 transition-transform duration-200 ${selectedClient?.id === client.id ? 'rotate-180' : ''
                                                }`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Client History */}
                        {selectedClient?.id === client.id && (
                            <div className="border-t border-gray-200 bg-gray-50 overflow-hidden">
                                {historyLoading ? (
                                    <div className="p-6 text-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                                        <p className="mt-2 text-sm text-gray-500">Loading history...</p>
                                    </div>
                                ) : historyError ? (
                                    <div className="p-6 text-center text-red-600">
                                        <p>Error loading history: {historyError}</p>
                                    </div>
                                ) : clientHistory?.history?.length > 0 ? (
                                    <div className="p-6">
                                        {(() => {
                                            const analytics = calculateAnalytics(clientHistory);
                                            const availableYears = getAvailableYears(analytics.monthlyStats);
                                            const chartData = generateChartData(analytics.monthlyStats, clientHistory.history, chartYearFilter);

                                            return (
                                                <>
                                                    {/* Analytics Overview */}
                                                    <div className="mb-6">
                                                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Analytics Overview</h4>

                                                        {/* Key Metrics Grid */}
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                                            <div className="bg-blue-50 rounded-lg p-4">
                                                                <div className="text-2xl font-bold text-blue-600">
                                                                    {analytics.growthRate > 0 ? '+' : ''}{analytics.growthRate.toFixed(1)}%
                                                                </div>
                                                                <div className="text-sm text-blue-800">Growth Rate</div>
                                                                <div className="text-xs text-blue-600">
                                                                    {formatCurrency(analytics.totalGrowth)} total
                                                                </div>
                                                            </div>

                                                            <div className="bg-green-50 rounded-lg p-4">
                                                                <div className="text-2xl font-bold text-green-600">
                                                                    {formatCurrency(analytics.avgMonthlyTotal)}
                                                                </div>
                                                                <div className="text-sm text-green-800">Avg Monthly Total</div>
                                                                <div className="text-xs text-green-600">
                                                                    {analytics.totalMonths} months
                                                                </div>
                                                            </div>

                                                            <div className="bg-purple-50 rounded-lg p-4">
                                                                <div className="text-2xl font-bold text-purple-600">
                                                                    {analytics.predictionAccuracy.toFixed(1)}%
                                                                </div>
                                                                <div className="text-sm text-purple-800">Generated Coverage</div>
                                                                <div className="text-xs text-purple-600">
                                                                    {clientHistory.summary.predicted_records} generated
                                                                </div>
                                                            </div>

                                                            <div className="bg-orange-50 rounded-lg p-4">
                                                                <div className="text-2xl font-bold text-orange-600">
                                                                    {formatCurrency(analytics.volatility)}
                                                                </div>
                                                                <div className="text-sm text-orange-800">Volatility</div>
                                                                <div className="text-xs text-orange-600">
                                                                    Monthly variation
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Growth Chart */}
                                                        <div className="mb-6">
                                                            <div className="flex items-center justify-between mb-4">
                                                                <h5 className="text-lg font-medium text-gray-900">Monthly Total Trend</h5>
                                                                <div className="flex items-center space-x-2">
                                                                    <label className="text-sm text-gray-600">Filter by year:</label>
                                                                    <select
                                                                        value={chartYearFilter}
                                                                        onChange={(e) => setChartYearFilter(e.target.value)}
                                                                        className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
                                                                    >
                                                                        <option value="all">All Years</option>
                                                                        {availableYears.map(year => (
                                                                            <option key={year} value={year}>{year}</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                            </div>
                                                            <SimpleLineChart
                                                                data={chartData}
                                                                title=""
                                                                height={280}
                                                                showLabels={chartYearFilter !== 'all'}
                                                            />
                                                        </div>

                                                        {/* Peak & Low Analysis */}
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                                            <div className="bg-white rounded-lg border border-gray-200 p-4">
                                                                <h5 className="font-medium text-gray-900 mb-2">Peak Performance</h5>
                                                                <div className="text-sm text-gray-600">
                                                                    <div>Month: {analytics.peakMonth ? formatMonth(analytics.peakMonth) : 'N/A'}</div>
                                                                    <div>Amount: {formatCurrency(Math.max(...analytics.monthlyStats.map(m => m.total)))}</div>
                                                                </div>
                                                            </div>

                                                            <div className="bg-white rounded-lg border border-gray-200 p-4">
                                                                <h5 className="font-medium text-gray-900 mb-2">Lowest Performance</h5>
                                                                <div className="text-sm text-gray-600">
                                                                    <div>Month: {analytics.lowMonth ? formatMonth(analytics.lowMonth) : 'N/A'}</div>
                                                                    <div>Amount: {formatCurrency(Math.min(...analytics.monthlyStats.map(m => m.total)))}</div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Aging Bucket Analysis */}
                                                        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                                                            <div className="mb-4">
                                                                <h5 className="font-medium text-gray-900 mb-2">Aging Bucket Analysis</h5>
                                                                <p className="text-sm text-gray-600">
                                                                    Track how receivables are distributed across different age categories and their trends over time.
                                                                </p>
                                                            </div>

                                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                                                {Object.entries(analytics.agingTrends)
                                                                    .filter(([bucket]) => bucket !== 'current')
                                                                    .map(([bucket, data]) => {
                                                                        const bucketInfo = {
                                                                            '0_30': { name: '0-30 Days', description: 'Recently due', color: 'blue', icon: '⏰' },
                                                                            '31_60': { name: '31-60 Days', description: 'Moderately overdue', color: 'yellow', icon: '⚠️' },
                                                                            '61_90': { name: '61-90 Days', description: 'Significantly overdue', color: 'orange', icon: '🚨' },
                                                                            '90_plus': { name: '90+ Days', description: 'Seriously overdue', color: 'red', icon: '🔴' }
                                                                        };

                                                                        const info = bucketInfo[bucket];
                                                                        const trendDirection = data.trend > 0 ? 'increasing' : data.trend < 0 ? 'decreasing' : 'stable';
                                                                        const trendColor = data.trend > 0 ? 'red' : data.trend < 0 ? 'green' : 'gray';

                                                                        return (
                                                                            <div key={bucket} className="text-center p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                                                                                <div className="text-2xl mb-2">{info.icon}</div>
                                                                                <div className="text-sm font-medium text-gray-700 mb-1">
                                                                                    {info.name}
                                                                                </div>
                                                                                <div className="text-xs text-gray-500 mb-2">
                                                                                    {info.description}
                                                                                </div>
                                                                                <div className="text-lg font-bold text-gray-900 mb-1">
                                                                                    {formatCurrency(data.avg)}
                                                                                </div>
                                                                                <div className={`text-xs font-medium ${trendColor === 'red' ? 'text-red-600' :
                                                                                    trendColor === 'green' ? 'text-green-600' :
                                                                                        'text-gray-500'
                                                                                    }`}>
                                                                                    {data.trend > 0 ? '↗' : data.trend < 0 ? '↘' : '→'}
                                                                                    {trendDirection.charAt(0).toUpperCase() + trendDirection.slice(1)}
                                                                                </div>
                                                                                <div className="text-xs text-gray-400 mt-1">
                                                                                    {data.values.length} records
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                            </div>

                                                            {/* Summary Insights */}
                                                            <div className="bg-gray-50 rounded-lg p-4">
                                                                <h6 className="font-medium text-gray-900 mb-3">Key Insights</h6>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                                    <div>
                                                                        <span className="text-gray-600">Highest Average:</span>
                                                                        <span className="ml-2 font-medium">
                                                                            {Object.entries(analytics.agingTrends)
                                                                                .filter(([bucket]) => bucket !== 'current')
                                                                                .sort(([, a], [, b]) => b.avg - a.avg)[0][0] === '0_30' ? '0-30 Days' :
                                                                                Object.entries(analytics.agingTrends)
                                                                                    .filter(([bucket]) => bucket !== 'current')
                                                                                    .sort(([, a], [, b]) => b.avg - a.avg)[0][0] === '31_60' ? '31-60 Days' :
                                                                                    Object.entries(analytics.agingTrends)
                                                                                        .filter(([bucket]) => bucket !== 'current')
                                                                                        .sort(([, a], [, b]) => b.avg - a.avg)[0][0] === '61_90' ? '61-90 Days' : '90+ Days'}
                                                                        </span>
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-gray-600">Most Volatile:</span>
                                                                        <span className="ml-2 font-medium">
                                                                            {Object.entries(analytics.agingTrends)
                                                                                .filter(([bucket]) => bucket !== 'current')
                                                                                .sort(([, a], [, b]) => Math.abs(b.trend) - Math.abs(a.trend))[0][0] === '0_30' ? '0-30 Days' :
                                                                                Object.entries(analytics.agingTrends)
                                                                                    .filter(([bucket]) => bucket !== 'current')
                                                                                    .sort(([, a], [, b]) => Math.abs(b.trend) - Math.abs(a.trend))[0][0] === '31_60' ? '31-60 Days' :
                                                                                    Object.entries(analytics.agingTrends)
                                                                                        .filter(([bucket]) => bucket !== 'current')
                                                                                        .sort(([, a], [, b]) => Math.abs(b.trend) - Math.abs(a.trend))[0][0] === '61_90' ? '61-90 Days' : '90+ Days'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Data Summary */}
                                                        <div className="bg-gray-50 rounded-lg p-4 mb-6">
                                                            <h5 className="font-medium text-gray-900 mb-3">Data Summary</h5>
                                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                                <div>
                                                                    <span className="text-gray-500">Total Months:</span>
                                                                    <span className="ml-1 font-medium">{clientHistory.summary.total_months}</span>
                                                                </div>
                                                                <div>
                                                                    <span className="text-gray-500">Total Records:</span>
                                                                    <span className="ml-1 font-medium">{clientHistory.summary.total_records}</span>
                                                                </div>
                                                                <div>
                                                                    <span className="text-gray-500">Historical:</span>
                                                                    <span className="ml-1 font-medium">{clientHistory.summary.historical_records}</span>
                                                                </div>
                                                                <div>
                                                                    <span className="text-gray-500">Generated:</span>
                                                                    <span className="ml-1 font-medium">{clientHistory.summary.predicted_records}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </>
                                            );
                                        })()}

                                        <div className="mb-4">
                                            <h4 className="text-lg font-semibold text-gray-900">Monthly History</h4>
                                        </div>

                                        <div className="space-y-3">
                                            {clientHistory.history.map((monthData) => (
                                                <div key={monthData.month} className="bg-white rounded-lg border border-gray-200">
                                                    <div
                                                        className="p-3 sm:p-4 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                                                        onClick={() => toggleMonthExpansion(monthData.month)}
                                                    >
                                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                                                            <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4">
                                                                <h5 className="font-medium text-gray-900">
                                                                    {formatMonth(monthData.month)}
                                                                </h5>
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <span className="text-sm text-gray-500">
                                                                        {monthData.records.length} records
                                                                    </span>
                                                                    {monthData.has_predictions && (
                                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                                            {monthData.predicted_count} generated
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                                                                <div className="text-left sm:text-right">
                                                                    <div className="text-sm font-medium text-green-600">
                                                                        {formatCurrency(monthData.total_amount)}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500">Total Amount</div>
                                                                </div>

                                                                <div className="flex items-center justify-between sm:justify-end space-x-2">
                                                                    {/* Download Button for this month */}
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            downloadMonthCSV(monthData, selectedClient.name);
                                                                        }}
                                                                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                                                                        title="Download CSV"
                                                                    >
                                                                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                        </svg>
                                                                    </button>

                                                                    {/* Chart Toggle for this month */}
                                                                    <div className="flex items-center space-x-1 sm:space-x-2" onClick={(e) => toggleMonthChart(monthData.month, e)}>
                                                                        <span className="text-xs text-gray-600 hidden sm:inline">Chart</span>
                                                                        <button
                                                                            className={`relative inline-flex h-4 w-7 sm:h-5 sm:w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${showCharts.has(monthData.month) ? 'bg-blue-600' : 'bg-gray-200'
                                                                                }`}
                                                                        >
                                                                            <span
                                                                                className={`inline-block h-2 w-2 sm:h-3 sm:w-3 transform rounded-full bg-white transition-transform ${showCharts.has(monthData.month) ? 'translate-x-3 sm:translate-x-5' : 'translate-x-0.5 sm:translate-x-1'
                                                                                    }`}
                                                                            />
                                                                        </button>
                                                                    </div>

                                                                    <svg
                                                                        className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-400 transition-transform duration-200 ${expandedMonths.has(monthData.month) ? 'rotate-180' : ''
                                                                            }`}
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        viewBox="0 0 24 24"
                                                                    >
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                                    </svg>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {expandedMonths.has(monthData.month) && (
                                                        <div className="border-t border-gray-200 p-3 sm:p-4 relative">
                                                            {/* Chart Component - Moved to top */}
                                                            {showCharts.has(monthData.month) && (() => {
                                                                const comparison = getMonthComparison(monthData.month, clientHistory);
                                                                if (comparison) {
                                                                    // Find the previous month data
                                                                    const sortedHistory = [...clientHistory.history].sort((a, b) => new Date(a.month) - new Date(b.month));
                                                                    const currentIndex = sortedHistory.findIndex(month => month.month === monthData.month);
                                                                    const previousMonthData = currentIndex > 0 ? sortedHistory[currentIndex - 1] : null;

                                                                    return (
                                                                        <MonthComparisonChart
                                                                            currentMonthData={monthData}
                                                                            previousMonthData={previousMonthData}
                                                                            monthName={formatMonth(monthData.month)}
                                                                        />
                                                                    );
                                                                } else {
                                                                    return (
                                                                        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                                                            <p className="text-sm text-yellow-800">No previous month data available for comparison</p>
                                                                        </div>
                                                                    );
                                                                }
                                                            })()}

                                                            <div className="overflow-x-auto max-h-80 sm:max-h-96 overflow-y-auto border border-gray-200 rounded-lg bg-white relative" style={{ maxWidth: '100%' }}>
                                                                <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm">
                                                                    <thead className="bg-gray-50">
                                                                        <tr>
                                                                            <th className="px-2 sm:px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                                Description
                                                                            </th>
                                                                            <th className="px-2 sm:px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                                Current
                                                                            </th>
                                                                            <th className="px-2 sm:px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                                0-30
                                                                            </th>
                                                                            <th className="px-2 sm:px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                                31-60
                                                                            </th>
                                                                            <th className="px-2 sm:px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                                61-90
                                                                            </th>
                                                                            <th className="px-2 sm:px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                                90+
                                                                            </th>
                                                                            <th className="px-2 sm:px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                                Total
                                                                            </th>
                                                                            <th className="px-2 sm:px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                                Type
                                                                            </th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                                        {monthData.records.map((record, index) => {
                                                                            const comparison = getRecordComparison(record, monthData.month, clientHistory);

                                                                            // Debug: Log comparison for specific records

                                                                            return (
                                                                                <tr key={index} className={record.predicted ? 'bg-purple-50' : ''}>
                                                                                    <td className="px-2 sm:px-3 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                                                                                        {record.description}
                                                                                    </td>
                                                                                    <td className="px-2 sm:px-3 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                                                                                        <div>{formatCurrency(record.aging.current)}</div>
                                                                                        {comparison && (
                                                                                            <ComparisonPopover
                                                                                                previousValue={comparison.current.previousValue}
                                                                                                currentValue={record.aging.current}
                                                                                                bucket="current"
                                                                                                isVisible={popoverVisible?.bucket === 'current' && popoverVisible?.recordId === record.description}
                                                                                                onMouseEnter={() => handlePopoverEnter('current', record.description, comparison.current.previousValue, record.aging.current)}
                                                                                                onMouseLeave={handlePopoverLeave}
                                                                                                onPopoverMouseEnter={handlePopoverMouseEnter}
                                                                                                onPopoverMouseLeave={handlePopoverMouseLeave}
                                                                                                formatCurrency={formatCurrency}
                                                                                            >
                                                                                                <div className={`text-xs cursor-pointer ${(Math.abs(comparison.current.absolute) < 0.0001 && Math.abs(comparison.current.percentage) < 0.0001) ? 'text-gray-400' : (comparison.current.absolute >= 0 ? 'text-green-600' : 'text-red-600')}`}>
                                                                                                    {comparison.current.absolute >= 0 ? '+' : ''}{formatCurrency(comparison.current.absolute)}
                                                                                                    <span className="ml-1">({comparison.current.percentage >= 0 ? '+' : ''}{comparison.current.percentage.toFixed(1)}%)</span>
                                                                                                </div>
                                                                                            </ComparisonPopover>
                                                                                        )}
                                                                                    </td>
                                                                                    <td className="px-2 sm:px-3 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                                                                                        <div>{formatCurrency(record.aging['0_30'])}</div>
                                                                                        {comparison && (
                                                                                            <ComparisonPopover
                                                                                                previousValue={comparison['0_30'].previousValue}
                                                                                                currentValue={record.aging['0_30']}
                                                                                                bucket="0_30"
                                                                                                isVisible={popoverVisible?.bucket === '0_30' && popoverVisible?.recordId === record.description}
                                                                                                onMouseEnter={() => handlePopoverEnter('0_30', record.description, comparison['0_30'].previousValue, record.aging['0_30'])}
                                                                                                onMouseLeave={handlePopoverLeave}
                                                                                                onPopoverMouseEnter={handlePopoverMouseEnter}
                                                                                                onPopoverMouseLeave={handlePopoverMouseLeave}
                                                                                                formatCurrency={formatCurrency}
                                                                                            >
                                                                                                <div className={`text-xs cursor-pointer ${(Math.abs(comparison['0_30'].absolute) < 0.0001 && Math.abs(comparison['0_30'].percentage) < 0.0001) ? 'text-gray-400' : (comparison['0_30'].absolute >= 0 ? 'text-green-600' : 'text-red-600')}`}>
                                                                                                    {comparison['0_30'].absolute >= 0 ? '+' : ''}{formatCurrency(comparison['0_30'].absolute)}
                                                                                                    <span className="ml-1">({comparison['0_30'].percentage >= 0 ? '+' : ''}{comparison['0_30'].percentage.toFixed(1)}%)</span>
                                                                                                </div>
                                                                                            </ComparisonPopover>
                                                                                        )}
                                                                                    </td>
                                                                                    <td className="px-2 sm:px-3 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                                                                                        <div>{formatCurrency(record.aging['31_60'])}</div>
                                                                                        {comparison && (
                                                                                            <ComparisonPopover
                                                                                                previousValue={comparison['31_60'].previousValue}
                                                                                                currentValue={record.aging['31_60']}
                                                                                                bucket="31_60"
                                                                                                isVisible={popoverVisible?.bucket === '31_60' && popoverVisible?.recordId === record.description}
                                                                                                onMouseEnter={() => handlePopoverEnter('31_60', record.description, comparison['31_60'].previousValue, record.aging['31_60'])}
                                                                                                onMouseLeave={handlePopoverLeave}
                                                                                                onPopoverMouseEnter={handlePopoverMouseEnter}
                                                                                                onPopoverMouseLeave={handlePopoverMouseLeave}
                                                                                                formatCurrency={formatCurrency}
                                                                                            >
                                                                                                <div className={`text-xs cursor-pointer ${(Math.abs(comparison['31_60'].absolute) < 0.0001 && Math.abs(comparison['31_60'].percentage) < 0.0001) ? 'text-gray-400' : (comparison['31_60'].absolute >= 0 ? 'text-green-600' : 'text-red-600')}`}>
                                                                                                    {comparison['31_60'].absolute >= 0 ? '+' : ''}{formatCurrency(comparison['31_60'].absolute)}
                                                                                                    <span className="ml-1">({comparison['31_60'].percentage >= 0 ? '+' : ''}{comparison['31_60'].percentage.toFixed(1)}%)</span>
                                                                                                </div>
                                                                                            </ComparisonPopover>
                                                                                        )}
                                                                                    </td>
                                                                                    <td className="px-2 sm:px-3 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                                                                                        <div>{formatCurrency(record.aging['61_90'])}</div>
                                                                                        {comparison && (
                                                                                            <ComparisonPopover
                                                                                                previousValue={comparison['61_90'].previousValue}
                                                                                                currentValue={record.aging['61_90']}
                                                                                                bucket="61_90"
                                                                                                isVisible={popoverVisible?.bucket === '61_90' && popoverVisible?.recordId === record.description}
                                                                                                onMouseEnter={() => handlePopoverEnter('61_90', record.description, comparison['61_90'].previousValue, record.aging['61_90'])}
                                                                                                onMouseLeave={handlePopoverLeave}
                                                                                                onPopoverMouseEnter={handlePopoverMouseEnter}
                                                                                                onPopoverMouseLeave={handlePopoverMouseLeave}
                                                                                                formatCurrency={formatCurrency}
                                                                                            >
                                                                                                <div className={`text-xs cursor-pointer ${(Math.abs(comparison['61_90'].absolute) < 0.0001 && Math.abs(comparison['61_90'].percentage) < 0.0001) ? 'text-gray-400' : (comparison['61_90'].absolute >= 0 ? 'text-green-600' : 'text-red-600')}`}>
                                                                                                    {comparison['61_90'].absolute >= 0 ? '+' : ''}{formatCurrency(comparison['61_90'].absolute)}
                                                                                                    <span className="ml-1">({comparison['61_90'].percentage >= 0 ? '+' : ''}{comparison['61_90'].percentage.toFixed(1)}%)</span>
                                                                                                </div>
                                                                                            </ComparisonPopover>
                                                                                        )}
                                                                                    </td>
                                                                                    <td className="px-2 sm:px-3 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                                                                                        <div>{formatCurrency(record.aging['90_plus'])}</div>
                                                                                        {comparison && (
                                                                                            <ComparisonPopover
                                                                                                previousValue={comparison['90_plus'].previousValue}
                                                                                                currentValue={record.aging['90_plus']}
                                                                                                bucket="90_plus"
                                                                                                isVisible={popoverVisible?.bucket === '90_plus' && popoverVisible?.recordId === record.description}
                                                                                                onMouseEnter={() => handlePopoverEnter('90_plus', record.description, comparison['90_plus'].previousValue, record.aging['90_plus'])}
                                                                                                onMouseLeave={handlePopoverLeave}
                                                                                                onPopoverMouseEnter={handlePopoverMouseEnter}
                                                                                                onPopoverMouseLeave={handlePopoverMouseLeave}
                                                                                                formatCurrency={formatCurrency}
                                                                                            >
                                                                                                <div className={`text-xs cursor-pointer ${(Math.abs(comparison['90_plus'].absolute) < 0.0001 && Math.abs(comparison['90_plus'].percentage) < 0.0001) ? 'text-gray-400' : (comparison['90_plus'].absolute >= 0 ? 'text-green-600' : 'text-red-600')}`}>
                                                                                                    {comparison['90_plus'].absolute >= 0 ? '+' : ''}{formatCurrency(comparison['90_plus'].absolute)}
                                                                                                    <span className="ml-1">({comparison['90_plus'].percentage >= 0 ? '+' : ''}{comparison['90_plus'].percentage.toFixed(1)}%)</span>
                                                                                                </div>
                                                                                            </ComparisonPopover>
                                                                                        )}
                                                                                    </td>
                                                                                    <td className="px-2 sm:px-3 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                                                                                        <div>{formatCurrency(record.total)}</div>
                                                                                        {comparison && (
                                                                                            <ComparisonPopover
                                                                                                previousValue={comparison.total.previousValue}
                                                                                                currentValue={record.total}
                                                                                                bucket="total"
                                                                                                isVisible={popoverVisible?.bucket === 'total' && popoverVisible?.recordId === record.description}
                                                                                                onMouseEnter={() => handlePopoverEnter('total', record.description, comparison.total.previousValue, record.total)}
                                                                                                onMouseLeave={handlePopoverLeave}
                                                                                                onPopoverMouseEnter={handlePopoverMouseEnter}
                                                                                                onPopoverMouseLeave={handlePopoverMouseLeave}
                                                                                                formatCurrency={formatCurrency}
                                                                                            >
                                                                                                <div className={`text-xs cursor-pointer ${(Math.abs(comparison.total.absolute) < 0.0001 && Math.abs(comparison.total.percentage) < 0.0001) ? 'text-gray-400' : (comparison.total.absolute >= 0 ? 'text-green-600' : 'text-red-600')}`}>
                                                                                                    {comparison.total.absolute >= 0 ? '+' : ''}{formatCurrency(comparison.total.absolute)}
                                                                                                    <span className="ml-1">({comparison.total.percentage >= 0 ? '+' : ''}{comparison.total.percentage.toFixed(1)}%)</span>
                                                                                                </div>
                                                                                            </ComparisonPopover>
                                                                                        )}
                                                                                    </td>
                                                                                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                                                                        {record.predicted ? (
                                                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                                                                Generated
                                                                                            </span>
                                                                                        ) : (
                                                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                                                Historical
                                                                                            </span>
                                                                                        )}
                                                                                    </td>
                                                                                </tr>
                                                                            );
                                                                        })}

                                                                        {/* Totals Row */}
                                                                        {(() => {
                                                                            const comparison = getMonthComparison(monthData.month, clientHistory);
                                                                            return (
                                                                                <tr className="bg-gray-50 border-t-2 border-gray-300">
                                                                                    <td className="px-2 sm:px-3 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-bold text-gray-900">
                                                                                        TOTALS
                                                                                    </td>
                                                                                    <td className="px-2 sm:px-3 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-bold text-gray-900">
                                                                                        <div>{formatCurrency(monthData.records.reduce((sum, record) => sum + (record.aging.current || 0), 0))}</div>
                                                                                        {comparison && (
                                                                                            <div className={`text-xs font-normal ${comparison.current.absolute >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                                                {comparison.current.absolute >= 0 ? '+' : ''}{formatCurrency(comparison.current.absolute)}
                                                                                                <span className="ml-1">({comparison.current.percentage >= 0 ? '+' : ''}{comparison.current.percentage.toFixed(1)}%)</span>
                                                                                            </div>
                                                                                        )}
                                                                                    </td>
                                                                                    <td className="px-2 sm:px-3 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-bold text-gray-900">
                                                                                        <div>{formatCurrency(monthData.records.reduce((sum, record) => sum + (record.aging['0_30'] || 0), 0))}</div>
                                                                                        {comparison && (
                                                                                            <div className={`text-xs font-normal ${comparison['0_30'].absolute >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                                                {comparison['0_30'].absolute >= 0 ? '+' : ''}{formatCurrency(comparison['0_30'].absolute)}
                                                                                                <span className="ml-1">({comparison['0_30'].percentage >= 0 ? '+' : ''}{comparison['0_30'].percentage.toFixed(1)}%)</span>
                                                                                            </div>
                                                                                        )}
                                                                                    </td>
                                                                                    <td className="px-2 sm:px-3 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-bold text-gray-900">
                                                                                        <div>{formatCurrency(monthData.records.reduce((sum, record) => sum + (record.aging['31_60'] || 0), 0))}</div>
                                                                                        {comparison && (
                                                                                            <div className={`text-xs font-normal ${comparison['31_60'].absolute >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                                                {comparison['31_60'].absolute >= 0 ? '+' : ''}{formatCurrency(comparison['31_60'].absolute)}
                                                                                                <span className="ml-1">({comparison['31_60'].percentage >= 0 ? '+' : ''}{comparison['31_60'].percentage.toFixed(1)}%)</span>
                                                                                            </div>
                                                                                        )}
                                                                                    </td>
                                                                                    <td className="px-2 sm:px-3 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-bold text-gray-900">
                                                                                        <div>{formatCurrency(monthData.records.reduce((sum, record) => sum + (record.aging['61_90'] || 0), 0))}</div>
                                                                                        {comparison && (
                                                                                            <div className={`text-xs font-normal ${comparison['61_90'].absolute >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                                                {comparison['61_90'].absolute >= 0 ? '+' : ''}{formatCurrency(comparison['61_90'].absolute)}
                                                                                                <span className="ml-1">({comparison['61_90'].percentage >= 0 ? '+' : ''}{comparison['61_90'].percentage.toFixed(1)}%)</span>
                                                                                            </div>
                                                                                        )}
                                                                                    </td>
                                                                                    <td className="px-2 sm:px-3 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-bold text-gray-900">
                                                                                        <div>{formatCurrency(monthData.records.reduce((sum, record) => sum + (record.aging['90_plus'] || 0), 0))}</div>
                                                                                        {comparison && (
                                                                                            <div className={`text-xs font-normal ${comparison['90_plus'].absolute >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                                                {comparison['90_plus'].absolute >= 0 ? '+' : ''}{formatCurrency(comparison['90_plus'].absolute)}
                                                                                                <span className="ml-1">({comparison['90_plus'].percentage >= 0 ? '+' : ''}{comparison['90_plus'].percentage.toFixed(1)}%)</span>
                                                                                            </div>
                                                                                        )}
                                                                                    </td>
                                                                                    <td className="px-2 sm:px-3 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-bold text-green-600">
                                                                                        <div>{formatCurrency(monthData.records.reduce((sum, record) => sum + (record.total || 0), 0))}</div>
                                                                                        {comparison && (
                                                                                            <div className={`text-xs font-normal ${comparison.total.absolute >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                                                {comparison.total.absolute >= 0 ? '+' : ''}{formatCurrency(comparison.total.absolute)}
                                                                                                <span className="ml-1">({comparison.total.percentage >= 0 ? '+' : ''}{comparison.total.percentage.toFixed(1)}%)</span>
                                                                                            </div>
                                                                                        )}
                                                                                    </td>
                                                                                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                                                            {monthData.records.length} records
                                                                                        </span>
                                                                                    </td>
                                                                                </tr>
                                                                            );
                                                                        })()}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-6 text-center text-gray-500">
                                        <p>No history data available for this client.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {sortedClients.length === 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                    <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Clients Found</h3>
                    <p className="text-gray-600">
                        {searchTerm ? 'No clients match your search criteria.' : 'No clients have been added yet.'}
                    </p>
                </div>
            )}
        </div>
    );
};

export default Clients;

import React, { useState, useEffect, useCallback } from 'react';

const PredictionsTable = ({ predictions, lastMonthData, onPredictionsChange, targetTotal, onTargetMismatch }) => {
    const [editablePredictions, setEditablePredictions] = useState([]);
    const [autoBalance, setAutoBalance] = useState(true);

    useEffect(() => {
        setEditablePredictions([...predictions]);
    }, [predictions, lastMonthData]);

    const handleCellChange = (index, field, value) => {
        const newPredictions = [...editablePredictions];
        const newValue = parseFloat(value) || 0;

        if (field === 'total') {
            // If total is changed, distribute proportionally across buckets
            if (autoBalance && newValue > 0) {
                const currentTotal = newPredictions[index].total || 1;
                const ratio = newValue / currentTotal;

                newPredictions[index]['current'] = Math.round((newPredictions[index]['current'] * ratio) * 100) / 100;
                newPredictions[index]['0_30'] = Math.round((newPredictions[index]['0_30'] * ratio) * 100) / 100;
                newPredictions[index]['31_60'] = Math.round((newPredictions[index]['31_60'] * ratio) * 100) / 100;
                newPredictions[index]['61_90'] = Math.round((newPredictions[index]['61_90'] * ratio) * 100) / 100;
                newPredictions[index]['90_plus'] = Math.round((newPredictions[index]['90_plus'] * ratio) * 100) / 100;
            }
        } else if (field === 'current') {
            // If current is changed, also update 0_30 to match
            newPredictions[index][field] = newValue;
            newPredictions[index]['0_30'] = newValue;
        } else {
            // If bucket is changed, update total
            newPredictions[index][field] = newValue;
        }

        // Recalculate total
        newPredictions[index].total =
            newPredictions[index]['0_30'] +
            newPredictions[index]['31_60'] +
            newPredictions[index]['61_90'] +
            newPredictions[index]['90_plus'];

        setEditablePredictions(newPredictions);
        onPredictionsChange(newPredictions);
    };

    const calculateColumnTotal = (field) => {
        return editablePredictions.reduce((sum, pred) => sum + (pred[field] || 0), 0);
    };

    const calculateLastMonthColumnTotal = (field) => {
        if (lastMonthData.length === 0) return 0;

        return lastMonthData.reduce((sum, record) => {
            let value = 0;
            if (field === 'current') {
                value = record.current || record['0_30'] || 0;
            } else if (field === '0_30') {
                value = record['0_30'] || 0;
            } else if (field === '31_60') {
                value = record['0_30'] || 0; // Previous month's 0-30 becomes current month's 31-60
            } else if (field === '61_90') {
                value = record['31_60'] || 0; // Previous month's 31-60 becomes current month's 61-90
            } else if (field === '90_plus') {
                value = (record['61_90'] || 0) + (record['90_plus'] || 0); // Previous month's 61-90 + 90+ becomes current month's 90+
            } else if (field === 'total') {
                value = record.total || 0;
            }
            return sum + value;
        }, 0);
    };

    const grandTotal = calculateColumnTotal('total');
    const isTargetMatched = Math.abs(grandTotal - targetTotal) < 0.01;

    // Notify parent about target mismatch
    useEffect(() => {
        if (onTargetMismatch) {
            onTargetMismatch(!isTargetMatched, grandTotal, targetTotal);
        }
    }, [isTargetMatched, grandTotal, targetTotal, onTargetMismatch]);

    // Auto-adjust the largest prediction to match target exactly
    const adjustToTarget = useCallback(() => {
        if (!isTargetMatched && editablePredictions.length > 0) {
            const difference = targetTotal - grandTotal;
            if (Math.abs(difference) > 0) {
                // Find the largest prediction and adjust it
                const largestIdx = editablePredictions.reduce((maxIdx, pred, idx) =>
                    pred.total > editablePredictions[maxIdx].total ? idx : maxIdx, 0
                );

                const newPredictions = [...editablePredictions];
                newPredictions[largestIdx].total += difference;
                newPredictions[largestIdx].current = newPredictions[largestIdx].total;
                newPredictions[largestIdx]['0_30'] = newPredictions[largestIdx].total;

                setEditablePredictions(newPredictions);
                onPredictionsChange(newPredictions);
            }
        }
    }, [isTargetMatched, editablePredictions, targetTotal, grandTotal, onPredictionsChange]);

    // Auto-adjust when predictions change
    useEffect(() => {
        if (editablePredictions.length > 0 && !isTargetMatched) {
            const timeoutId = setTimeout(adjustToTarget, 100); // Small delay to avoid infinite loops
            return () => clearTimeout(timeoutId);
        }
    }, [adjustToTarget, editablePredictions.length, isTargetMatched]);

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    // Find matching record from last month's data
    const findLastMonthRecord = (currentRecord) => {
        if (!lastMonthData || lastMonthData.length === 0) return null;

        // Try exact match first
        let lastMonthRecord = lastMonthData.find(record =>
            record.description === currentRecord.description
        );

        if (lastMonthRecord) return lastMonthRecord;

        // Try normalized match if exact match fails
        const normalizeString = (str) => {
            return str.toLowerCase()
                .replace(/\s+/g, ' ')
                .replace(/[.,]/g, '')
                .trim()
                .replace(/sloutions/g, 'solutions'); // Handle specific typo
        };

        const normalizedCurrent = normalizeString(currentRecord.description);
        lastMonthRecord = lastMonthData.find(record =>
            normalizeString(record.description) === normalizedCurrent
        );

        return lastMonthRecord;
    };

    // Calculate difference between current and last month value
    const calculateDifference = (currentValue, lastMonthValue) => {
        const diff = currentValue - lastMonthValue;
        const percentage = lastMonthValue !== 0 ? (diff / lastMonthValue) * 100 : 0;
        return { diff, percentage };
    };

    // Component to display difference with color coding
    const DifferenceDisplay = ({ currentValue, currentRecord, field }) => {
        if (lastMonthData.length === 0) {
            return null;
        }

        let lastMonthValue = 0;

        // Special case for totals row
        if (currentRecord.description === 'TOTAL') {
            lastMonthValue = calculateLastMonthColumnTotal(field);
        } else {
            const lastMonthRecord = findLastMonthRecord(currentRecord);
            if (!lastMonthRecord) {
                return null;
            }

            // Get the corresponding last month value based on aging logic
            if (field === 'current') {
                lastMonthValue = lastMonthRecord.current || lastMonthRecord['0_30'] || 0;
            } else if (field === '0_30') {
                lastMonthValue = lastMonthRecord['0_30'] || 0;
            } else if (field === '31_60') {
                lastMonthValue = lastMonthRecord['0_30'] || 0; // Previous month's 0-30 becomes current month's 31-60
            } else if (field === '61_90') {
                lastMonthValue = lastMonthRecord['31_60'] || 0; // Previous month's 31-60 becomes current month's 61-90
            } else if (field === '90_plus') {
                lastMonthValue = (lastMonthRecord['61_90'] || 0) + (lastMonthRecord['90_plus'] || 0); // Previous month's 61-90 + 90+ becomes current month's 90+
            } else if (field === 'total') {
                lastMonthValue = lastMonthRecord.total || 0;
            }
        }

        const { diff, percentage } = calculateDifference(currentValue, lastMonthValue);
        const isPositive = diff >= 0;

        const isZero = Math.abs(diff) < 0.01 && Math.abs(percentage) < 0.1;

        return (
            <div className="text-xs mt-1">
                <div className={`font-medium ${isZero ? 'text-gray-400' : (isPositive ? 'text-green-600' : 'text-red-600')}`}>
                    {isPositive ? '+' : ''}{formatCurrency(diff)}
                </div>
                <div className={`text-xs ${isZero ? 'text-gray-400' : (isPositive ? 'text-green-500' : 'text-red-500')}`}>
                    ({isPositive ? '+' : ''}{percentage.toFixed(1)}%)
                </div>
            </div>
        );
    };

    return (
        <div className="card">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Predictions Table</h2>
                <div className="flex items-center gap-4">
                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            checked={autoBalance}
                            onChange={(e) => setAutoBalance(e.target.checked)}
                            className="mr-2 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700">Auto-balance per row</span>
                    </label>
                    <div className="text-sm">
                        <span className="text-gray-600">Grand Total:</span>
                        <span className={`ml-2 font-medium ${isTargetMatched ? 'text-success-600' : 'text-danger-600'}`}>
                            {formatCurrency(grandTotal)}
                        </span>
                        {!isTargetMatched && (
                            <span className="ml-2 text-danger-500 text-xs">
                                (Target: {formatCurrency(targetTotal)})
                            </span>
                        )}
                    </div>
                    {!isTargetMatched && (
                        <button
                            onClick={adjustToTarget}
                            className="px-3 py-1 bg-primary-500 text-white text-xs rounded hover:bg-primary-600 transition-colors duration-200"
                        >
                            Fix Target Match
                        </button>
                    )}
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="table-header">Description</th>
                            <th className="table-header">Current</th>
                            <th className="table-header">0-30 Days</th>
                            <th className="table-header">31-60 Days</th>
                            <th className="table-header">61-90 Days</th>
                            <th className="table-header">90+ Days</th>
                            <th className="table-header">Total</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {editablePredictions.map((prediction, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                                <td className="table-cell font-medium text-gray-900">
                                    {prediction.description}
                                </td>
                                <td className="table-cell">
                                    <div>
                                        <input
                                            type="number"
                                            value={prediction.current || prediction['0_30']}
                                            onChange={(e) => handleCellChange(index, 'current', e.target.value)}
                                            className="table-input"
                                            min="0"
                                            step="1"
                                        />
                                        <DifferenceDisplay
                                            currentValue={prediction.current || prediction['0_30']}
                                            currentRecord={prediction}
                                            field="current"
                                        />
                                    </div>
                                </td>
                                <td className="table-cell">
                                    <div>
                                        <input
                                            type="number"
                                            value={prediction['0_30']}
                                            onChange={(e) => handleCellChange(index, '0_30', e.target.value)}
                                            className="table-input"
                                            min="0"
                                            step="1"
                                        />
                                        <DifferenceDisplay
                                            currentValue={prediction['0_30']}
                                            currentRecord={prediction}
                                            field="0_30"
                                        />
                                    </div>
                                </td>
                                <td className="table-cell">
                                    <div>
                                        <input
                                            type="number"
                                            value={prediction['31_60']}
                                            onChange={(e) => handleCellChange(index, '31_60', e.target.value)}
                                            className="table-input"
                                            min="0"
                                            step="1"
                                        />
                                        <DifferenceDisplay
                                            currentValue={prediction['31_60']}
                                            currentRecord={prediction}
                                            field="31_60"
                                        />
                                    </div>
                                </td>
                                <td className="table-cell">
                                    <div>
                                        <input
                                            type="number"
                                            value={prediction['61_90']}
                                            onChange={(e) => handleCellChange(index, '61_90', e.target.value)}
                                            className="table-input"
                                            min="0"
                                            step="1"
                                        />
                                        <DifferenceDisplay
                                            currentValue={prediction['61_90']}
                                            currentRecord={prediction}
                                            field="61_90"
                                        />
                                    </div>
                                </td>
                                <td className="table-cell">
                                    <div>
                                        <input
                                            type="number"
                                            value={prediction['90_plus']}
                                            onChange={(e) => handleCellChange(index, '90_plus', e.target.value)}
                                            className="table-input"
                                            min="0"
                                            step="1"
                                        />
                                        <DifferenceDisplay
                                            currentValue={prediction['90_plus']}
                                            currentRecord={prediction}
                                            field="90_plus"
                                        />
                                    </div>
                                </td>
                                <td className="table-cell">
                                    <div>
                                        <input
                                            type="number"
                                            value={prediction.total}
                                            onChange={(e) => handleCellChange(index, 'total', e.target.value)}
                                            className="table-input font-medium"
                                            min="0"
                                            step="1"
                                        />
                                        <DifferenceDisplay
                                            currentValue={prediction.total}
                                            currentRecord={prediction}
                                            field="total"
                                        />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                        <tr className="font-medium">
                            <td className="table-cell">
                                <strong>Totals</strong>
                            </td>
                            <td className="table-cell">
                                <div>
                                    <strong>{formatCurrency(calculateColumnTotal('current'))}</strong>
                                    <DifferenceDisplay
                                        currentValue={calculateColumnTotal('current')}
                                        currentRecord={{ description: 'TOTAL' }}
                                        field="current"
                                    />
                                </div>
                            </td>
                            <td className="table-cell">
                                <div>
                                    <strong>{formatCurrency(calculateColumnTotal('0_30'))}</strong>
                                    <DifferenceDisplay
                                        currentValue={calculateColumnTotal('0_30')}
                                        currentRecord={{ description: 'TOTAL' }}
                                        field="0_30"
                                    />
                                </div>
                            </td>
                            <td className="table-cell">
                                <div>
                                    <strong>{formatCurrency(calculateColumnTotal('31_60'))}</strong>
                                    <DifferenceDisplay
                                        currentValue={calculateColumnTotal('31_60')}
                                        currentRecord={{ description: 'TOTAL' }}
                                        field="31_60"
                                    />
                                </div>
                            </td>
                            <td className="table-cell">
                                <div>
                                    <strong>{formatCurrency(calculateColumnTotal('61_90'))}</strong>
                                    <DifferenceDisplay
                                        currentValue={calculateColumnTotal('61_90')}
                                        currentRecord={{ description: 'TOTAL' }}
                                        field="61_90"
                                    />
                                </div>
                            </td>
                            <td className="table-cell">
                                <div>
                                    <strong>{formatCurrency(calculateColumnTotal('90_plus'))}</strong>
                                    <DifferenceDisplay
                                        currentValue={calculateColumnTotal('90_plus')}
                                        currentRecord={{ description: 'TOTAL' }}
                                        field="90_plus"
                                    />
                                </div>
                            </td>
                            <td className="table-cell">
                                <div>
                                    <strong className={isTargetMatched ? 'text-success-600' : 'text-danger-600'}>
                                        {formatCurrency(grandTotal)}
                                    </strong>
                                    <DifferenceDisplay
                                        currentValue={grandTotal}
                                        currentRecord={{ description: 'TOTAL' }}
                                        field="total"
                                    />
                                </div>
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

        </div>
    );
};

export default PredictionsTable;

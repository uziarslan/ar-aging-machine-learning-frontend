import React, { useState, useEffect } from 'react';

function PredictionsTable(props) {
    const { predictions, lastMonthData, onPredictionsChange, targetTotal, onTargetMismatch } = props;
    const [editablePredictions, setEditablePredictions] = useState([]);

    useEffect(() => {
        setEditablePredictions([...predictions]);
    }, [predictions, lastMonthData]);

    function handleCellChange(index, field, value) {
        const newPredictions = [...editablePredictions];
        const newValue = Math.round(parseFloat(value) || 0);

        if (field === 'total') {
            // Total is derived from buckets; ignore direct edits
            return;
        } else if (field === 'current') {
            // For override rows, do not allow 'current' to drive 0-30
            if (newPredictions[index] && newPredictions[index].is_override) {
                return;
            }
            // If current is changed, also update 0_30 to match
            newPredictions[index][field] = newValue;
            newPredictions[index]['0_30'] = newValue;
        } else {
            // If bucket is changed, update total
            newPredictions[index][field] = newValue;
        }

        // Recalculate total (sum of aged buckets only) and round to integer
        newPredictions[index].total = Math.round(
            (newPredictions[index]['0_30'] || 0) +
            (newPredictions[index]['31_60'] || 0) +
            (newPredictions[index]['61_90'] || 0) +
            (newPredictions[index]['90_plus'] || 0)
        );
        // Enforce Current = Total
        newPredictions[index].current = newPredictions[index].total;

        setEditablePredictions(newPredictions);
        onPredictionsChange(newPredictions);
    }

    function calculateColumnTotal(field) {
        return Math.round(editablePredictions.reduce(function (sum, pred) {
            return sum + (pred[field] || 0);
        }, 0));
    }

    function calculateLastMonthColumnTotal(field) {
        if (!lastMonthData || lastMonthData.length === 0) return 0;

        return Math.round(lastMonthData.reduce(function (sum, record) {
            var value = 0;
            if (field === 'current') {
                value = record.current || record['0_30'] || 0;
            } else if (field === '0_30') {
                value = record['0_30'] || 0;
            } else if (field === '31_60') {
                value = record['0_30'] || 0;
            } else if (field === '61_90') {
                value = record['31_60'] || 0;
            } else if (field === '90_plus') {
                value = (record['61_90'] || 0) + (record['90_plus'] || 0);
            } else if (field === 'total') {
                value = record.total || 0;
            }
            return sum + value;
        }, 0));
    }

    const grandTotal = Math.round(calculateColumnTotal('total'));
    const isTargetMatched = Math.abs(grandTotal - targetTotal) < 0.01;

    // Notify parent about target mismatch
    useEffect(() => {
        if (onTargetMismatch) {
            onTargetMismatch(!isTargetMatched, grandTotal, targetTotal);
        }
    }, [isTargetMatched, grandTotal, targetTotal, onTargetMismatch]);

    // Frontend no longer adjusts to target; all adjustments are backend-driven.

    function formatCurrency(value) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    }

    function findLastMonthRecord(currentRecord) {
        if (!lastMonthData || lastMonthData.length === 0) return null;

        var lastMonthRecord = lastMonthData.find(function (record) {
            return record.description === currentRecord.description;
        });

        if (lastMonthRecord) return lastMonthRecord;

        function normalizeString(str) {
            return str.toLowerCase()
                .replace(/\s+/g, ' ')
                .replace(/[.,]/g, '')
                .trim()
                .replace(/sloutions/g, 'solutions');
        }

        var normalizedCurrent = normalizeString(currentRecord.description);
        lastMonthRecord = lastMonthData.find(function (record) {
            return normalizeString(record.description) === normalizedCurrent;
        });

        return lastMonthRecord;
    }

    function calculateDifference(currentValue, lastMonthValue) {
        var diff = currentValue - lastMonthValue;
        var percentage = lastMonthValue !== 0 ? (diff / lastMonthValue) * 100 : 0;
        return { diff: diff, percentage: percentage };
    }

    function getRowType(prediction) {
        // Check if this is a user override (has is_override flag)
        if (prediction.is_override) {
            // Check if it's a new entry (no last month data) or an override (has last month data)
            var lastMonthRecord = findLastMonthRecord(prediction);
            if (lastMonthRecord) {
                return 'override'; // User provided amount for existing client -> "New Entry" tag
            } else {
                return 'new'; // User provided new client -> "User Override" tag
            }
        } else {
            // Check if it's a carried over client or model-generated
            var lastMonthRecordOverride = findLastMonthRecord(prediction);
            if (lastMonthRecordOverride) {
                return 'carried'; // Existing client carried over with ML aging
            } else {
                return 'generated'; // Model-generated new client to meet target
            }
        }
    }

    function getRowTypeTag(type) {
        switch (type) {
            case 'carried':
                return { text: 'Carried Over', color: 'bg-blue-100 text-blue-800' };
            case 'new':
                return { text: 'User Added', color: 'bg-green-100 text-green-800' };
            case 'override':
                return { text: 'User Set', color: 'bg-purple-100 text-purple-800' };
            case 'generated':
                return { text: 'Auto Generated', color: 'bg-orange-100 text-orange-800' };
            default:
                return { text: 'Unknown', color: 'bg-gray-100 text-gray-800' };
        }
    }

    function getTooltipText(type) {
        switch (type) {
            case 'carried':
                return 'Existing client from previous month with ML aging applied';
            case 'new':
                return 'New client added by user (0-30 days only)';
            case 'override':
                return 'User provided amount for existing client';
            case 'generated':
                return 'Automatically generated by model to meet target';
            default:
                return 'Unknown source';
        }
    }

    function DifferenceDisplay(props) {
        var currentValue = props.currentValue;
        var currentRecord = props.currentRecord;
        var field = props.field;

        if (!lastMonthData || lastMonthData.length === 0) {
            return null;
        }

        var lastMonthValue = 0;

        if (currentRecord.description === 'TOTAL') {
            lastMonthValue = calculateLastMonthColumnTotal(field);
        } else {
            var lastMonthRecord = findLastMonthRecord(currentRecord);
            if (!lastMonthRecord) {
                return null;
            }

            if (field === 'current') {
                lastMonthValue = lastMonthRecord.current || lastMonthRecord['0_30'] || 0;
            } else if (field === '0_30') {
                lastMonthValue = lastMonthRecord['0_30'] || 0;
            } else if (field === '31_60') {
                lastMonthValue = lastMonthRecord['0_30'] || 0;
            } else if (field === '61_90') {
                lastMonthValue = lastMonthRecord['31_60'] || 0;
            } else if (field === '90_plus') {
                lastMonthValue = (lastMonthRecord['61_90'] || 0) + (lastMonthRecord['90_plus'] || 0);
            } else if (field === 'total') {
                lastMonthValue = lastMonthRecord.total || 0;
            }
        }

        var diffObj = calculateDifference(currentValue, lastMonthValue);
        var diff = diffObj.diff;
        var percentage = diffObj.percentage;
        var isPositive = diff >= 0;
        var isZero = Math.abs(diff) < 0.01 && Math.abs(percentage) < 0.1;

        return (
            <div className="text-xs mt-1">
                <div className={'font-medium ' + (isZero ? 'text-gray-400' : (isPositive ? 'text-green-600' : 'text-red-600'))}>
                    {isPositive ? '+' : ''}{formatCurrency(diff)}
                </div>
                <div className={'text-xs ' + (isZero ? 'text-gray-400' : (isPositive ? 'text-green-500' : 'text-red-500'))}>
                    ({isPositive ? '+' : ''}{percentage.toFixed(1)}%)
                </div>
            </div>
        );
    }

    return (
        <div className="card">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Predictions Table</h2>
                <div className="flex items-center gap-4">
                    <div className="text-sm">
                        <span className="text-gray-600">Grand Total:</span>
                        <span className={'ml-2 font-medium ' + (isTargetMatched ? 'text-success-600' : 'text-danger-600')}>
                            {formatCurrency(grandTotal)}
                        </span>
                        {!isTargetMatched && (
                            <span className="ml-2 text-danger-500 text-xs">
                                (Target: {formatCurrency(targetTotal)})
                            </span>
                        )}
                    </div>
                    {/* No frontend fix button; backend must match target */}
                </div>
            </div>

            {/* Row Type Summary */}
            <div className="mb-4 flex flex-wrap gap-2">
                {(() => {
                    var typeCounts = {};
                    editablePredictions.forEach(function (prediction) {
                        var type = getRowType(prediction);
                        typeCounts[type] = (typeCounts[type] || 0) + 1;
                    });

                    return Object.keys(typeCounts).map(function (type) {
                        var tag = getRowTypeTag(type);
                        var tooltipText = getTooltipText(type);
                        return (
                            <div key={type} className="flex items-center gap-2 group relative">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tag.color} cursor-help`}>
                                    {tag.text}
                                </span>
                                <span className="text-sm text-gray-600">({typeCounts[type]})</span>

                                {/* Tooltip */}
                                <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-xl"
                                    style={{ zIndex: 99999 }}>
                                    {tooltipText}
                                    <div className="absolute right-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-900"></div>
                                </div>
                            </div>
                        );
                    });
                })()}
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
                        {editablePredictions.map(function (prediction, index) {
                            var rowType = getRowType(prediction);
                            var tag = getRowTypeTag(rowType);

                            return (
                                <tr key={index} className="hover:bg-gray-50">
                                    <td className="table-cell font-medium text-gray-900">
                                        <div className="flex items-center gap-2">
                                            <span>{prediction.description}</span>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${tag.color}`}>
                                                {tag.text}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="table-cell">
                                        <div>
                                            <input
                                                type="number"
                                                value={Math.round(prediction.current || prediction['0_30'] || 0)}
                                                onChange={function (e) { handleCellChange(index, 'current', e.target.value); }}
                                                className="table-input"
                                                min="0"
                                                step="1"
                                                onWheel={function (e) { e.currentTarget.blur(); }}
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
                                                value={Math.round(prediction['0_30'] || 0)}
                                                onChange={function (e) { handleCellChange(index, '0_30', e.target.value); }}
                                                className="table-input"
                                                min="0"
                                                step="1"
                                                onWheel={function (e) { e.currentTarget.blur(); }}
                                                disabled={prediction.is_override}
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
                                                value={Math.round(prediction['31_60'] || 0)}
                                                onChange={function (e) { handleCellChange(index, '31_60', e.target.value); }}
                                                className="table-input"
                                                min="0"
                                                step="1"
                                                onWheel={function (e) { e.currentTarget.blur(); }}
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
                                                value={Math.round(prediction['61_90'] || 0)}
                                                onChange={function (e) { handleCellChange(index, '61_90', e.target.value); }}
                                                className="table-input"
                                                min="0"
                                                step="1"
                                                onWheel={function (e) { e.currentTarget.blur(); }}
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
                                                value={Math.round(prediction['90_plus'] || 0)}
                                                onChange={function (e) { handleCellChange(index, '90_plus', e.target.value); }}
                                                className="table-input"
                                                min="0"
                                                step="1"
                                                onWheel={function (e) { e.currentTarget.blur(); }}
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
                                                value={Math.round(prediction.total || 0)}
                                                onChange={function (e) { handleCellChange(index, 'total', e.target.value); }}
                                                className="table-input font-medium"
                                                min="0"
                                                step="1"
                                                onWheel={function (e) { e.currentTarget.blur(); }}
                                            />
                                            <DifferenceDisplay
                                                currentValue={prediction.total}
                                                currentRecord={prediction}
                                                field="total"
                                            />
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
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
}

export default PredictionsTable;
import React from 'react';

const PredictionForm = ({
    targetMonth,
    carryThreshold,
    onTargetMonthChange,
    onCarryThresholdChange,
    onGenerate,
    isGenerating,
    disabled,
    minTargetMonth,
    clientLastMonth,
    // Column-specific target props (now default)
    columnTargets,
    onColumnTargetsChange
}) => {
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    return (
        <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Prediction Settings</h3>

            <div className="space-y-3">
                {/* Target Month */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Target Month *
                    </label>
                    <input
                        type="month"
                        value={targetMonth}
                        onChange={(e) => onTargetMonthChange(e.target.value)}
                        className="input-field"
                        min={minTargetMonth}
                        required
                    />
                    <div className="text-xs text-gray-500 mt-1">
                        <p>The month for which to generate predictions</p>
                        {clientLastMonth && (
                            <p className="text-blue-600 mt-1">
                                Last available data: {clientLastMonth}. Only months after this are available.
                            </p>
                        )}
                        {!clientLastMonth && disabled && (
                            <p className="text-amber-600 mt-1">
                                Please select a client first to see available months.
                            </p>
                        )}
                    </div>
                </div>

                {/* Column-Specific Targets */}
                <div>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Column-Specific Targets</h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* 0-30 Days */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    0-30 Days Target
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="text-gray-500 sm:text-sm">$</span>
                                    </div>
                                    <input
                                        type="number"
                                        value={columnTargets?.b0_30 || ''}
                                        onChange={(e) => onColumnTargetsChange('b0_30', e.target.value)}
                                        className="input-field pl-7"
                                        placeholder="0"
                                        min="0"
                                        step="1"
                                        onWheel={(e) => e.currentTarget.blur()}
                                    />
                                </div>
                                {columnTargets?.b0_30 && (
                                    <p className="text-sm text-gray-600 mt-1">
                                        {formatCurrency(parseFloat(columnTargets.b0_30) || 0)}
                                    </p>
                                )}
                            </div>

                            {/* 31-60 Days */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    31-60 Days Target
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="text-gray-500 sm:text-sm">$</span>
                                    </div>
                                    <input
                                        type="number"
                                        value={columnTargets?.b31_60 || ''}
                                        onChange={(e) => onColumnTargetsChange('b31_60', e.target.value)}
                                        className="input-field pl-7"
                                        placeholder="0"
                                        min="0"
                                        step="1"
                                        onWheel={(e) => e.currentTarget.blur()}
                                    />
                                </div>
                                {columnTargets?.b31_60 && (
                                    <p className="text-sm text-gray-600 mt-1">
                                        {formatCurrency(parseFloat(columnTargets.b31_60) || 0)}
                                    </p>
                                )}
                            </div>

                            {/* 61-90 Days */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    61-90 Days Target
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="text-gray-500 sm:text-sm">$</span>
                                    </div>
                                    <input
                                        type="number"
                                        value={columnTargets?.b61_90 || ''}
                                        onChange={(e) => onColumnTargetsChange('b61_90', e.target.value)}
                                        className="input-field pl-7"
                                        placeholder="0"
                                        min="0"
                                        step="1"
                                        onWheel={(e) => e.currentTarget.blur()}
                                    />
                                </div>
                                {columnTargets?.b61_90 && (
                                    <p className="text-sm text-gray-600 mt-1">
                                        {formatCurrency(parseFloat(columnTargets.b61_90) || 0)}
                                    </p>
                                )}
                            </div>

                            {/* 90+ Days */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    90+ Days Target
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="text-gray-500 sm:text-sm">$</span>
                                    </div>
                                    <input
                                        type="number"
                                        value={columnTargets?.b90_plus || ''}
                                        onChange={(e) => onColumnTargetsChange('b90_plus', e.target.value)}
                                        className="input-field pl-7"
                                        placeholder="0"
                                        min="0"
                                        step="1"
                                        onWheel={(e) => e.currentTarget.blur()}
                                    />
                                </div>
                                {columnTargets?.b90_plus && (
                                    <p className="text-sm text-gray-600 mt-1">
                                        {formatCurrency(parseFloat(columnTargets.b90_plus) || 0)}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Column Targets Summary */}
                        <div className="bg-white rounded-md p-3 border border-gray-200">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-700">Total Target:</span>
                                <span className="text-lg font-bold text-green-600">
                                    {formatCurrency(
                                        (parseFloat(columnTargets?.b0_30 || 0) +
                                            parseFloat(columnTargets?.b31_60 || 0) +
                                            parseFloat(columnTargets?.b61_90 || 0) +
                                            parseFloat(columnTargets?.b90_plus || 0))
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Carry Threshold */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Carry Forward Threshold
                    </label>
                    <div className="flex items-center space-x-3">
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={carryThreshold}
                            onChange={(e) => onCarryThresholdChange(parseFloat(e.target.value))}
                            className="flex-1"
                        />
                        <span className="text-sm font-medium text-gray-900 w-12">
                            {(carryThreshold * 100).toFixed(0)}%
                        </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        Probability threshold for carrying forward descriptions
                    </p>
                </div>

                {/* Generate Button */}
                <div className="pt-2">
                    <button
                        onClick={onGenerate}
                        disabled={disabled || isGenerating}
                        className={`
              w-full py-3 px-4 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
              ${disabled || isGenerating
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-primary-600 hover:bg-primary-700 text-white focus:ring-primary-500'
                            }
            `}
                    >
                        {isGenerating ? (
                            <div className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Generating Predictions...
                            </div>
                        ) : (
                            <div className="flex items-center justify-center">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                Generate Predictions
                            </div>
                        )}
                    </button>

                    {disabled && (
                        <p className="text-sm text-gray-500 mt-2 text-center">
                            Please select a client first
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PredictionForm;


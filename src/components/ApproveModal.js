import React, { useState } from 'react';
import useApi from '../hooks/useApi';

const ApproveModal = ({ predictions, clientId, targetMonth, modelVersion, onClose, onSuccess }) => {
    const [comment, setComment] = useState('');
    const [retrain, setRetrain] = useState(false);
    const [isApproving, setIsApproving] = useState(false);

    const { postWithApiKey } = useApi();

    const handleApprove = async () => {
        if (!clientId || !targetMonth || !modelVersion) {
            alert('Missing required information for approval');
            return;
        }

        setIsApproving(true);
        try {
            await postWithApiKey('/api/approve', {
                client_id: clientId,
                target_month: targetMonth,
                predictions: predictions,
                model_version: modelVersion,
                retrain: retrain,
                comment: comment
            });

            onSuccess();
        } catch (error) {
            console.error('Approval failed:', error);
            alert(`Failed to approve predictions: ${error.message}`);
        } finally {
            setIsApproving(false);
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

    const grandTotal = predictions.reduce((sum, pred) => sum + (pred.total || 0), 0);

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Approve Predictions</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                        >
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Summary */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Approval Summary</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-600">Total Predictions:</span>
                                <span className="ml-2 font-medium">{predictions.length}</span>
                            </div>
                            <div>
                                <span className="text-gray-600">Grand Total:</span>
                                <span className="ml-2 font-medium text-primary-600">{formatCurrency(grandTotal)}</span>
                            </div>
                            <div>
                                <span className="text-gray-600">Target Month:</span>
                                <span className="ml-2 font-medium">{targetMonth}</span>
                            </div>
                            <div>
                                <span className="text-gray-600">Model Version:</span>
                                <span className="ml-2 font-medium text-xs">{modelVersion}</span>
                            </div>
                        </div>
                    </div>

                    {/* Comment */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Approval Comment (Optional)
                        </label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="input-field"
                            rows={3}
                            placeholder="Add any notes about this approval..."
                        />
                    </div>

                    {/* Retrain Option */}
                    <div className="mb-6">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={retrain}
                                onChange={(e) => setRetrain(e.target.checked)}
                                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">
                                Retrain model with approved predictions
                            </span>
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                            This will update the model with the new data for future predictions
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={onClose}
                            className="btn-secondary"
                            disabled={isApproving}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleApprove}
                            disabled={isApproving}
                            className="btn-success flex items-center space-x-2"
                        >
                            {isApproving ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Approving...
                                </>
                            ) : (
                                <>
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Approve & Save
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ApproveModal;


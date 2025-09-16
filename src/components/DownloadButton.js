import React, { useState } from 'react';

const DownloadButton = ({ predictions, clientName, targetMonth }) => {
    const [isOpen, setIsOpen] = useState(false);

    const downloadCSV = () => {
        if (predictions.length === 0) return;

        const headers = ['Description', 'Current', '0-30 Days', '31-60 Days', '61-90 Days', '90+ Days', 'Total'];

        // Generate customer rows
        const customerRows = predictions.map(pred => [
            `"${pred.description}"`,
            pred.current || pred['0_30'],
            pred['0_30'],
            pred['31_60'],
            pred['61_90'],
            pred['90_plus'],
            pred.total
        ].join(','));

        // Calculate grand totals
        const totals = predictions.reduce((acc, pred) => ({
            current: acc.current + (pred.current || pred['0_30']),
            '0_30': acc['0_30'] + pred['0_30'],
            '31_60': acc['31_60'] + pred['31_60'],
            '61_90': acc['61_90'] + pred['61_90'],
            '90_plus': acc['90_plus'] + pred['90_plus'],
            total: acc.total + pred.total
        }), {
            current: 0,
            '0_30': 0,
            '31_60': 0,
            '61_90': 0,
            '90_plus': 0,
            total: 0
        });

        // Add grand totals row
        const grandTotalRow = [
            'Total',
            totals.current,
            totals['0_30'],
            totals['31_60'],
            totals['61_90'],
            totals['90_plus'],
            totals.total
        ].join(',');

        const csvContent = [
            headers.join(','),
            ...customerRows,
            grandTotalRow
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${clientName}_${targetMonth || new Date().toISOString().slice(0, 7)}_AR_Aging.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const downloadExcel = () => {
        // For Excel download, we'll create a simple HTML table that can be opened in Excel
        if (predictions.length === 0) return;

        // Calculate grand totals for Excel
        const totals = predictions.reduce((acc, pred) => ({
            current: acc.current + (pred.current || pred['0_30']),
            '0_30': acc['0_30'] + pred['0_30'],
            '31_60': acc['31_60'] + pred['31_60'],
            '61_90': acc['61_90'] + pred['61_90'],
            '90_plus': acc['90_plus'] + pred['90_plus'],
            total: acc.total + pred.total
        }), {
            current: 0,
            '0_30': 0,
            '31_60': 0,
            '61_90': 0,
            '90_plus': 0,
            total: 0
        });

        const tableContent = `
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Current</th>
            <th>0-30 Days</th>
            <th>31-60 Days</th>
            <th>61-90 Days</th>
            <th>90+ Days</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${predictions.map(pred => `
            <tr>
              <td>${pred.description}</td>
              <td>${pred.current || pred['0_30']}</td>
              <td>${pred['0_30']}</td>
              <td>${pred['31_60']}</td>
              <td>${pred['61_90']}</td>
              <td>${pred['90_plus']}</td>
              <td>${pred.total}</td>
            </tr>
          `).join('')}
          <tr style="font-weight: bold; border-top: 2px solid #000;">
            <td>Total</td>
            <td>${totals.current}</td>
            <td>${totals['0_30']}</td>
            <td>${totals['31_60']}</td>
            <td>${totals['61_90']}</td>
            <td>${totals['90_plus']}</td>
            <td>${totals.total}</td>
          </tr>
        </tbody>
      </table>
    `;

        const blob = new Blob([tableContent], { type: 'application/vnd.ms-excel' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${clientName}_${targetMonth || new Date().toISOString().slice(0, 7)}_AR_Aging.xls`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="btn-secondary flex items-center space-x-2"
            >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Download</span>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-10 border border-gray-200">
                    <div className="py-1">
                        <button
                            onClick={() => {
                                downloadCSV();
                                setIsOpen(false);
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                        >
                            <div className="flex items-center">
                                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Download as CSV
                            </div>
                        </button>
                        <button
                            onClick={() => {
                                downloadExcel();
                                setIsOpen(false);
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                        >
                            <div className="flex items-center">
                                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Download as Excel
                            </div>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DownloadButton;


import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const MonthComparisonChart = ({ currentMonthData, previousMonthData, monthName }) => {
    // Create a map of descriptions to their aging values for easy lookup
    const createDescriptionMap = (monthData, agingField) => {
        const map = new Map();
        monthData.records.forEach(record => {
            map.set(record.description, record.aging[agingField] || 0);
        });
        return map;
    };

    // Define aging categories
    const agingCategories = [
        { key: 'current', label: 'Current', color: '#10B981' },
        { key: '0_30', label: '0-30 Days', color: '#3B82F6' },
        { key: '31_60', label: '31-60 Days', color: '#F59E0B' },
        { key: '61_90', label: '61-90 Days', color: '#EF4444' },
        { key: '90_plus', label: '90+ Days', color: '#8B5CF6' }
    ];

    // Create chart data for each aging category with proper aging logic
    const createChartData = (agingKey) => {
        const currentMap = createDescriptionMap(currentMonthData, agingKey);

        // Apply aging logic to get the correct previous month bucket for comparison
        let previousAgingKey = agingKey;
        if (agingKey === '31_60') {
            previousAgingKey = '0_30'; // Previous month's 0-30 becomes current month's 31-60
        } else if (agingKey === '61_90') {
            previousAgingKey = '31_60'; // Previous month's 31-60 becomes current month's 61-90
        } else if (agingKey === '90_plus') {
            // For 90+, we need to combine previous month's 61-90 + 90+
            const previousMap61_90 = previousMonthData ? createDescriptionMap(previousMonthData, '61_90') : new Map();
            const previousMap90_plus = previousMonthData ? createDescriptionMap(previousMonthData, '90_plus') : new Map();

            // Get all unique descriptions from both months
            const allDescriptions = new Set([...currentMap.keys(), ...previousMap61_90.keys(), ...previousMap90_plus.keys()]);

            const chartData = [];
            allDescriptions.forEach(description => {
                const currentValue = currentMap.get(description) || 0;
                const previous61_90 = previousMap61_90.get(description) || 0;
                const previous90_plus = previousMap90_plus.get(description) || 0;
                const previousValue = previous61_90 + previous90_plus; // Combined aging

                chartData.push({
                    name: description,
                    current: currentValue,
                    previous: previousValue
                });
            });

            // Sort by current month value (descending) to show largest values first
            chartData.sort((a, b) => b.current - a.current);

            return chartData;
        }

        const previousMap = previousMonthData ? createDescriptionMap(previousMonthData, previousAgingKey) : new Map();

        // Get all unique descriptions from both months
        const allDescriptions = new Set([...currentMap.keys(), ...previousMap.keys()]);

        const chartData = [];
        allDescriptions.forEach(description => {
            const currentValue = currentMap.get(description) || 0;
            const previousValue = previousMap.get(description) || 0;

            chartData.push({
                name: description,
                current: currentValue,
                previous: previousValue
            });
        });

        // Sort by current month value (descending) to show largest values first
        chartData.sort((a, b) => b.current - a.current);

        return chartData;
    };

    // Custom tooltip formatter
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const dataPoint = payload[0].payload;
            return (
                <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                    <p className="font-medium text-gray-900 mb-2">{dataPoint.name}</p>
                    {payload.map((entry, index) => (
                        <p key={index} className={`text-sm`}>
                            {entry.name}: {formatCurrency(entry.value)}
                        </p>
                    ))}
                    <p className="text-xs text-gray-500 mt-1 italic">
                        *Previous month values show aged receivables
                    </p>
                </div>
            );
        }
        return null;
    };

    // Individual chart component
    const IndividualChart = ({ category, chartData }) => (
        <div className="bg-white rounded-lg border border-gray-200 p-3">
            <h5 className="text-sm font-medium text-gray-900 mb-2 text-center">
                {category.label}
            </h5>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={chartData}
                        margin={{
                            top: 10,
                            right: 10,
                            left: 10,
                            bottom: 10,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis
                            dataKey="name"
                            tick={false}
                            stroke="#6B7280"
                            axisLine={false}
                        />
                        <YAxis
                            tick={{ fontSize: 10 }}
                            stroke="#6B7280"
                            tickFormatter={formatCurrency}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Line
                            type="monotone"
                            dataKey="current"
                            stroke={category.color}
                            strokeWidth={2}
                            dot={{ fill: category.color, strokeWidth: 2, r: 3 }}
                            name="Current"
                            activeDot={{ r: 5 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="previous"
                            stroke="#6B7280"
                            strokeWidth={2}
                            dot={{ fill: '#6B7280', strokeWidth: 2, r: 3 }}
                            name="Previous"
                            activeDot={{ r: 5 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );

    return (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
                📊 Aging Categories Comparison: {monthName}
            </h4>
            <p className="text-xs text-gray-600 mb-4">
                Previous month values show aged receivables (0-30→31-60, 31-60→61-90, 61-90+90+→90+)
            </p>
            <div className="grid grid-cols-2 gap-6">
                {agingCategories.map(category => (
                    <IndividualChart
                        key={category.key}
                        category={category}
                        chartData={createChartData(category.key)}
                    />
                ))}
            </div>
        </div>
    );
};

export default MonthComparisonChart;

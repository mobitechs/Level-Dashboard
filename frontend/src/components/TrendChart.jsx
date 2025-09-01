import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const TrendChart = ({ data, title, unit }) => {
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatValue = (value, unit) => {
    if (unit === '%') return `${value}%`;
    if (unit === '$') return `$${value.toLocaleString()}`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
    return value;
  };

  const chartData = data.map(item => ({
    ...item,
    date: formatDate(item.date_value)
  }));

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis tickFormatter={(value) => formatValue(value, unit)} />
          <Tooltip 
            formatter={(value, name) => [formatValue(value, unit), name]}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Legend />
          
          {chartData[0]?.android_value !== null && chartData[0]?.android_value !== undefined && (
            <Line
              type="monotone"
              dataKey="android_value"
              stroke="#10B981"
              strokeWidth={2}
              name="Android"
            />
          )}
          
          {chartData[0]?.ios_value !== null && chartData[0]?.ios_value !== undefined && (
            <Line
              type="monotone"
              dataKey="ios_value"
              stroke="#3B82F6"
              strokeWidth={2}
              name="iOS"
            />
          )}
          
          {chartData[0]?.net_value !== null && chartData[0]?.net_value !== undefined && (
            <Line
              type="monotone"
              dataKey="net_value"
              stroke="#8B5CF6"
              strokeWidth={2}
              name="Total"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TrendChart;
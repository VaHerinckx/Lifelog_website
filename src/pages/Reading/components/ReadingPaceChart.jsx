import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import _ from 'lodash';
import './ReadingPaceChart.css';

const ReadingPaceChart = ({ data, dateRange, selectedPeriod, onPeriodChange }) => {
  const [chartData, setChartData] = useState([]);

  // Function to get period key for grouping
  const getPeriodKey = (dateStr, period) => {
    const date = new Date(dateStr);
    if (!date || isNaN(date.getTime())) return 'Unknown';

    switch (period) {
      case 'yearly':
        return date.getFullYear().toString();
      case 'monthly':
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      case 'daily':
        return date.toISOString().split('T')[0];
      default:
        return date.getFullYear().toString();
    }
  };

  // Function to format period label
  const formatPeriodLabel = (key, period) => {
    if (key === 'Unknown') return key;

    switch (period) {
      case 'yearly':
        return key;
      case 'monthly': {
        const [year, month] = key.split('-');
        return `${new Date(year, parseInt(month) - 1).toLocaleString('default', { month: 'short' })} ${year}`;
      }
      case 'daily': {
        const date = new Date(key);
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      }
      default:
        return key;
    }
  };

  // Generate all possible periods between start and end dates
  const generateAllPeriods = (startDate, endDate, periodType) => {
    const periods = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    let current = new Date(start);

    while (current <= end) {
      switch (periodType) {
        case 'yearly':
          periods.push(current.getFullYear().toString());
          current.setFullYear(current.getFullYear() + 1);
          break;
        case 'monthly':
          periods.push(`${current.getFullYear()}-${(current.getMonth() + 1).toString().padStart(2, '0')}`);
          current.setMonth(current.getMonth() + 1);
          break;
        case 'daily':
          periods.push(current.toISOString().split('T')[0]);
          current.setDate(current.getDate() + 1);
          break;
      }
    }
    return periods;
  };

  // Process data for the chart
  useEffect(() => {
    if (!data || !dateRange.startDate || !dateRange.endDate) return;

    // Filter data based on date range
    const filteredData = data.filter(item => {
      const itemDate = item.timestamp;
      if (!itemDate || !(itemDate instanceof Date) || isNaN(itemDate.getTime())) return false;

      const start = new Date(dateRange.startDate);
      const end = new Date(dateRange.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);

      return itemDate >= start && itemDate <= end;
    });

    // Group by period
    const groupedByPeriod = _.groupBy(filteredData, item =>
      getPeriodKey(item.timestamp, selectedPeriod)
    );

    // Calculate average pages per period
    const allPeriods = generateAllPeriods(dateRange.startDate, dateRange.endDate, selectedPeriod);

    const aggregatedData = allPeriods.map(periodKey => {
      const periodData = groupedByPeriod[periodKey] || [];

      // Calculate total pages and items count for the period
      const totalPages = _.sumBy(periodData, 'page_split');
      const itemsCount = periodData.length;

      // Calculate average pages (avoiding division by zero)
      const avgPages = itemsCount > 0 ? Math.round(totalPages) : 0;

      return {
        period: formatPeriodLabel(periodKey, selectedPeriod),
        avgPages: avgPages,
        itemsCount: itemsCount,
        rawPeriod: periodKey
      };
    });

    setChartData(aggregatedData);
  }, [data, selectedPeriod, dateRange]);

  return (
    <div className="reading-pace-chart-container">
      <div className="chart-header">
        <h2 className="reading-pace-chart__title">
          Reading Pace by Period
        </h2>
        <div className="chart-filter">
          <label htmlFor="period-select">Period:</label>
          <select
            id="period-select"
            value={selectedPeriod}
            onChange={(e) => onPeriodChange(e.target.value)}
            className="filter-select"
          >
            <option value="yearly">Yearly</option>
            <option value="monthly">Monthly</option>
            <option value="daily">Daily</option>
          </select>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData} className="reading-pace-chart__graph">
          <CartesianGrid strokeDasharray="3 3" className="reading-pace-chart__grid" />
          <XAxis
            dataKey="period"
            angle={selectedPeriod === 'monthly' || selectedPeriod === 'daily' ? -45 : 0}
            textAnchor="end"
            height={80}
            className="reading-pace-chart__axis reading-pace-chart__axis--x"
          />
          <YAxis
            tickFormatter={(value) => value.toLocaleString()}
            className="reading-pace-chart__axis reading-pace-chart__axis--y"
          />
          <Tooltip
            formatter={(value) => [`${value.toLocaleString()} pages`, 'Average Pages']}
            className="reading-pace-chart__tooltip"
          />
          <Legend className="reading-pace-chart__legend" />
          <Bar
            dataKey="avgPages"
            name="Average Pages"
            fill="#EAC435"
            className="reading-pace-chart__bar"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ReadingPaceChart;

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './ReadingPaceChart.css';

const ReadingPaceChart = ({ data, dateRange, selectedPeriod, onPeriodChange }) => {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    // Basic validation with detailed logging

    if (!Array.isArray(data) || data.length === 0) {
      console.log("Empty or invalid data array");
      setChartData([]);
      return;
    }

    // Create a temporary array to hold our data for each period
    const periodSums = {};

    // Process each reading entry directly, just grouping by date period
    data.forEach((entry, index) => {
      // Get timestamp - handle both capitalized and lowercase
      const rawTimestamp = entry.Timestamp || entry.timestamp;

      // Get page count - handle potential variations
      const pageSplit = parseFloat(entry.page_split) || 0;

      // Skip invalid entries
      if (!rawTimestamp || pageSplit === 0) {
        if (index < 5) console.log("Skipping invalid entry:", { rawTimestamp, pageSplit, entry });
        return;
      }

      // Parse date ensuring proper handling
      const date = rawTimestamp instanceof Date
        ? rawTimestamp
        : new Date(rawTimestamp);

      // Skip invalid dates
      if (isNaN(date.getTime())) {
        if (index < 5) console.log("Invalid date:", rawTimestamp);
        return;
      }

      if (index < 5) console.log(`Processing entry ${index}:`, {
        date: date.toISOString(),
        pages: pageSplit
      });

      // Determine period key based on selected period
      let periodKey;

      if (selectedPeriod === 'yearly') {
        periodKey = date.getFullYear().toString();
      }
      else if (selectedPeriod === 'monthly') {
        periodKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      }
      else { // Daily
        periodKey = date.toISOString().split('T')[0];
      }

      // Initialize period if it doesn't exist
      if (!periodSums[periodKey]) {
        let displayLabel;

        if (selectedPeriod === 'yearly') {
          displayLabel = periodKey; // Just use the year
        }
        else if (selectedPeriod === 'monthly') {
          // Format month name and year
          const monthDate = new Date(date.getFullYear(), date.getMonth(), 1);
          displayLabel = monthDate.toLocaleString('default', { month: 'short', year: 'numeric' });
        }
        else { // Daily
          displayLabel = date.toLocaleDateString();
        }

        periodSums[periodKey] = {
          period: displayLabel,
          totalPages: 0,
          sortKey: periodKey
        };
      }

      // Add this entry's page_split to the running sum
      periodSums[periodKey].totalPages += pageSplit;
    });

    // Log the aggregated data
    console.log("Period sums:", periodSums);

    // Convert to array, round values, and sort by date
    const chartDataArray = Object.values(periodSums).map(item => ({
      period: item.period,
      value: Math.round(item.totalPages),
      sortKey: item.sortKey
    }));

    // Sort chronologically
    chartDataArray.sort((a, b) => a.sortKey.localeCompare(b.sortKey));

    console.log("Final chart data:", chartDataArray);

    setChartData(chartDataArray);
  }, [data, selectedPeriod, dateRange]);

  return (
    <div className="reading-pace-chart-container">
      <div className="chart-header">
        <h2 className="reading-pace-chart__title">
          Total Pages Read by {selectedPeriod === 'yearly' ? 'Year' : selectedPeriod === 'monthly' ? 'Month' : 'Day'}
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

      {chartData.length === 0 ? (
        <div className="no-chart-data">
          <p>No reading data available for the selected period.</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="period"
              angle={selectedPeriod === 'monthly' || selectedPeriod === 'daily' ? -45 : 0}
              textAnchor="end"
              height={80}
              interval={selectedPeriod === 'daily' ? 6 : 0} // Skip some labels for daily view
            />
            <YAxis
              label={{ value: 'Pages', angle: -90, position: 'insideLeft' }}
              tickFormatter={(val) => val.toLocaleString()}
            />
            <Tooltip
              formatter={(value) => [value.toLocaleString(), 'Pages']}
            />
            <Legend />
            <Bar dataKey="value" name="Pages Read" fill="#EAC435" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default ReadingPaceChart;

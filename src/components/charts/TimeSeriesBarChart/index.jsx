import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './TimeSeriesBarChart.css';

/**
 * A reusable component for displaying time series data as a bar chart
 *
 * @param {Object} props
 * @param {Array} props.data - The dataset to visualize
 * @param {string} props.dateColumnName - The name of the date column in the data
 * @param {string} props.metricColumnName - The field to aggregate and display on the y-axis
 * @param {string} props.title - The chart title
 * @param {string} [props.yAxisLabel] - Label for the y-axis (optional)
 */
const TimeSeriesBarChart = ({
  data,
  dateColumnName,
  metricColumnName,
  title,
  yAxisLabel = ''
}) => {
  // State for period selection
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  // State for chart data
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    // Basic validation
    if (!Array.isArray(data) || data.length === 0) {
      setChartData([]);
      return;
    }

    // Create a temporary object to hold our data for each period
    const periodSums = {};

    // Track min and max dates from valid entries
    let minDate = null;
    let maxDate = null;

    // Process each data entry, grouping by date period
    data.forEach((entry, index) => {
      // Get timestamp value from the specified column
      const rawTimestamp = entry[dateColumnName];

      // Get metric value - handle potential variations
      const metricValue = parseFloat(entry[metricColumnName]) || 0;

      // Skip invalid entries
      if (!rawTimestamp || metricValue === 0) {
        return;
      }

      // Parse date ensuring proper handling
      const date = rawTimestamp instanceof Date
        ? rawTimestamp
        : new Date(rawTimestamp);

      // Skip invalid dates
      if (isNaN(date.getTime())) {
        return;
      }

      // Update min and max dates
      if (!minDate || date < minDate) minDate = new Date(date);
      if (!maxDate || date > maxDate) maxDate = new Date(date);

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
          value: 0,
          sortKey: periodKey
        };
      }

      // Add this entry's metric value to the running sum
      periodSums[periodKey].value += metricValue;
    });

    // If we have valid min and max dates, generate a complete sequence of periods
    if (minDate && maxDate) {
      // Helper function to generate period key and display label
      const generatePeriodInfo = (date) => {
        let periodKey, displayLabel;

        if (selectedPeriod === 'yearly') {
          periodKey = date.getFullYear().toString();
          displayLabel = periodKey;
        }
        else if (selectedPeriod === 'monthly') {
          periodKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
          displayLabel = new Date(date.getFullYear(), date.getMonth(), 1)
            .toLocaleString('default', { month: 'short', year: 'numeric' });
        }
        else { // Daily
          periodKey = date.toISOString().split('T')[0];
          displayLabel = date.toLocaleDateString();
        }

        return { periodKey, displayLabel };
      };

      // Fill in missing periods with zero values
      const currentDate = new Date(minDate);

      // Adjust currentDate to the start of its period
      if (selectedPeriod === 'yearly') {
        currentDate.setMonth(0, 1);
        currentDate.setHours(0, 0, 0, 0);
      }
      else if (selectedPeriod === 'monthly') {
        currentDate.setDate(1);
        currentDate.setHours(0, 0, 0, 0);
      }
      else { // Daily
        currentDate.setHours(0, 0, 0, 0);
      }

      while (currentDate <= maxDate) {
        const { periodKey, displayLabel } = generatePeriodInfo(currentDate);

        // If this period doesn't exist in our data, add it with zero metric value
        if (!periodSums[periodKey]) {
          periodSums[periodKey] = {
            period: displayLabel,
            value: 0,
            sortKey: periodKey
          };
        }

        // Move to next period
        if (selectedPeriod === 'yearly') {
          currentDate.setFullYear(currentDate.getFullYear() + 1);
        }
        else if (selectedPeriod === 'monthly') {
          currentDate.setMonth(currentDate.getMonth() + 1);
        }
        else { // Daily
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
    }

    // Convert to array, round values, and sort by date
    const chartDataArray = Object.values(periodSums).map(item => ({
      period: item.period,
      value: Math.round(item.value),
      sortKey: item.sortKey
    }));

    // Sort chronologically
    chartDataArray.sort((a, b) => a.sortKey.localeCompare(b.sortKey));

    setChartData(chartDataArray);
  }, [data, dateColumnName, metricColumnName, selectedPeriod]);

  return (
    <div className="time-series-chart-container">
      <div className="chart-header">
        <h2 className="time-series-chart__title">{title}</h2>
        <div className="chart-filter">
          <label htmlFor="period-select">Period:</label>
          <select
            id="period-select"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
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
          <p>No data available for the selected period.</p>
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
              interval={selectedPeriod === 'daily' ? 6 : (selectedPeriod === 'monthly' ? 1 : 0)} // Skip some labels for daily/monthly view
            />
            <YAxis
              label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }}
              tickFormatter={(val) => val.toLocaleString()}
            />
            <Tooltip
              formatter={(value) => [value.toLocaleString(), yAxisLabel || 'Value']}
            />
            <Legend />
            <Bar dataKey="value" name={yAxisLabel || 'Value'} className="time-series-chart__bar" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default TimeSeriesBarChart;

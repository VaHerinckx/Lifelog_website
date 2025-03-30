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

    // Create a temporary object to hold our data for each period
    const periodSums = {};

    // Track min and max dates from valid entries
    let minDate = null;
    let maxDate = null;

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
          totalPages: 0,
          sortKey: periodKey
        };
      }

      // Add this entry's page_split to the running sum
      periodSums[periodKey].totalPages += pageSplit;
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

        // If this period doesn't exist in our data, add it with zero pages
        if (!periodSums[periodKey]) {
          periodSums[periodKey] = {
            period: displayLabel,
            totalPages: 0,
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

    // Log the aggregated data
    console.log("Period sums with zeros:", periodSums);

    // Convert to array, round values, and sort by date
    const chartDataArray = Object.values(periodSums).map(item => ({
      period: item.period,
      value: Math.round(item.totalPages),
      sortKey: item.sortKey
    }));

    // Sort chronologically
    chartDataArray.sort((a, b) => a.sortKey.localeCompare(b.sortKey));

    console.log("Final chart data with zeros:", chartDataArray);

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
              interval={selectedPeriod === 'daily' ? 6 : (selectedPeriod === 'monthly' ? 1 : 0)} // Skip some labels for daily/monthly view
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

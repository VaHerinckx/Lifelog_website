import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './TimeSeriesBarChart.css';

// Format number with optional decimal places
const formatNumber = (num, decimals = 0) => {
  if (decimals > 0) {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(num);
  }
  return new Intl.NumberFormat().format(Math.round(num));
};

/**
 * A reusable component for displaying time series data as a bar chart
 *
 * @param {Object} props
 * @param {Array} props.data - The dataset to visualize
 * @param {string} props.dateColumnName - The name of the date column in the data
 * @param {string} props.metricColumnName - (Optional if metricOptions provided) The field to aggregate
 * @param {string} props.title - The chart title
 * @param {string} [props.yAxisLabel] - (Optional if metricOptions provided) Label for the y-axis
 * @param {Array} [props.metricOptions] - Array of metric configuration objects for advanced usage
 * @param {string} [props.defaultMetric] - Default selected metric value
 */
const TimeSeriesBarChart = ({
  data,
  dateColumnName,
  metricColumnName,
  title,
  yAxisLabel = '',
  metricOptions = [],
  defaultMetric
}) => {
  // State for period selection
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  // State for metric selection
  const [selectedMetric, setSelectedMetric] = useState(defaultMetric || metricOptions[0]?.value);
  // State for chart data
  const [chartData, setChartData] = useState([]);

  // Determine if using simple or advanced API
  const useSimpleAPI = metricOptions.length === 0;
  const currentMetricConfig = metricOptions.find(m => m.value === selectedMetric);

  useEffect(() => {
    // Basic validation
    if (!Array.isArray(data) || data.length === 0) {
      setChartData([]);
      return;
    }

    // Determine aggregation type and field BEFORE the loop
    let aggregationType, metricField;
    if (useSimpleAPI) {
      // Simple API: Backward compatibility
      if (metricColumnName === 'id' || metricColumnName === 'movie_id' || metricColumnName === 'count') {
        aggregationType = 'count';
        metricField = null;
      } else {
        aggregationType = 'sum';
        metricField = metricColumnName;
      }
    } else {
      // Advanced API: Use metric config
      aggregationType = currentMetricConfig?.aggregation || 'count';
      metricField = currentMetricConfig?.field;
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

      // Skip invalid timestamps
      if (!rawTimestamp || rawTimestamp === null) {
        return;
      }

      // Parse date ensuring proper handling
      const date = rawTimestamp instanceof Date
        ? rawTimestamp
        : new Date(rawTimestamp);

      // Skip invalid dates (null dates become Invalid Date)
      if (!date || date === null || isNaN(date.getTime())) {
        return;
      }

      // Get metric value based on aggregation type
      let metricValue;
      if (aggregationType === 'count') {
        metricValue = 1; // Count each item once
      } else {
        metricValue = parseFloat(entry[metricField]) || 0;
        // Skip entries with invalid values for sum/average
        if (isNaN(metricValue) || metricValue === null || metricValue === undefined) {
          return;
        }
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
          sum: 0,
          count: 0,
          value: 0,
          sortKey: periodKey
        };
      }

      // Add this entry's metric value based on aggregation type
      if (aggregationType === 'count') {
        periodSums[periodKey].count += 1;
      } else if (aggregationType === 'sum') {
        periodSums[periodKey].sum += metricValue;
      } else if (aggregationType === 'average') {
        periodSums[periodKey].sum += metricValue;
        periodSums[periodKey].count += 1;
      }
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
            sum: 0,
            count: 0,
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

    // Convert to array and calculate final values based on aggregation type
    const chartDataArray = Object.values(periodSums).map(item => {
      let finalValue;

      if (aggregationType === 'count') {
        finalValue = item.count;
      } else if (aggregationType === 'average') {
        finalValue = item.count > 0 ? item.sum / item.count : 0;
      } else { // sum
        finalValue = item.sum;
      }

      // Get decimal places from config
      const decimals = useSimpleAPI ? 0 : (currentMetricConfig?.decimals || 0);

      return {
        period: item.period,
        value: decimals > 0 ? finalValue : Math.round(finalValue),
        sortKey: item.sortKey
      };
    });

    // Sort chronologically
    chartDataArray.sort((a, b) => a.sortKey.localeCompare(b.sortKey));

    setChartData(chartDataArray);
  }, [data, dateColumnName, metricColumnName, selectedPeriod, selectedMetric, useSimpleAPI, currentMetricConfig]);

  // Helper function to get Y-axis label
  const getYAxisLabel = () => {
    if (useSimpleAPI) return yAxisLabel || 'Value';
    if (!currentMetricConfig) return 'Value';

    const suffix = currentMetricConfig.suffix || '';
    if (currentMetricConfig.aggregation === 'average') {
      return `Avg ${suffix}`.trim();
    }
    return currentMetricConfig.label || 'Value';
  };

  // Helper function to format Y-axis values
  const formatYAxisValue = (value) => {
    const decimals = useSimpleAPI ? 0 : (currentMetricConfig?.decimals || 0);
    return formatNumber(value, decimals);
  };

  // Helper function to calculate X-axis label interval
  const getXAxisInterval = () => {
    const dataLength = chartData.length;

    // Target: show ~15-20 labels maximum on X-axis
    if (dataLength <= 15) {
      return 0; // Show all labels
    } else if (dataLength <= 30) {
      return 1; // Show every other label
    } else if (dataLength <= 60) {
      return 2; // Show every 3rd label
    } else if (dataLength <= 120) {
      return 5; // Show every 6th label
    } else {
      return Math.floor(dataLength / 15); // Show ~15 labels total
    }
  };

  return (
    <div className="time-series-chart-container">
      <div className="chart-header">
        <h2 className="time-series-chart__title">{title}</h2>

        <div className="chart-controls">
          {/* Period Selector */}
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

          {/* Metric Selector - Only show if metricOptions provided */}
          {metricOptions.length > 1 && (
            <div className="chart-filter">
              <label htmlFor="metric-select">Show:</label>
              <select
                id="metric-select"
                className="filter-select"
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
              >
                {metricOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="no-chart-data">
          <p>No data available for the selected period.</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="period"
              angle={selectedPeriod === 'monthly' || selectedPeriod === 'daily' ? -45 : 0}
              textAnchor="end"
              height={80}
              interval={getXAxisInterval()}
            />
            <YAxis
              tickFormatter={formatYAxisValue}
            />
            <Tooltip
              formatter={(value) => [formatYAxisValue(value), getYAxisLabel()]}
            />
            <Legend />
            <Bar dataKey="value" name={getYAxisLabel()} className="time-series-chart__bar" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

TimeSeriesBarChart.propTypes = {
  data: PropTypes.array.isRequired,
  dateColumnName: PropTypes.string.isRequired,

  // Simple API props
  metricColumnName: PropTypes.string,
  yAxisLabel: PropTypes.string,

  // Advanced API props
  metricOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      aggregation: PropTypes.oneOf(['count', 'sum', 'average']).isRequired,
      field: PropTypes.string,
      suffix: PropTypes.string,
      decimals: PropTypes.number
    })
  ),
  defaultMetric: PropTypes.string,

  title: PropTypes.string
};

export default TimeSeriesBarChart;

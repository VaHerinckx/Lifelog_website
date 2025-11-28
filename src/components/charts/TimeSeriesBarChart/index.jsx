import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { performComputation, formatComputedValue } from '../../../utils/computationUtils';
import { parseDate } from '../../../utils/dateUtils';
import './TimeSeriesBarChart.css';

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

    // Determine aggregation type and field
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

    // Helper function to get the start of the week (Monday) for a given date
    const getWeekStart = (date) => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
      return new Date(d.setDate(diff));
    };

    // Helper function to generate period key
    const generatePeriodKey = (date) => {
      if (selectedPeriod === 'yearly') {
        return date.getFullYear().toString();
      } else if (selectedPeriod === 'monthly') {
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      } else if (selectedPeriod === 'weekly') {
        const weekStart = getWeekStart(date);
        return weekStart.toISOString().split('T')[0];
      } else { // Daily
        return date.toISOString().split('T')[0];
      }
    };

    // Helper function to generate display label
    const generateDisplayLabel = (date) => {
      if (selectedPeriod === 'yearly') {
        return date.getFullYear().toString();
      } else if (selectedPeriod === 'monthly') {
        const monthDate = new Date(date.getFullYear(), date.getMonth(), 1);
        return monthDate.toLocaleString('default', { month: 'short', year: 'numeric' });
      } else if (selectedPeriod === 'weekly') {
        const weekStart = getWeekStart(date);
        return weekStart.toLocaleDateString();
      } else { // Daily
        return date.toLocaleDateString();
      }
    };

    // Step 1: Group data by period
    const periodGroups = {};
    let minDate = null;
    let maxDate = null;

    data.forEach((entry) => {
      // Parse date
      const date = parseDate(entry[dateColumnName]);
      if (!date) return;

      // Update min and max dates
      if (!minDate || date < minDate) minDate = new Date(date);
      if (!maxDate || date > maxDate) maxDate = new Date(date);

      // Generate period key
      const periodKey = generatePeriodKey(date);

      // Initialize period group if it doesn't exist
      if (!periodGroups[periodKey]) {
        periodGroups[periodKey] = {
          data: [],
          displayLabel: generateDisplayLabel(date),
          sortKey: periodKey
        };
      }

      // Add entry to this period's data array
      periodGroups[periodKey].data.push(entry);
    });

    // Step 2: Fill in missing periods with zero values (for continuous time series)
    if (minDate && maxDate) {
      const currentDate = new Date(minDate);

      // Adjust currentDate to the start of its period
      if (selectedPeriod === 'yearly') {
        currentDate.setMonth(0, 1);
        currentDate.setHours(0, 0, 0, 0);
      } else if (selectedPeriod === 'monthly') {
        currentDate.setDate(1);
        currentDate.setHours(0, 0, 0, 0);
      } else if (selectedPeriod === 'weekly') {
        const weekStart = getWeekStart(currentDate);
        currentDate.setTime(weekStart.getTime());
        currentDate.setHours(0, 0, 0, 0);
      } else { // Daily
        currentDate.setHours(0, 0, 0, 0);
      }

      while (currentDate <= maxDate) {
        const periodKey = generatePeriodKey(currentDate);

        // If this period doesn't exist in our data, add it with empty data array
        if (!periodGroups[periodKey]) {
          periodGroups[periodKey] = {
            data: [],
            displayLabel: generateDisplayLabel(currentDate),
            sortKey: periodKey
          };
        }

        // Move to next period
        if (selectedPeriod === 'yearly') {
          currentDate.setFullYear(currentDate.getFullYear() + 1);
        } else if (selectedPeriod === 'monthly') {
          currentDate.setMonth(currentDate.getMonth() + 1);
        } else if (selectedPeriod === 'weekly') {
          currentDate.setDate(currentDate.getDate() + 7);
        } else { // Daily
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
    }

    // Step 3: Compute aggregated values for each period using performComputation
    const decimals = useSimpleAPI ? 0 : (currentMetricConfig?.decimals || 0);
    const computationOptions = {
      decimals,
      convertToHours: currentMetricConfig?.convertToHours,
      defaultValue: 0
    };

    // For cumsum, we first compute sum per period, then accumulate
    const baseAggregationType = aggregationType === 'cumsum' ? 'sum' : aggregationType;

    const chartDataArray = Object.values(periodGroups).map(group => {
      // Use performComputation to calculate the aggregated value for this period
      const value = performComputation(
        group.data,
        metricField,
        baseAggregationType,
        computationOptions
      );

      return {
        period: group.displayLabel,
        value,
        sortKey: group.sortKey
      };
    });

    // Sort chronologically
    chartDataArray.sort((a, b) => a.sortKey.localeCompare(b.sortKey));

    // Apply cumulative sum if aggregationType is 'cumsum'
    if (aggregationType === 'cumsum') {
      let runningTotal = 0;
      chartDataArray.forEach(item => {
        runningTotal += item.value;
        item.value = parseFloat(runningTotal.toFixed(decimals));
      });
    }

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
    const prefix = useSimpleAPI ? '' : (currentMetricConfig?.prefix || '');
    const suffix = useSimpleAPI ? '' : (currentMetricConfig?.suffix || '');
    return formatComputedValue(value, { type: 'number', decimals, prefix, suffix });
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
              <option value="weekly">Weekly</option>
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
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="period"
              angle={selectedPeriod === 'monthly' || selectedPeriod === 'weekly' || selectedPeriod === 'daily' ? -45 : 0}
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
      aggregation: PropTypes.oneOf(['count', 'count_distinct', 'sum', 'average', 'median', 'min', 'max', 'mode', 'cumsum']).isRequired,
      field: PropTypes.string,
      suffix: PropTypes.string,
      prefix: PropTypes.string,
      decimals: PropTypes.number,
      convertToHours: PropTypes.bool
    })
  ),
  defaultMetric: PropTypes.string,

  title: PropTypes.string
};

export default TimeSeriesBarChart;

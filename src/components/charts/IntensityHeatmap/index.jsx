// src/components/charts/IntensityHeatmap/index.jsx
import { useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import './IntensityHeatmap.css';

// Fixed time periods - ordered from morning to night, with unknown at the end
const BASE_TIME_PERIODS = {
  MORNING: { start: 6, end: 11, label: 'Morning' },
  AFTERNOON: { start: 12, end: 17, label: 'Afternoon' },
  EVENING: { start: 18, end: 23, label: 'Evening' },
  NIGHT: { start: 0, end: 5, label: 'Night' }
};

// Unknown time period, only included when treatMidnightAsUnknown is true
const UNKNOWN_TIME_PERIOD = {
  UNKNOWN: { label: 'Unknown' } // Special category for 00:00 timestamps (paper books)
};

// Abbreviated day labels - always use short form for consistency
const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Color scale function - kept the same as in original component
const getColor = (value, maxValue) => {
  if (value === 0) return '#D8DCFF';
  const intensity = Math.min((value / maxValue) * 100, 100);
  return `rgba(52, 35, 166, ${intensity / 100})`;
};

/**
 * A reusable intensity heatmap component for visualizing data across days and time periods
 *
 * @param {Object} props
 * @param {Array} props.data - The dataset to visualize
 * @param {string} props.dateColumnName - The name of the date/timestamp column in the data
 * @param {string} props.valueColumnName - The field to analyze and display intensity for (simple API)
 * @param {string} props.aggregationType - How to aggregate values: "sum" | "count" | "count_distinct" | "average" (default: "sum")
 * @param {string} props.title - The chart title
 * @param {boolean} props.treatMidnightAsUnknown - If true, 00:00 timestamps are treated as "Unknown Time" (default: true)
 * @param {Array} props.metricOptions - Array of metric configs for multi-metric mode
 * @param {string} props.metricOptions[].value - Internal identifier for the metric
 * @param {string} props.metricOptions[].label - Display label for the metric
 * @param {string} props.metricOptions[].column - Data column name
 * @param {string} props.metricOptions[].aggregation - Aggregation type: 'sum' | 'count' | 'count_distinct' | 'average'
 * @param {string} props.metricOptions[].unit - Optional unit label (e.g., 'minutes', 'episodes')
 * @param {number} props.metricOptions[].decimals - Optional decimal places for display
 * @param {string} props.defaultMetric - Default selected metric value (for multi-metric mode)
 * @param {string} props.rowAxis - What to display on Y-axis: 'weekday' | 'time_period' (default: 'time_period')
 * @param {string} props.columnAxis - What to display on X-axis: 'weekday' | 'time_period' (default: 'weekday')
 * @param {number} props.decimals - Decimal places for display (simple API only, default: 0)
 * @param {string} props.unit - Unit label for display (simple API only, default: 'minutes')
 * @param {boolean} props.showAxisSwap - Whether to show the axis swap button (default: true)
 */
const IntensityHeatmap = ({
  data,
  dateColumnName,
  valueColumnName,
  aggregationType = 'sum',
  title = "Activity Heatmap",
  treatMidnightAsUnknown = true,
  metricOptions = [],
  defaultMetric,
  rowAxis = 'time_period',
  columnAxis = 'weekday',
  decimals,
  unit = 'minutes',
  showAxisSwap = true
}) => {
  const [heatmapData, setHeatmapData] = useState({});
  const [allMetricsData, setAllMetricsData] = useState({});
  const [maxValue, setMaxValue] = useState(0);
  const [selectedMetric, setSelectedMetric] = useState(defaultMetric || metricOptions[0]?.value);
  const [axesSwapped, setAxesSwapped] = useState(false);

  // Determine if using simple or advanced API
  const useSimpleAPI = !metricOptions || metricOptions.length === 0;
  const currentMetricConfig = metricOptions.find(m => m.value === selectedMetric);

  // Validate axis configuration
  useEffect(() => {
    if (rowAxis === columnAxis) {
      console.warn('IntensityHeatmap: rowAxis and columnAxis cannot be the same. Using defaults (time_period/weekday).');
    }
  }, [rowAxis, columnAxis]);

  // Base axis values (from props, with fallback if same axis specified)
  const baseRowAxis = rowAxis === columnAxis ? 'time_period' : rowAxis;
  const baseColumnAxis = rowAxis === columnAxis ? 'weekday' : columnAxis;

  // Effective axis values (considering swap state)
  const effectiveRowAxis = axesSwapped ? baseColumnAxis : baseRowAxis;
  const effectiveColumnAxis = axesSwapped ? baseRowAxis : baseColumnAxis;

  // Handle axis swap
  const handleAxisSwap = () => {
    setAxesSwapped(prev => !prev);
  };

  // Dynamically determine time periods based on the treatMidnightAsUnknown prop
  const TIME_PERIODS = useMemo(() =>
    treatMidnightAsUnknown
      ? { ...BASE_TIME_PERIODS, ...UNKNOWN_TIME_PERIOD }
      : { ...BASE_TIME_PERIODS },
    [treatMidnightAsUnknown]
  );

  // Determine row and column values based on axis configuration
  // Always use abbreviated labels for consistency (Mon, Tue, etc. and Morning, Afternoon, etc.)
  const rowValues = useMemo(() => {
    if (effectiveRowAxis === 'weekday') {
      return DAYS_SHORT.map((day, idx) => ({ key: idx, label: day }));
    } else {
      return Object.entries(TIME_PERIODS).map(([key, config]) => ({ key, label: config.label }));
    }
  }, [effectiveRowAxis, TIME_PERIODS]);

  const columnValues = useMemo(() => {
    if (effectiveColumnAxis === 'weekday') {
      return DAYS_SHORT.map((day, idx) => ({ key: idx, label: day }));
    } else {
      return Object.entries(TIME_PERIODS).map(([key, config]) => ({ key, label: config.label }));
    }
  }, [effectiveColumnAxis, TIME_PERIODS]);

  // Parse timestamp to get weekday index and time period
  const parseTimestamp = useCallback((rawTimestamp) => {
    let date;

    if (typeof rawTimestamp === 'string') {
      if (rawTimestamp.includes('+00:00')) {
        const utcParts = rawTimestamp.split(/[^0-9]/);
        if (utcParts.length >= 6) {
          date = new Date(
            parseInt(utcParts[0]),
            parseInt(utcParts[1]) - 1,
            parseInt(utcParts[2]),
            parseInt(utcParts[3]),
            parseInt(utcParts[4]),
            parseInt(utcParts[5] || 0)
          );
        } else {
          date = new Date(rawTimestamp);
        }
      } else {
        date = new Date(rawTimestamp);
      }
    } else if (rawTimestamp instanceof Date) {
      date = rawTimestamp;
    } else {
      return null;
    }

    if (!date || isNaN(date.getTime())) return null;

    const hour = date.getHours();
    const minutes = date.getMinutes();
    const day = date.getDay();
    const weekdayIndex = day === 0 ? 6 : day - 1;

    let timePeriod;
    if (treatMidnightAsUnknown && hour === 0 && minutes === 0) {
      timePeriod = 'UNKNOWN';
    } else {
      timePeriod = Object.keys(BASE_TIME_PERIODS).find(p => {
        const { start, end } = BASE_TIME_PERIODS[p];
        return hour >= start && hour <= end;
      });
    }

    if (!timePeriod) return null;

    return { weekdayIndex, timePeriod };
  }, [treatMidnightAsUnknown]);

  // Aggregate data for a single metric configuration
  const aggregateMetric = useCallback((items, columnName, aggType) => {
    const matrix = {};
    const countMatrix = {};
    const distinctSets = {};

    // Initialize matrix based on axis configuration
    rowValues.forEach(row => {
      matrix[row.key] = {};
      countMatrix[row.key] = {};
      distinctSets[row.key] = {};
      columnValues.forEach(col => {
        matrix[row.key][col.key] = 0;
        countMatrix[row.key][col.key] = 0;
        distinctSets[row.key][col.key] = new Set();
      });
    });

    // Process each item
    items.forEach(item => {
      const parsed = parseTimestamp(item[dateColumnName]);
      if (!parsed) return;

      const { weekdayIndex, timePeriod } = parsed;

      // Determine row and column keys based on axis configuration
      const rowKey = effectiveRowAxis === 'weekday' ? weekdayIndex : timePeriod;
      const colKey = effectiveColumnAxis === 'weekday' ? weekdayIndex : timePeriod;

      // Skip if keys don't exist in our matrix (e.g., UNKNOWN when not enabled)
      if (matrix[rowKey] === undefined || matrix[rowKey][colKey] === undefined) return;

      const rawValue = item[columnName];

      if (aggType === 'count') {
        matrix[rowKey][colKey] += 1;
      } else if (aggType === 'count_distinct') {
        distinctSets[rowKey][colKey].add(rawValue);
      } else if (aggType === 'average') {
        const avgValue = parseFloat(rawValue) || 0;
        matrix[rowKey][colKey] += avgValue;
        countMatrix[rowKey][colKey] += 1;
      } else {
        // sum (default)
        const sumValue = parseFloat(rawValue) || 0;
        const normalizedValue = columnName === 'duration' ? sumValue / 60 : sumValue;
        matrix[rowKey][colKey] += normalizedValue;
      }
    });

    // Finalize values
    if (aggType === 'count_distinct') {
      rowValues.forEach(row => {
        columnValues.forEach(col => {
          matrix[row.key][col.key] = distinctSets[row.key][col.key].size;
        });
      });
    } else if (aggType === 'average') {
      rowValues.forEach(row => {
        columnValues.forEach(col => {
          const count = countMatrix[row.key][col.key];
          matrix[row.key][col.key] = count > 0 ? matrix[row.key][col.key] / count : 0;
        });
      });
    }

    return matrix;
  }, [rowValues, columnValues, dateColumnName, effectiveRowAxis, effectiveColumnAxis, parseTimestamp]);

  useEffect(() => {
    if (!Array.isArray(data) || data.length === 0) return;

    try {
      if (useSimpleAPI) {
        // Simple API: use valueColumnName + aggregationType
        const matrix = aggregateMetric(data, valueColumnName, aggregationType);
        const max = Math.max(
          ...Object.values(matrix).flatMap(row => Object.values(row))
        );
        setMaxValue(max);
        setHeatmapData(matrix);
      } else {
        // Advanced API: compute all metrics, display selected one
        const allMetrics = {};
        metricOptions.forEach(opt => {
          allMetrics[opt.value] = aggregateMetric(data, opt.column, opt.aggregation);
        });
        setAllMetricsData(allMetrics);

        // Set current metric data
        const currentMatrix = allMetrics[selectedMetric] || {};
        const max = Math.max(
          ...Object.values(currentMatrix).flatMap(row => Object.values(row)),
          0
        );
        setMaxValue(max);
        setHeatmapData(currentMatrix);
      }
    } catch (error) {
      console.error('Error processing heatmap data:', error);
    }
  }, [data, dateColumnName, valueColumnName, aggregationType, treatMidnightAsUnknown,
      useSimpleAPI, metricOptions, selectedMetric, effectiveRowAxis, effectiveColumnAxis,
      rowValues, columnValues, aggregateMetric]);

  // Update heatmap when selected metric changes (advanced API)
  useEffect(() => {
    if (!useSimpleAPI && allMetricsData[selectedMetric]) {
      const currentMatrix = allMetricsData[selectedMetric];
      const max = Math.max(
        ...Object.values(currentMatrix).flatMap(row => Object.values(row)),
        0
      );
      setMaxValue(max);
      setHeatmapData(currentMatrix);
    }
  }, [selectedMetric, allMetricsData, useSimpleAPI]);

  // Get unit label for display
  const getUnit = () => {
    if (useSimpleAPI) {
      return unit;
    }
    return currentMetricConfig?.unit || '';
  };

  // Format value for display
  const formatValue = (value) => {
    if (useSimpleAPI) {
      if (decimals !== undefined) {
        return value.toFixed(decimals);
      }
      return Math.round(value).toLocaleString();
    }
    if (currentMetricConfig?.decimals !== undefined) {
      return value.toFixed(currentMetricConfig.decimals);
    }
    return Math.round(value).toLocaleString();
  };

  // Generate tooltip content
  const generateTooltip = (rowKey, colKey) => {
    if (useSimpleAPI) {
      const value = heatmapData[rowKey]?.[colKey] || 0;
      return `${formatValue(value)} ${getUnit()}`;
    } else {
      // Show all metrics in tooltip
      return metricOptions.map(opt => {
        const value = allMetricsData[opt.value]?.[rowKey]?.[colKey] || 0;
        const formatted = opt.decimals !== undefined
          ? value.toFixed(opt.decimals)
          : Math.round(value).toLocaleString();
        return `${opt.label}: ${formatted}${opt.unit ? ' ' + opt.unit : ''}`;
      }).join('\n');
    }
  };

  // Calculate grand total
  const grandTotal = useMemo(() => {
    return rowValues.reduce((sum, row) => {
      return sum + columnValues.reduce((colSum, col) => {
        return colSum + (heatmapData[row.key]?.[col.key] || 0);
      }, 0);
    }, 0);
  }, [heatmapData, rowValues, columnValues]);

  // Check if we should show controls (metric selector or axis swap)
  const showControls = showAxisSwap || (!useSimpleAPI && metricOptions.length > 1);

  return (
    <div className="heatmap-container">
      <div className="heatmap-header">
        <h3 className="heatmap-title">{title}</h3>
        {showControls && (
          <div className="heatmap-controls">
            {!useSimpleAPI && metricOptions.length > 1 && (
              <div className="chart-filter">
                <label htmlFor="heatmap-metric-select">Show:</label>
                <select
                  id="heatmap-metric-select"
                  className="filter-select"
                  value={selectedMetric}
                  onChange={(e) => setSelectedMetric(e.target.value)}
                >
                  {metricOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {showAxisSwap && (
              <button
                className="axis-swap-button"
                onClick={handleAxisSwap}
                title="Swap rows and columns"
                aria-label="Swap rows and columns"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M7 16V4M7 4L3 8M7 4l4 4M17 8v12M17 20l4-4M17 20l-4-4" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
      <div className="heatmap-table-container">
        <table className="heatmap-table">
          <thead>
            <tr>
              <th></th>
              {columnValues.map(col => (
                <th key={col.key}>{col.label}</th>
              ))}
              <th className="total-header">Total</th>
            </tr>
          </thead>
          <tbody>
            {rowValues.map(row => {
              const rowTotal = columnValues.reduce((sum, col) => {
                return sum + (heatmapData[row.key]?.[col.key] || 0);
              }, 0);

              return (
                <tr key={row.key}>
                  <td className="day-label">{row.label}</td>
                  {columnValues.map(col => {
                    const value = heatmapData[row.key]?.[col.key] || 0;
                    const displayValue = formatValue(value);
                    return (
                      <td
                        key={`${row.key}-${col.key}`}
                        className="heatmap-cell"
                        style={{
                          backgroundColor: getColor(value, maxValue),
                          color: value > maxValue / 2 ? 'white' : '#171738'
                        }}
                        title={generateTooltip(row.key, col.key)}
                      >
                        {displayValue}
                      </td>
                    );
                  })}
                  <td className="total-cell">
                    {formatValue(rowTotal)}
                    {grandTotal > 0 && (
                      <span className="percentage">
                        {' '}({Math.round((rowTotal / grandTotal) * 100)}%)
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}

            {/* Total row */}
            <tr className="total-row">
              <td className="total-label">Total</td>
              {columnValues.map(col => {
                const columnTotal = rowValues.reduce((sum, row) => {
                  return sum + (heatmapData[row.key]?.[col.key] || 0);
                }, 0);

                return (
                  <td key={`total-${col.key}`} className="total-cell">
                    {formatValue(columnTotal)}
                    {grandTotal > 0 && (
                      <span className="percentage">
                        {' '}({Math.round((columnTotal / grandTotal) * 100)}%)
                      </span>
                    )}
                  </td>
                );
              })}

              {/* Grand total (bottom-right cell) */}
              <td className="grand-total-cell">
                {formatValue(grandTotal)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

IntensityHeatmap.propTypes = {
  data: PropTypes.array.isRequired,
  dateColumnName: PropTypes.string.isRequired,
  valueColumnName: PropTypes.string,
  aggregationType: PropTypes.oneOf(['sum', 'count', 'count_distinct', 'average']),
  title: PropTypes.string,
  treatMidnightAsUnknown: PropTypes.bool,
  metricOptions: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    column: PropTypes.string.isRequired,
    aggregation: PropTypes.oneOf(['sum', 'count', 'count_distinct', 'average']).isRequired,
    unit: PropTypes.string,
    decimals: PropTypes.number
  })),
  defaultMetric: PropTypes.string,
  rowAxis: PropTypes.oneOf(['weekday', 'time_period']),
  columnAxis: PropTypes.oneOf(['weekday', 'time_period']),
  decimals: PropTypes.number,
  unit: PropTypes.string,
  showAxisSwap: PropTypes.bool
};

export default IntensityHeatmap;

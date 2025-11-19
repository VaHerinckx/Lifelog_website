// src/components/charts/TopChart/index.jsx
import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import _ from 'lodash';
import './TopChart.css';

const formatNumber = (num, decimals = 0) => {
  if (decimals > 0) {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(num);
  }
  return new Intl.NumberFormat().format(Math.round(num));
};

const TopChart = ({
  data,
  dimensionOptions = [],
  metricOptions = [],
  defaultDimension,
  defaultMetric,
  title,
  topN = 10
}) => {
  // State for user-selected controls
  const [selectedDimension, setSelectedDimension] = useState(defaultDimension || dimensionOptions[0]?.value);
  const [selectedMetric, setSelectedMetric] = useState(defaultMetric || metricOptions[0]?.value);
  const [topItems, setTopItems] = useState([]);

  // Find current dimension and metric configs
  const currentDimensionConfig = dimensionOptions.find(d => d.value === selectedDimension);
  const currentMetricConfig = metricOptions.find(m => m.value === selectedMetric);

  useEffect(() => {
    if (!Array.isArray(data) || !currentDimensionConfig || !currentMetricConfig) return;

    const dimensionField = currentDimensionConfig.field;
    const metricField = currentMetricConfig.field;
    const metricAggregation = currentMetricConfig.aggregation;
    const labelFields = currentDimensionConfig.labelFields || [dimensionField];

    // Filter out invalid/unknown values
    const filteredData = data.filter(item => {
      const value = item[dimensionField];
      return value && value !== 'Unknown' && value.toString().trim() !== '';
    });

    // Group by dimension field
    const grouped = _(filteredData).groupBy(dimensionField);

    // Calculate metric for each group
    let processedData = grouped.map((items, groupKey) => {
      let metricValue;

      switch (metricAggregation) {
        case 'count':
          metricValue = items.length;
          break;
        case 'sum':
          metricValue = _.sumBy(items, item => {
            const val = parseFloat(item[metricField]);
            return isNaN(val) ? 0 : val;
          });
          break;
        case 'average': {
          const validItems = items.filter(item => {
            const val = parseFloat(item[metricField]);
            return !isNaN(val) && val !== null && val !== undefined;
          });
          if (validItems.length === 0) {
            metricValue = 0;
          } else {
            const sum = _.sumBy(validItems, item => parseFloat(item[metricField]));
            metricValue = sum / validItems.length;
          }
          break;
        }
        default:
          metricValue = items.length;
      }

      // Build display name from label fields
      const displayName = labelFields
        .map(field => items[0]?.[field] || groupKey)
        .filter(val => val && val.toString().trim() !== '')
        .join(' - ');

      return {
        name: groupKey,
        displayName: displayName || groupKey,
        value: metricValue,
        count: items.length
      };
    }).value();

    // Sort by metric value and take top N
    processedData = _(processedData)
      .orderBy(['value'], ['desc'])
      .take(topN)
      .value();

    setTopItems(processedData);
  }, [data, selectedDimension, selectedMetric, currentDimensionConfig, currentMetricConfig, topN]);

  const getMetricLabel = () => {
    if (!currentMetricConfig) return 'plays';

    const suffix = currentMetricConfig.suffix || '';
    const label = currentMetricConfig.label || 'Value';

    if (currentMetricConfig.aggregation === 'count') {
      return 'plays';
    } else if (currentMetricConfig.aggregation === 'average') {
      return `avg ${suffix}`;
    }
    return suffix || label.toLowerCase();
  };

  const CustomBar = (props) => {
    const { x, y, width, height, displayName, value } = props;
    const decimals = currentMetricConfig?.decimals || 0;

    return (
      <g>
        <text
          x={x - 190}
          y={y + height/2}
          dy=".35em"
          textAnchor="start"
          className="chart-label-name"
          title={displayName}
          fontSize="12"
          fontWeight="600"
          fill="var(--color-text-primary)"
        >
          {displayName.length > 30 ? displayName.substring(0, 30) + '...' : displayName}
        </text>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill="var(--chart-primary-color)"
          opacity={0.8}
          rx={4}
        />
        <text
          x={x + width + 5}
          y={y + height/2}
          dy=".35em"
          textAnchor="start"
          className="value-label"
        >
          {formatNumber(value, decimals)} {getMetricLabel()}
        </text>
      </g>
    );
  };

  CustomBar.propTypes = {
    x: PropTypes.number,
    y: PropTypes.number,
    width: PropTypes.number,
    height: PropTypes.number,
    displayName: PropTypes.string,
    value: PropTypes.number
  };

  return (
    <div className="top-categorys-container">
      <div className="chart-header">
        <h3 className="chart-title">{title || 'Top Chart'}</h3>

        <div className="chart-controls">
          {/* Dimension Selector */}
          {dimensionOptions.length > 1 && (
            <div className="chart-filter">
              <label htmlFor="dimension-select">Group by:</label>
              <select
                id="dimension-select"
                className="filter-select"
                value={selectedDimension}
                onChange={(e) => setSelectedDimension(e.target.value)}
              >
                {dimensionOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Metric Selector */}
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

      <div className="top-categorys-chart">
        <ResponsiveContainer width="100%" height={500}>
          <BarChart
            data={topItems}
            layout="vertical"
            margin={{ top: 20, right: 100, bottom: 20, left: 200 }}
          >
            <XAxis
              type="number"
              tickFormatter={(value) => formatNumber(value, currentMetricConfig?.decimals || 0)}
              domain={[0, 'dataMax']}
            />
            <YAxis
              type="category"
              dataKey="name"
              hide
            />
            <Bar
              dataKey="value"
              shape={<CustomBar />}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

TopChart.propTypes = {
  data: PropTypes.array.isRequired,
  dimensionOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      field: PropTypes.string.isRequired,
      labelFields: PropTypes.arrayOf(PropTypes.string)
    })
  ).isRequired,
  metricOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      aggregation: PropTypes.oneOf(['count', 'sum', 'average']).isRequired,
      field: PropTypes.string,
      suffix: PropTypes.string,
      decimals: PropTypes.number
    })
  ).isRequired,
  defaultDimension: PropTypes.string,
  defaultMetric: PropTypes.string,
  title: PropTypes.string,
  topN: PropTypes.number
};

export default TopChart;

// src/components/charts/TopChart/index.jsx
import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { ArrowUp, ArrowDown } from 'lucide-react';
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
  topN = 10,
  // New customization props
  imageField,
  enableTopNControl = false,
  topNOptions = [5, 10, 15, 20],
  enableSortToggle = false,
  scrollable = false,
  barHeight = 40
}) => {
  // State for user-selected controls
  const [selectedDimension, setSelectedDimension] = useState(defaultDimension || dimensionOptions[0]?.value);
  const [selectedMetric, setSelectedMetric] = useState(defaultMetric || metricOptions[0]?.value);
  const [topNValue, setTopNValue] = useState(topN);
  const [sortDirection, setSortDirection] = useState('desc');
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
    const delimiter = currentDimensionConfig.delimiter;

    // Filter out invalid/unknown values
    let filteredData = data.filter(item => {
      const value = item[dimensionField];
      return value && value !== 'Unknown' && value.toString().trim() !== '';
    });

    // If delimiter is specified, expand rows for each delimited value
    if (delimiter) {
      const expandedData = [];
      filteredData.forEach(item => {
        const value = item[dimensionField];
        if (value && typeof value === 'string') {
          const values = value.split(delimiter).map(v => v.trim()).filter(v => v !== '' && v !== 'Unknown');
          values.forEach(val => {
            expandedData.push({
              ...item,
              [dimensionField]: val
            });
          });
        }
      });
      filteredData = expandedData;
    }

    // Group by dimension field
    const grouped = _(filteredData).groupBy(dimensionField);

    // Calculate metric for each group
    let processedData = grouped.map((items, groupKey) => {
      let metricValue;

      switch (metricAggregation) {
        case 'count':
          metricValue = items.length;
          break;
        case 'count_distinct': {
          // Count distinct values of the specified field
          const distinctValues = new Set(
            items
              .map(item => item[metricField])
              .filter(val => val !== null && val !== undefined && val !== '')
          );
          metricValue = distinctValues.size;
          break;
        }
        case 'sum':
        case 'cumsum':
          // cumsum treated as sum for TopChart (ranking doesn't have natural time ordering)
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

      // Get image URL if imageField is provided
      const artwork = imageField ? items[0]?.[imageField] : null;

      return {
        name: groupKey,
        displayName: displayName || groupKey,
        value: metricValue,
        count: items.length,
        artwork: artwork
      };
    }).value();

    // Sort by metric value and take top N
    processedData = _(processedData)
      .orderBy(['value'], [sortDirection])
      .take(topNValue)
      .value();

    setTopItems(processedData);
  }, [data, selectedDimension, selectedMetric, currentDimensionConfig, currentMetricConfig, topNValue, sortDirection]);

  const getMetricLabel = () => {
    if (!currentMetricConfig) return '';

    // Use countLabel if provided (this is the unit displayed next to bar values)
    // Otherwise fall back to suffix
    const countLabel = currentMetricConfig.countLabel || currentMetricConfig.suffix || '';

    return countLabel;
  };

  const getMetricPrefix = () => {
    if (!currentMetricConfig) return '';
    return currentMetricConfig.prefix || '';
  };

  const CustomBar = (props) => {
    const { x, y, width, height, displayName, value, artwork } = props;
    const decimals = currentMetricConfig?.decimals || 0;

    // Only show artwork for "title" dimension (Book Title)
    const showArtwork = artwork && imageField && selectedDimension === 'title';
    const artworkSize = 24;
    const artworkPadding = 8;
    const labelStartX = showArtwork ? x - 190 + artworkSize + artworkPadding : x - 190;

    return (
      <g>
        {/* Render artwork image if available */}
        {showArtwork && (
          <image
            x={x - 190}
            y={y + (height - artworkSize) / 2}
            width={artworkSize}
            height={artworkSize}
            href={artwork}
            className="chart-item-artwork"
            preserveAspectRatio="xMidYMid slice"
          />
        )}

        {/* Item label */}
        <text
          x={labelStartX}
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

        {/* Bar */}
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill="var(--chart-primary-color)"
          opacity={0.8}
          rx={4}
        />

        {/* Value label */}
        <text
          x={x + width + 5}
          y={y + height/2}
          dy=".35em"
          textAnchor="start"
          className="value-label"
        >
          {getMetricPrefix()}{formatNumber(value, decimals)} {getMetricLabel()}
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
    value: PropTypes.number,
    artwork: PropTypes.string
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

          {/* Top N Selector */}
          {enableTopNControl && (
            <div className="chart-filter">
              <label htmlFor="topn-select">Show top:</label>
              <select
                id="topn-select"
                className="filter-select"
                value={topNValue}
                onChange={(e) => setTopNValue(Number(e.target.value))}
              >
                {topNOptions.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Sort Direction Toggle */}
          {enableSortToggle && (
            <button
              className="sort-direction-btn"
              onClick={() => setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc')}
              aria-label={`Sort ${sortDirection === 'asc' ? 'descending' : 'ascending'}`}
              title={sortDirection === 'asc' ? 'Ascending (click for descending)' : 'Descending (click for ascending)'}
            >
              {sortDirection === 'asc' ? <ArrowUp size={18} /> : <ArrowDown size={18} />}
            </button>
          )}
        </div>
      </div>

      {/* Chart content - scrollable or responsive based on prop */}
      {scrollable ? (
        <div
          className="chart-scrollable-container"
          style={{
            height: `calc(${topItems.length * barHeight}px + 40px)`,
            maxHeight: '100%',
            overflowY: 'auto'
          }}
        >
          <ResponsiveContainer width="100%" height={topItems.length * barHeight + 40}>
            <BarChart
              data={topItems}
              layout="vertical"
              margin={{ top: 20, right: 100, bottom: 20, left: 200 }}
              barSize={barHeight - 10}
            >
              <XAxis
                type="number"
                tickFormatter={(value) => formatNumber(value, currentMetricConfig?.decimals || 0)}
                domain={[0, 'dataMax']}
                hide
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
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={topItems}
            layout="vertical"
            margin={{ top: 20, right: 100, bottom: 20, left: 200 }}
          >
            <XAxis
              type="number"
              tickFormatter={(value) => formatNumber(value, currentMetricConfig?.decimals || 0)}
              domain={[0, 'dataMax']}
              hide
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
      )}
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
  // metricOptions: Define how to aggregate data for each metric option
  // - value: Unique identifier for this metric (e.g., 'pages', 'books')
  // - label: Display name shown in dropdown (e.g., 'Total Pages', 'Total Books')
  // - aggregation: How to calculate the metric ('count', 'count_distinct', 'sum', 'average')
  // - field: Which data field to aggregate (required for sum/average/count_distinct)
  // - countLabel: Unit displayed next to bar values (e.g., 'pages', 'books', 'days') - THIS IS THE LABEL ON THE RIGHT
  // - suffix: Alternative to countLabel (e.g., '★' for ratings)
  // - decimals: Number of decimal places to show (default: 0)
  metricOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      aggregation: PropTypes.oneOf(['count', 'count_distinct', 'sum', 'average', 'cumsum']).isRequired,
      field: PropTypes.string,
      prefix: PropTypes.string,
      suffix: PropTypes.string,
      decimals: PropTypes.number,
      countLabel: PropTypes.string
    })
  ).isRequired,
  defaultDimension: PropTypes.string,
  defaultMetric: PropTypes.string,
  title: PropTypes.string,
  topN: PropTypes.number,
  imageField: PropTypes.string,
  enableTopNControl: PropTypes.bool,
  topNOptions: PropTypes.arrayOf(PropTypes.number),
  enableSortToggle: PropTypes.bool,
  scrollable: PropTypes.bool,
  barHeight: PropTypes.number
};

export default TopChart;

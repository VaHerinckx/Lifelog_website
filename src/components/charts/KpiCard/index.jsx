// src/components/charts/KpiCard/index.jsx
import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { performComputation, formatComputedValue, applyMetricFilter } from '../../../utils/computationUtils';
import './KpiCard.css';

/**
 * A reusable KPI card component for displaying key metrics
 * Uses the same metricOptions structure as chart components for consistency
 *
 * @param {Object} props
 * @param {Array} props.data - The dataset to compute from
 * @param {string} props.dataSource - Which data source to use (for KPICardsPanel compatibility)
 * @param {Object} props.metricOptions - Metric configuration (same structure as chart metricOptions)
 * @param {string} props.metricOptions.value - Unique identifier for this metric
 * @param {string} props.metricOptions.label - Display label for the KPI
 * @param {string} props.metricOptions.aggregation - Aggregation type: 'count', 'sum', 'average', 'mode', etc.
 * @param {string} props.metricOptions.field - Data field to aggregate
 * @param {number} [props.metricOptions.decimals] - Decimal places for display
 * @param {string} [props.metricOptions.prefix] - Text before value (e.g., '€')
 * @param {string} [props.metricOptions.suffix] - Text after value (e.g., ' hours')
 * @param {boolean} [props.metricOptions.compactNumbers] - Format large numbers as K/M
 * @param {Array} [props.metricOptions.filterConditions] - Filter conditions array
 * @param {React.ReactNode} [props.icon] - Optional icon to display
 */
const KpiCard = ({
  data,
  dataSource, // eslint-disable-line no-unused-vars -- used by KPICardsPanel to route data
  metricOptions,
  icon
}) => {
  // Extract configuration from metricOptions
  const {
    label = '',
    aggregation = 'count',
    field,
    decimals = 0,
    prefix = '',
    suffix = '',
    compactNumbers = false,
    filterConditions
  } = metricOptions || {};

  // Compute value from data
  const computedValue = useMemo(() => {
    if (!data || !aggregation) {
      console.warn('KpiCard requires data and metricOptions.aggregation props');
      return 0;
    }

    // Apply filterConditions if provided
    const dataToCompute = applyMetricFilter(data, { filterConditions });

    // Perform the computation on filtered data
    const computationOptions = { decimals, defaultValue: 0 };
    const result = performComputation(dataToCompute, field, aggregation, computationOptions);

    return result;
  }, [data, field, aggregation, filterConditions, decimals]);

  // Format large values compactly (K for thousands, M for millions)
  const formatCompactValue = (val) => {
    const absValue = Math.abs(val);

    if (absValue >= 1000000) {
      // Millions
      const millions = val / 1000000;
      return millions % 1 === 0 ? `${millions}M` : `${millions.toFixed(1)}M`;
    } else if (absValue >= 10000) {
      // Thousands (for 5+ digit numbers: 10,000+)
      const thousands = val / 1000;
      return `${Math.round(thousands)}K`;
    }

    return null; // Signal to use regular formatting
  };

  // Format the display value
  const displayValue = useMemo(() => {
    // If already formatted (string), return as-is
    if (typeof computedValue === 'string') {
      return computedValue;
    }

    // If number, apply formatting
    if (typeof computedValue === 'number') {
      // Check for compact formatting first
      if (compactNumbers) {
        const compact = formatCompactValue(computedValue);
        if (compact) {
          return `${prefix}${compact}${suffix}`;
        }
      }

      // Use formatComputedValue for consistent formatting
      return formatComputedValue(computedValue, {
        type: 'number',
        decimals,
        prefix,
        suffix,
        locale: 'en-US'
      });
    }

    return computedValue;
  }, [computedValue, compactNumbers, decimals, prefix, suffix]);

  return (
    <div className="kpi-card">
      {icon && <div className="kpi-card-icon">{icon}</div>}
      <div className="kpi-card-value">{displayValue}</div>
      <div className="kpi-card-label">{label}</div>
    </div>
  );
};

KpiCard.propTypes = {
  data: PropTypes.array,
  dataSource: PropTypes.string,
  metricOptions: PropTypes.shape({
    value: PropTypes.string,
    label: PropTypes.string.isRequired,
    aggregation: PropTypes.oneOf(['count', 'count_distinct', 'sum', 'average', 'median', 'min', 'max', 'mode', 'cumsum']).isRequired,
    field: PropTypes.string,
    decimals: PropTypes.number,
    prefix: PropTypes.string,
    suffix: PropTypes.string,
    compactNumbers: PropTypes.bool,
    filterConditions: PropTypes.arrayOf(PropTypes.shape({
      field: PropTypes.string.isRequired,
      operator: PropTypes.oneOf(['=', '==', '!=', '!==', '>', '>=', '<', '<=']),
      value: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
        PropTypes.bool,
        PropTypes.array
      ]).isRequired
    }))
  }).isRequired,
  icon: PropTypes.node
};

export default KpiCard;

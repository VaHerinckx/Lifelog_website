// src/components/charts/KpiCard/index.jsx
import React, { useMemo } from 'react';
import { performComputation, formatComputedValue } from '../../../utils/computationUtils';
import './KpiCard.css';

/**
 * A reusable KPI card component for displaying key metrics
 *
 * Supports two modes:
 * 1. Legacy mode: Pass pre-computed value directly
 * 2. Smart mode: Pass data + computation config for automatic calculation
 *
 * @param {Object} props
 *
 * LEGACY MODE (backward compatible):
 * @param {string|number} props.value - The main value to display (pre-computed)
 * @param {string} props.label - The descriptive label for the KPI
 * @param {React.ReactNode} [props.icon] - Optional icon to display
 *
 * SMART MODE (new):
 * @param {Array} props.data - The dataset to compute from
 * @param {string} props.dataSource - Which data source to use (e.g., 'readingBooks')
 * @param {string} props.field - The field name to compute on
 * @param {string} props.computation - Type of computation (count, sum, average, etc.)
 * @param {Function} [props.customValue] - Custom function to compute value (bypasses computation)
 * @param {Object} [props.computationOptions] - Additional options for computation
 * @param {Object} [props.formatOptions] - Formatting options for display
 * @param {string} props.label - The descriptive label for the KPI
 * @param {React.ReactNode} [props.icon] - Optional icon to display
 */
const KpiCard = ({
  // Legacy mode props
  value,

  // Smart mode props
  data,
  dataSource,
  field,
  computation,
  customValue,
  computationOptions = {},
  formatOptions = {},

  // Common props
  label,
  icon
}) => {
  // Determine which mode we're in
  const isLegacyMode = value !== undefined;

  // Compute value if in smart mode
  const computedValue = useMemo(() => {
    if (isLegacyMode) {
      return value; // Use pre-computed value
    }

    // Check for custom value function
    if (customValue && typeof customValue === 'function') {
      return customValue();
    }

    // Smart mode: compute from data
    if (!data || !computation) {
      console.warn('KpiCard in smart mode requires data and computation props');
      return 0;
    }

    // Perform the computation
    const result = performComputation(data, field, computation, computationOptions);

    // Format if options provided
    if (formatOptions && Object.keys(formatOptions).length > 0) {
      return formatComputedValue(result, formatOptions);
    }

    return result;
  }, [isLegacyMode, value, customValue, data, field, computation, computationOptions, formatOptions]);

  // Format the display value
  const displayValue = useMemo(() => {
    // If already formatted (string), return as-is
    if (typeof computedValue === 'string') {
      return computedValue;
    }

    // If number and no format options, use default formatting
    if (typeof computedValue === 'number') {
      // Check if it's a decimal that should show one decimal place
      if (computedValue % 1 !== 0 && computedValue < 100) {
        return computedValue.toFixed(1);
      }
      // Otherwise, format with locale
      return computedValue.toLocaleString();
    }

    return computedValue;
  }, [computedValue]);

  return (
    <div className="kpi-card">
      {icon && <div className="kpi-card-icon">{icon}</div>}
      <div className="kpi-card-value">{displayValue}</div>
      <div className="kpi-card-label">{label}</div>
    </div>
  );
};

export default KpiCard;

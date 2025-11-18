/**
 * Computation Utilities for KPI Cards
 *
 * This module provides standardized computation functions for calculating
 * statistics from data arrays. Used by smart KpiCard components.
 */

import _ from 'lodash';

/**
 * Performs a computation on a dataset
 *
 * @param {Array} data - The data array to compute on
 * @param {string} field - The field name to compute (for field-based computations)
 * @param {string} computation - The type of computation to perform
 * @param {Object} options - Additional options for the computation
 * @returns {number|string} The computed value
 */
export const performComputation = (data, field, computation, options = {}) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return options.defaultValue ?? 0;
  }

  switch (computation) {
    case 'count':
      return computeCount(data, options);

    case 'count_distinct':
      return computeCountDistinct(data, field, options);

    case 'sum':
      return computeSum(data, field, options);

    case 'average':
    case 'mean':
      return computeAverage(data, field, options);

    case 'median':
      return computeMedian(data, field, options);

    case 'min':
      return computeMin(data, field, options);

    case 'max':
      return computeMax(data, field, options);

    case 'count_filtered':
      return computeCountFiltered(data, options);

    case 'average_filtered':
      return computeAverageFiltered(data, field, options);

    default:
      console.warn(`Unknown computation type: ${computation}`);
      return options.defaultValue ?? 0;
  }
};

/**
 * Count total items in the dataset
 */
export const computeCount = (data, options = {}) => {
  return data.length;
};

/**
 * Count distinct values of a field
 */
export const computeCountDistinct = (data, field, options = {}) => {
  if (!field) {
    console.warn('computeCountDistinct requires a field parameter');
    return 0;
  }

  const values = data.map(item => _.get(item, field)).filter(v => v !== null && v !== undefined);
  return _.uniq(values).length;
};

/**
 * Sum values of a field
 */
export const computeSum = (data, field, options = {}) => {
  if (!field) {
    console.warn('computeSum requires a field parameter');
    return 0;
  }

  const values = data
    .map(item => {
      const value = _.get(item, field);
      return typeof value === 'number' ? value : parseFloat(value);
    })
    .filter(v => !isNaN(v));

  return _.sum(values);
};

/**
 * Calculate average of a field
 */
export const computeAverage = (data, field, options = {}) => {
  if (!field) {
    console.warn('computeAverage requires a field parameter');
    return 0;
  }

  const { decimals = 1, filterZeros = false } = options;

  let values = data
    .map(item => {
      const value = _.get(item, field);
      return typeof value === 'number' ? value : parseFloat(value);
    })
    .filter(v => !isNaN(v));

  // Optionally filter out zero values
  if (filterZeros) {
    values = values.filter(v => v > 0);
  }

  if (values.length === 0) {
    return options.defaultValue ?? 0;
  }

  const avg = _.mean(values);
  return decimals !== null ? parseFloat(avg.toFixed(decimals)) : avg;
};

/**
 * Calculate median of a field
 */
export const computeMedian = (data, field, options = {}) => {
  if (!field) {
    console.warn('computeMedian requires a field parameter');
    return 0;
  }

  const { decimals = 1 } = options;

  const values = data
    .map(item => {
      const value = _.get(item, field);
      return typeof value === 'number' ? value : parseFloat(value);
    })
    .filter(v => !isNaN(v))
    .sort((a, b) => a - b);

  if (values.length === 0) {
    return options.defaultValue ?? 0;
  }

  const mid = Math.floor(values.length / 2);
  const median = values.length % 2 === 0
    ? (values[mid - 1] + values[mid]) / 2
    : values[mid];

  return decimals !== null ? parseFloat(median.toFixed(decimals)) : median;
};

/**
 * Find minimum value of a field
 */
export const computeMin = (data, field, options = {}) => {
  if (!field) {
    console.warn('computeMin requires a field parameter');
    return 0;
  }

  const values = data
    .map(item => {
      const value = _.get(item, field);
      return typeof value === 'number' ? value : parseFloat(value);
    })
    .filter(v => !isNaN(v));

  if (values.length === 0) {
    return options.defaultValue ?? 0;
  }

  return _.min(values);
};

/**
 * Find maximum value of a field
 */
export const computeMax = (data, field, options = {}) => {
  if (!field) {
    console.warn('computeMax requires a field parameter');
    return 0;
  }

  const values = data
    .map(item => {
      const value = _.get(item, field);
      return typeof value === 'number' ? value : parseFloat(value);
    })
    .filter(v => !isNaN(v));

  if (values.length === 0) {
    return options.defaultValue ?? 0;
  }

  return _.max(values);
};

/**
 * Count items that match a filter condition
 *
 * @param {Array} data - The dataset
 * @param {Object} options - Must contain filterFn function
 */
export const computeCountFiltered = (data, options = {}) => {
  const { filterFn } = options;

  if (!filterFn || typeof filterFn !== 'function') {
    console.warn('computeCountFiltered requires a filterFn in options');
    return 0;
  }

  return data.filter(filterFn).length;
};

/**
 * Calculate average of a field for filtered items
 *
 * @param {Array} data - The dataset
 * @param {string} field - The field to average
 * @param {Object} options - Must contain filterFn function
 */
export const computeAverageFiltered = (data, field, options = {}) => {
  const { filterFn, decimals = 1 } = options;

  if (!filterFn || typeof filterFn !== 'function') {
    console.warn('computeAverageFiltered requires a filterFn in options');
    return 0;
  }

  if (!field) {
    console.warn('computeAverageFiltered requires a field parameter');
    return 0;
  }

  const filteredData = data.filter(filterFn);

  if (filteredData.length === 0) {
    return options.defaultValue ?? 0;
  }

  return computeAverage(filteredData, field, { decimals });
};

/**
 * Format a computed value for display
 *
 * @param {number|string} value - The value to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted value
 */
export const formatComputedValue = (value, options = {}) => {
  const {
    type = 'number',
    decimals = 0,
    locale = 'en-US',
    prefix = '',
    suffix = ''
  } = options;

  let formatted;

  switch (type) {
    case 'number':
      formatted = typeof value === 'number'
        ? value.toLocaleString(locale, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
          })
        : value;
      break;

    case 'currency':
      formatted = typeof value === 'number'
        ? value.toLocaleString(locale, {
            style: 'currency',
            currency: options.currency || 'USD'
          })
        : value;
      break;

    case 'percent':
      formatted = typeof value === 'number'
        ? `${(value * 100).toFixed(decimals)}%`
        : value;
      break;

    default:
      formatted = value;
  }

  return `${prefix}${formatted}${suffix}`;
};

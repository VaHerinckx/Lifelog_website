// src/components/ui/Filters/FilteringPanel/FilteringPanel.jsx
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import _ from 'lodash';
import Filter from '../Filter/Filter';
import { applyFilters, matchDelimitedValue, buildHierarchyWithCounts } from '../../../../utils/filterUtils';
import './FilteringPanel.css';

/**
 * Helper: Check if an item matches a filter value
 * Used for index-based filtering optimization
 */
const itemMatchesFilter = (item, config, filterValue) => {
  const dataField = config.dataField || config.optionsSource;
  if (!dataField) return true;

  const itemValue = dataField.includes('.')
    ? _.get(item, dataField)
    : item[dataField];

  if (config.type === 'multiselect') {
    if (!Array.isArray(filterValue) || filterValue.length === 0) return true;
    if (config.delimiter) {
      return matchDelimitedValue(itemValue, filterValue, config.delimiter, config.matchMode || 'any');
    }
    return filterValue.includes(itemValue);
  }

  if (config.type === 'singleselect') {
    if (!filterValue || filterValue === 'all' || filterValue === config.defaultValue) return true;
    return itemValue === filterValue;
  }

  if (config.type === 'daterange') {
    if (!filterValue || (!filterValue.startDate && !filterValue.endDate)) return true;
    if (!itemValue) return false;
    const itemDate = new Date(itemValue);
    if (isNaN(itemDate.getTime())) return false;
    if (filterValue.startDate && itemDate < new Date(filterValue.startDate)) return false;
    if (filterValue.endDate && itemDate > new Date(filterValue.endDate)) return false;
    return true;
  }

  if (config.type === 'numberrange') {
    if (!filterValue || (filterValue.min === null && filterValue.max === null)) return true;
    if (itemValue === null || itemValue === undefined) return false;
    const numValue = parseFloat(itemValue);
    if (isNaN(numValue)) return false;
    if (filterValue.min !== null && numValue < filterValue.min) return false;
    if (filterValue.max !== null && numValue > filterValue.max) return false;
    return true;
  }

  if (config.type === 'hierarchical') {
    const values = config.selectionMode === 'single' ? [filterValue] : filterValue;
    if (!values || values.length === 0 || values[0] === null) return true;
    const parentValue = item[config.dataField];
    const childValue = item[config.childField];
    return values.some(selected => selected === parentValue || selected === childValue);
  }

  return true;
};

/**
 * A comprehensive filtering panel that manages filters and automatically
 * updates filter options based on data
 *
 * @param {Object} props
 * @param {Array|Object} props.data - The raw data to filter (array for single source, object for multiple sources)
 * @param {React.ReactNode} props.children - Filter components as children
 * @param {string} [props.fullDataset] - Full dataset for date boundary calculation (music data)
 * @param {Function} props.onFiltersChange - Callback when filters change
 * @param {boolean} [props.loading] - Loading state
 */
const FilteringPanel = ({
  data = [],
  fullDataset = '',
  children,
  onFiltersChange,
  loading = false
}) => {
  // Ensure data is never null or undefined
  const safeData = data ?? [];

  // Determine if we're working with multiple data sources
  const isMultiSource = !Array.isArray(safeData) && typeof safeData === 'object' && safeData !== null;

  // For backward compatibility, convert single array to object format
  // Memoize to prevent unnecessary re-renders
  const dataSources = useMemo(() => {
    return isMultiSource ? safeData : { default: safeData };
  }, [isMultiSource, safeData]);

  // Extract filter configs from children
  const filterConfigs = useMemo(() => {
    const configs = [];

    React.Children.forEach(children, (child) => {
      if (!React.isValidElement(child)) return;

      // Extract props from Filter child to build config
      const { type, label, icon, placeholder, searchPlaceholder, searchable, allLabel, defaultValue, delimiter, matchMode, sortType, selectionMode, childField, fieldMap, ...rest } = child.props;

      // Generate a key from the field or label
      const key = rest.field || label?.toLowerCase().replace(/\s+/g, '_') || `filter_${configs.length}`;

      configs.push({
        key,
        type: type || 'singleselect',
        label,
        icon,
        placeholder,
        searchPlaceholder,
        searchable,
        allLabel,
        defaultValue,
        dataField: rest.field,
        childField: childField || null,
        selectionMode: selectionMode || 'multi',
        optionsSource: rest.field,
        dataSources: rest.dataSources,
        options: rest.options,
        delimiter: delimiter || null,
        matchMode: matchMode || 'exact',
        sortType: sortType || 'alpha',
        fieldMap: fieldMap || null  // Per-source field mapping for multi-source filtering
      });
    });

    return configs;
  }, [children]);

  // Get primary data source (memoized)
  const primarySource = useMemo(() => {
    return Object.values(dataSources).find(source => Array.isArray(source) && source.length > 0) || [];
  }, [dataSources]);

  // OPTIMIZATION: Pre-compute unique values and value-to-indices mapping on data load
  // This runs ONCE when data changes, not on every filter change
  const precomputedOptions = useMemo(() => {
    if (primarySource.length === 0) return { cache: {}, dateBoundaries: {}, numberBoundaries: {} };

    const cache = {};
    const dateBoundaries = {};
    const numberBoundaries = {};

    filterConfigs.forEach(config => {
      const fieldName = config.dataField || config.optionsSource;
      if (!fieldName) return;

      if (config.optionsSource === 'static' && config.options) {
        // Static options - just store them
        cache[config.key] = { allValues: config.options, valueToItemIndices: null };
        return;
      }

      if (config.type === 'daterange') {
        // Pre-compute date boundaries from full dataset
        let minDate = null;
        let maxDate = null;
        primarySource.forEach(item => {
          const value = fieldName.includes('.') ? _.get(item, fieldName) : item[fieldName];
          if (value) {
            const date = new Date(value);
            if (!isNaN(date.getTime()) && date.getFullYear() > 1900) {
              if (!minDate || date < minDate) minDate = date;
              if (!maxDate || date > maxDate) maxDate = date;
            }
          }
        });
        if (minDate && maxDate) {
          dateBoundaries[config.key] = { minDate, maxDate };
        }
        return;
      }

      if (config.type === 'numberrange') {
        // Pre-compute number boundaries from full dataset
        let minNum = null;
        let maxNum = null;
        primarySource.forEach(item => {
          const value = fieldName.includes('.') ? _.get(item, fieldName) : item[fieldName];
          if (value !== null && value !== undefined && value !== '') {
            const num = parseFloat(value);
            if (!isNaN(num)) {
              if (minNum === null || num < minNum) minNum = num;
              if (maxNum === null || num > maxNum) maxNum = num;
            }
          }
        });
        if (minNum !== null && maxNum !== null) {
          numberBoundaries[config.key] = { minNumber: minNum, maxNumber: maxNum };
        }
        return;
      }

      if (config.type === 'hierarchical') {
        // For hierarchical, we'll compute on demand (uses buildHierarchyWithCounts)
        return;
      }

      // For multiselect/singleselect: Build unique values + value-to-indices map
      const uniqueSet = new Set();
      const valueToItemIndices = new Map();

      primarySource.forEach((item, index) => {
        const value = fieldName.includes('.') ? _.get(item, fieldName) : item[fieldName];

        if (value && value !== 'Unknown' && value.toString().trim() !== '') {
          if (config.delimiter) {
            // Handle delimited values (e.g., genres: "rock, pop, jazz")
            value.split(config.delimiter).forEach(v => {
              const trimmed = v.trim();
              if (trimmed) {
                uniqueSet.add(trimmed);
                if (!valueToItemIndices.has(trimmed)) valueToItemIndices.set(trimmed, []);
                valueToItemIndices.get(trimmed).push(index);
              }
            });
          } else {
            uniqueSet.add(value);
            if (!valueToItemIndices.has(value)) valueToItemIndices.set(value, []);
            valueToItemIndices.get(value).push(index);
          }
        }
      });

      // Sort allValues based on sortType
      let allValues = Array.from(uniqueSet);
      if (config.sortType === 'numeric') {
        allValues.sort((a, b) => Number(a) - Number(b));
      } else if (config.sortType === 'numericDesc') {
        allValues.sort((a, b) => Number(b) - Number(a));
      } else {
        allValues.sort();
      }

      cache[config.key] = { allValues, valueToItemIndices };
    });

    return { cache, dateBoundaries, numberBoundaries };
  }, [primarySource, filterConfigs]); // Only recompute when DATA changes, not on filter changes

  // Initialize filters state with proper defaults
  const [filters, setFilters] = useState(() => {
    const initialState = {};

    filterConfigs.forEach(config => {
      if (config.type === 'multiselect') {
        // For multiselect, always start with empty array
        initialState[config.key] = [];
      } else if (config.type === 'hierarchical') {
        // For hierarchical, single-select starts with null, multi-select with empty array
        initialState[config.key] = config.selectionMode === 'single' ? null : [];
      } else if (config.type === 'singleselect') {
        // For singleselect, use provided initial value or first option
        initialState[config.key] = config.defaultValue || 'all';
      } else if (config.type === 'daterange') {
        // For daterange, start with no selection
        initialState[config.key] = { startDate: null, endDate: null };
      } else if (config.type === 'numberrange') {
        // For numberrange, start with no selection
        initialState[config.key] = { min: null, max: null };
      }
    });

    return initialState;
  });

  // Debounced filters state for cascading options calculation
  // This prevents expensive recalculation on every filter click
  const [debouncedFilters, setDebouncedFilters] = useState(filters);

  // Debounce filter updates for options calculation (150ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 150);

    return () => clearTimeout(timer);
  }, [filters]);

  // OPTIMIZATION: Compute indices for each "exclude one filter" scenario
  // This allows efficient cascading filter options calculation
  const excludeOneFilterIndices = useMemo(() => {
    if (primarySource.length === 0) return new Map();

    const cache = new Map();

    filterConfigs.forEach(excludeConfig => {
      // Compute which items pass ALL filters EXCEPT this one
      const passingIndices = new Set();

      for (let idx = 0; idx < primarySource.length; idx++) {
        const item = primarySource[idx];
        let passes = true;

        for (const otherConfig of filterConfigs) {
          if (otherConfig.key === excludeConfig.key) continue; // Skip the excluded filter

          const filterValue = debouncedFilters[otherConfig.key];
          if (!itemMatchesFilter(item, otherConfig, filterValue)) {
            passes = false;
            break;
          }
        }

        if (passes) {
          passingIndices.add(idx);
        }
      }

      cache.set(excludeConfig.key, passingIndices);
    });

    return cache;
  }, [primarySource, filterConfigs, debouncedFilters]);

  // OPTIMIZED: Calculate filtered options using precomputed data and exclusion indices
  const filterOptions = useMemo(() => {
    if (primarySource.length === 0) return { options: {}, dateBoundaries: {}, numberBoundaries: {} };

    const options = {};
    // Use precomputed boundaries (static, computed once on data load)
    const dateBoundaries = { ...precomputedOptions.dateBoundaries };
    const numberBoundaries = { ...precomputedOptions.numberBoundaries };

    filterConfigs.forEach(config => {
      // Static options - use as-is
      if (config.optionsSource === 'static' && config.options) {
        options[config.key] = config.options;
        return;
      }

      // Skip daterange and numberrange (boundaries already precomputed)
      if (config.type === 'daterange' || config.type === 'numberrange') {
        return;
      }

      // Hierarchical filters need special handling (compute on demand with filtered data)
      if (config.type === 'hierarchical' && config.childField) {
        const passingIndices = excludeOneFilterIndices.get(config.key) || new Set();
        const filteredData = [];
        passingIndices.forEach(idx => filteredData.push(primarySource[idx]));
        const hierarchyWithCounts = buildHierarchyWithCounts(
          filteredData,
          config.dataField || config.optionsSource,
          config.childField
        );
        options[config.key] = hierarchyWithCounts;
        return;
      }

      // For multiselect/singleselect: Use precomputed values + exclusion indices
      const cached = precomputedOptions.cache[config.key];
      if (!cached || !cached.valueToItemIndices) {
        options[config.key] = cached?.allValues || [];
        return;
      }

      // Get indices that pass all OTHER filters
      const passingIndices = excludeOneFilterIndices.get(config.key);
      if (!passingIndices || passingIndices.size === 0) {
        // No items pass other filters - show empty options
        options[config.key] = [];
        return;
      }

      // If all items pass (no active filters), return all precomputed values
      if (passingIndices.size === primarySource.length) {
        options[config.key] = cached.allValues;
        return;
      }

      // Filter allValues to only those that have at least one item in passingIndices
      const availableValues = cached.allValues.filter(value => {
        const itemIndices = cached.valueToItemIndices.get(value);
        if (!itemIndices) return false;
        // Check if ANY item with this value passes the other filters
        for (const idx of itemIndices) {
          if (passingIndices.has(idx)) return true;
        }
        return false;
      });

      options[config.key] = availableValues;
    });

    return { options, dateBoundaries, numberBoundaries };
  }, [primarySource, filterConfigs, excludeOneFilterIndices, precomputedOptions]);

  // Use refs to store callback and configs to prevent infinite loops
  const onFiltersChangeRef = useRef(onFiltersChange);
  const filterConfigsRef = useRef(filterConfigs);
  const dataSourcesRef = useRef(dataSources);

  useEffect(() => {
    onFiltersChangeRef.current = onFiltersChange;
  }, [onFiltersChange]);

  useEffect(() => {
    filterConfigsRef.current = filterConfigs;
  }, [filterConfigs]);

  useEffect(() => {
    dataSourcesRef.current = dataSources;
  }, [dataSources]);

  // Handle individual filter changes
  const handleFilterChange = (filterKey, newValue) => {
    setFilters(prevFilters => {
      const updatedFilters = {
        ...prevFilters,
        [filterKey]: newValue
      };
      return updatedFilters;
    });
  };

  // Apply filters to all data sources and notify parent
  useEffect(() => {
    if (!onFiltersChangeRef.current) return;

    // Use refs to get current values
    const currentFilterConfigs = filterConfigsRef.current;
    const currentDataSources = dataSourcesRef.current;

    // If single-source mode (backward compatibility), just return filters
    if (!isMultiSource) {
      onFiltersChangeRef.current(filters);
      return;
    }

    // Multi-source mode: apply filters to each data source
    const filteredDataSources = {};

    // Create filter config map for faster lookup
    const filterConfigsMap = currentFilterConfigs.reduce((acc, config) => {
      acc[config.key] = config;
      return acc;
    }, {});

    Object.keys(currentDataSources).forEach(sourceName => {
      const sourceData = currentDataSources[sourceName];
      if (!Array.isArray(sourceData)) return;

      let filtered = [...sourceData];

      // Apply each filter
      Object.keys(filters).forEach(filterKey => {
        const filterValue = filters[filterKey];
        const config = filterConfigsMap[filterKey];

        // Skip if filter doesn't apply to this data source
        if (config?.dataSources && config.dataSources.length > 0) {
          if (!config.dataSources.includes(sourceName)) {
            return; // Skip this filter for this data source
          }
        }

        // Create a source-specific config with resolved field from fieldMap
        const sourceConfig = { ...config };
        if (config.fieldMap && config.fieldMap[sourceName]) {
          sourceConfig.dataField = config.fieldMap[sourceName];
        }

        // Apply filter using utility
        if (filterValue && (Array.isArray(filterValue) ? filterValue.length > 0 : true)) {
          const singleFilterObj = { [filterKey]: filterValue };
          const singleConfigMap = { [filterKey]: sourceConfig };
          filtered = applyFilters(filtered, singleFilterObj, singleConfigMap);
        }
      });

      filteredDataSources[sourceName] = filtered;
    });

    onFiltersChangeRef.current(filteredDataSources, filters);
  }, [filters, isMultiSource]); // Removed filterConfigs and dataSources - using refs instead

  // Loading state
  if (loading) {
    return (
      <div className="filtering-panel loading">
        <div className="filtering-panel-content">
          <div className="filters-grid">
            {[1, 2, 3].map(index => (
              <div key={index} className="filter-skeleton">
                <div className="skeleton-label"></div>
                <div className="skeleton-filter"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="filtering-panel">
      <div className="filtering-panel-content">
        <div className="filters-grid">
          {React.Children.map(children, (child) => {
            if (!React.isValidElement(child)) return null;

            // Find the config for this child
            const childKey = child.props.field || child.props.label?.toLowerCase().replace(/\s+/g, '_');
            const config = filterConfigs.find(c => c.key === childKey);

            if (!config) return null;

            // Use custom options if provided, otherwise use auto-calculated options
            const customOptions = config.options || child.props.options;
            const calculatedOptions = filterOptions.options?.[config.key] || [];

            // For hierarchical filters, calculatedOptions is a Map, not an array
            const availableOptions = config.type === 'hierarchical'
              ? null  // Don't use options for hierarchical
              : (customOptions || calculatedOptions);

            const boundaries = filterOptions.dateBoundaries?.[config.key];
            const numBoundaries = filterOptions.numberBoundaries?.[config.key];
            const currentValue = filters[config.key];

            // For hierarchical filters, check if hierarchy is available
            if (config.type === 'hierarchical' && !calculatedOptions) {
              return null;
            }

            // Note: We no longer hide daterange/numberrange filters when no boundaries exist
            // Instead, we render them with empty/disabled state for UI stability

            // Clone the child and inject the computed props
            const clonedProps = {
              options: availableOptions,
              value: currentValue,
              onChange: (value) => handleFilterChange(config.key, value),
              minDate: boundaries?.minDate,
              maxDate: boundaries?.maxDate,
              minNumber: numBoundaries?.minNumber,
              maxNumber: numBoundaries?.maxNumber,
              suffix: child.props.suffix || ''
            };

            // Add hierarchical-specific props if this is a hierarchical filter
            if (config.type === 'hierarchical') {
              clonedProps.hierarchyWithCounts = calculatedOptions;
              clonedProps.selectionMode = config.selectionMode;
            }

            return (
              <div key={config.key} className="filter-item">
                {React.cloneElement(child, clonedProps)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FilteringPanel;

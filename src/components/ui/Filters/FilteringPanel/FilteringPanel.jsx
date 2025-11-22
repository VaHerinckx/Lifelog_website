// src/components/ui/Filters/FilteringPanel/FilteringPanel.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import _ from 'lodash';
import Papa from 'papaparse';
import Filter from '../Filter/Filter';
import { applyFilters, extractDelimitedUniqueValues, matchDelimitedValue, buildHierarchyWithCounts } from '../../../../utils/filterUtils';
import './FilteringPanel.css';

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
      const { type, label, icon, placeholder, searchPlaceholder, searchable, allLabel, defaultValue, delimiter, matchMode, sortType, selectionMode, childField, ...rest } = child.props;

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
        sortType: sortType || 'alpha'
      });
    });

    return configs;
  }, [children]);

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

  // Calculate filtered options based on current filter selections (bi-directional cascading)
  const filterOptions = useMemo(() => {
    // Get primary data source for option calculation (first non-empty source)
    const primarySource = Object.values(dataSources).find(source => Array.isArray(source) && source.length > 0) || [];

    if (primarySource.length === 0) return {};

    const options = {};
    const dateBoundaries = {};

    filterConfigs.forEach(config => {
      if (config.optionsSource === 'static' && config.options) {
        // Use static options as-is
        options[config.key] = config.options;
      } else if (config.type === 'daterange') {
        // Handle date range boundaries - use full dataset if available for music data
        const fieldName = config.dataField || config.optionsSource;
        
        if (fullDataset && typeof fullDataset === 'string' && fullDataset.length > 0) {
          // Use full dataset to calculate date boundaries
          const allDates = [];
          let processedRows = 0;

          Papa.parse(fullDataset, {
            delimiter: "|",
            header: true,
            skipEmptyLines: true,
            step: (row) => {
              processedRows++;
              const track = row.data;

              // Filter out tracks before 2017
              const trackDate = new Date(track.timestamp);
              if (isNaN(trackDate.getTime()) || trackDate < new Date('2017-01-01')) {
                return; // Skip this track
              }

              // Add listening year for year filter options
              track.listening_year = trackDate.getFullYear().toString();

              const dateValue = track[fieldName];

              if (dateValue) {
                const date = new Date(dateValue);
                if (!isNaN(date.getTime()) && date.getFullYear() > 1900) {
                  allDates.push(date);
                }
              }
            },
            complete: () => {
              if (allDates.length > 0) {
                allDates.sort((a, b) => a - b);
                dateBoundaries[config.key] = {
                  minDate: allDates[0],
                  maxDate: allDates[allDates.length - 1]
                };
              }
            }
          });
        } else {
          // Fallback to display data if full dataset not available
          let filteredData = [...primarySource];

          // Apply all other filters to determine date boundaries
          filterConfigs.forEach(otherConfig => {
            if (otherConfig.key === config.key || otherConfig.type === 'daterange') return;

            const filterValue = debouncedFilters[otherConfig.key];
            const dataField = otherConfig.dataField || otherConfig.optionsSource;

            if (!filterValue || !dataField) return;

            if (otherConfig.type === 'multiselect') {
              if (Array.isArray(filterValue) && filterValue.length > 0) {
                filteredData = filteredData.filter(item => {
                  const itemValue = dataField.includes('.')
                    ? _.get(item, dataField)
                    : item[dataField];

                  // Handle delimited values
                  if (otherConfig.delimiter) {
                    return matchDelimitedValue(itemValue, filterValue, otherConfig.delimiter, otherConfig.matchMode);
                  }

                  // Standard exact match
                  return filterValue.includes(itemValue);
                });
              }
            } else if (otherConfig.type === 'singleselect') {
              if (filterValue && filterValue !== 'all' && filterValue !== otherConfig.defaultValue) {
                filteredData = filteredData.filter(item => {
                  const itemValue = dataField.includes('.')
                    ? _.get(item, dataField)
                    : item[dataField];
                  return itemValue === filterValue;
                });
              }
            }
          });

          // Extract date boundaries from filtered display data
          const allDateValues = filteredData
            .map(item => {
              const value = fieldName.includes('.')
                ? _.get(item, fieldName)
                : item[fieldName];
              return value;
            })
            .filter(Boolean);
          
          const validDates = allDateValues
            .map(value => {
              const date = new Date(value);
              if (!isNaN(date.getTime()) && date.getFullYear() > 1900) {
                return date;
              }
              return null;
            })
            .filter(Boolean)
            .sort((a, b) => a - b);

          if (validDates.length > 0) {
            dateBoundaries[config.key] = {
              minDate: validDates[0],
              maxDate: validDates[validDates.length - 1]
            };
          }
        }

      } else if (config.dataField || config.optionsSource) {
        // For regular filters, apply all OTHER active filters to determine available options
        let filteredData = [...primarySource];

        // Apply all other filters (not the current one we're calculating options for)
        filterConfigs.forEach(otherConfig => {
          if (otherConfig.key === config.key) return; // Skip the current filter

          const filterValue = debouncedFilters[otherConfig.key];
          const dataField = otherConfig.dataField || otherConfig.optionsSource;

          if (!filterValue || !dataField) return;

          if (otherConfig.type === 'multiselect') {
            // Multi-select filter: item must match at least one selected value
            if (Array.isArray(filterValue) && filterValue.length > 0) {
              filteredData = filteredData.filter(item => {
                const itemValue = dataField.includes('.')
                  ? _.get(item, dataField)
                  : item[dataField];

                // Handle delimited values
                if (otherConfig.delimiter) {
                  return matchDelimitedValue(itemValue, filterValue, otherConfig.delimiter, otherConfig.matchMode);
                }

                // Standard exact match
                return filterValue.includes(itemValue);
              });
            }
          } else if (otherConfig.type === 'singleselect') {
            // Single-select filter: exact match (excluding 'all' or default values)
            if (filterValue && filterValue !== 'all' && filterValue !== otherConfig.defaultValue) {
              filteredData = filteredData.filter(item => {
                const itemValue = dataField.includes('.')
                  ? _.get(item, dataField)
                  : item[dataField];
                return itemValue === filterValue;
              });
            }
          } else if (otherConfig.type === 'daterange') {
            // Date range filter: item must be within the selected date range
            if (filterValue && (filterValue.startDate || filterValue.endDate)) {
              filteredData = filteredData.filter(item => {
                const itemValue = dataField.includes('.')
                  ? _.get(item, dataField)
                  : item[dataField];

                if (!itemValue) return false;

                const itemDate = new Date(itemValue);
                if (isNaN(itemDate.getTime())) return false;

                const startDate = filterValue.startDate ? new Date(filterValue.startDate) : null;
                const endDate = filterValue.endDate ? new Date(filterValue.endDate) : null;

                if (startDate && itemDate < startDate) return false;
                if (endDate && itemDate > endDate) return false;

                return true;
              });
            }
          } else if (otherConfig.type === 'hierarchical') {
            // Hierarchical filter: match parent OR child values
            const values = otherConfig.selectionMode === 'single' ? [filterValue] : filterValue;
            if (values && values.length > 0 && values[0] !== null) {
              filteredData = filteredData.filter(item => {
                const parentValue = item[otherConfig.dataField];
                const childValue = item[otherConfig.childField];

                return values.some(selected => {
                  return selected === parentValue || selected === childValue;
                });
              });
            }
          }
        });

        // Extract unique values from the filtered data for the current filter
        const fieldName = config.dataField || config.optionsSource;

        // Special handling for hierarchical filters
        if (config.type === 'hierarchical' && config.childField) {
          // Build hierarchy with counts from filtered data
          const hierarchyWithCounts = buildHierarchyWithCounts(filteredData, fieldName, config.childField);
          options[config.key] = hierarchyWithCounts;
        } else {
          let values;
          if (config.delimiter) {
            // Use delimiter-aware extraction for delimited values
            values = extractDelimitedUniqueValues(filteredData, fieldName, config.delimiter, true);
          } else {
            // Standard unique value extraction
            values = filteredData
              .map(item => {
                const value = fieldName.includes('.')
                  ? _.get(item, fieldName)
                  : item[fieldName];
                return value;
              })
              .filter(value =>
                value &&
                value !== 'Unknown' &&
                value.toString().trim() !== ''
              );

            // Remove duplicates and sort
            values = _.uniq(values);

            // Apply sorting based on sortType
            if (config.sortType === 'numeric') {
              values.sort((a, b) => Number(a) - Number(b));
            } else if (config.sortType === 'numericDesc') {
              values.sort((a, b) => Number(b) - Number(a));
            } else {
              values.sort(); // Default alphabetical sort
            }
          }

          options[config.key] = values;
        }
      }
    });

    return { options, dateBoundaries };
  }, [dataSources, filterConfigs, debouncedFilters, fullDataset]); // Use debounced filters for cascading options

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

        // Apply filter using utility
        if (filterValue && (Array.isArray(filterValue) ? filterValue.length > 0 : true)) {
          const singleFilterObj = { [filterKey]: filterValue };
          const singleConfigMap = { [filterKey]: config };
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
            const currentValue = filters[config.key];

            // Skip rendering if no options available for data-driven filters (except daterange and hierarchical)
            // Don't skip if custom options are provided
            if (config.type !== 'daterange' && config.type !== 'hierarchical' && !customOptions && availableOptions.length === 0 && config.optionsSource !== 'static') {
              return null;
            }

            // For hierarchical filters, check if hierarchy is available
            if (config.type === 'hierarchical' && !calculatedOptions) {
              return null;
            }

            // Note: We no longer hide daterange filters when no boundaries exist
            // Instead, we render them with empty/disabled state for UI stability

            // Clone the child and inject the computed props
            const clonedProps = {
              options: availableOptions,
              value: currentValue,
              onChange: (value) => handleFilterChange(config.key, value),
              minDate: boundaries?.minDate,
              maxDate: boundaries?.maxDate
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

// src/components/ui/Filters/FilteringPanel/FilteringPanel.jsx
import React, { useState, useEffect, useMemo } from 'react';
import _ from 'lodash';
import Filter from '../Filter/Filter';
import './FilteringPanel.css';

/**
 * A comprehensive filtering panel that manages interconnected filters
 * and automatically updates filter options based on current selections
 *
 * @param {Object} props
 * @param {Array} props.data - The raw data to filter
 * @param {Array} props.filterConfigs - Configuration for each filter
 * @param {Object} props.initialFilters - Initial filter values
 * @param {Function} props.onFiltersChange - Callback when filters change
 * @param {string} [props.title] - Optional title for the filter panel
 * @param {string} [props.description] - Optional description
 * @param {boolean} [props.loading] - Loading state
 * @param {boolean} [props.persistFilters] - Whether to persist filters across tabs
 */
const FilteringPanel = ({
  data = [],
  filterConfigs = [],
  initialFilters = {},
  onFiltersChange,
  title,
  description,
  loading = false,
  persistFilters = true
}) => {
  const [filters, setFilters] = useState(initialFilters);

  // Extract unique values from data for filter options
  const extractUniqueValues = useMemo(() => {
    if (!data || data.length === 0) return {};

    const extracted = {};

    filterConfigs.forEach(config => {
      if (config.optionsSource && config.optionsSource !== 'static') {
        // Extract from data using the field mapping
        const fieldName = config.dataField || config.optionsSource;
        let values = [];

        if (fieldName) {
          values = _.uniq(
            data
              .map(item => {
                // Handle nested properties (e.g., 'author.name')
                const value = fieldName.includes('.')
                  ? _.get(item, fieldName)
                  : item[fieldName];
                return value;
              })
              .filter(value => value && value !== 'Unknown' && value.toString().trim() !== '')
          ).sort();
        }

        extracted[config.key] = values;
      } else if (config.options) {
        // Use static options from config
        extracted[config.key] = config.options;
      }
    });

    return extracted;
  }, [data, filterConfigs]);

  // Get filtered options based on current filter selections
  const getFilteredOptions = useMemo(() => {
    return (targetFilterKey) => {
      if (!data || data.length === 0) return [];

      const targetConfig = filterConfigs.find(config => config.key === targetFilterKey);
      if (!targetConfig) return [];

      // If options are static, return them as-is
      if (targetConfig.optionsSource === 'static' || targetConfig.options) {
        return targetConfig.options || [];
      }

      // Start with all data
      let relevantData = [...data];

      // Apply all other active filters to determine available options
      filterConfigs.forEach(config => {
        if (config.key === targetFilterKey) return; // Skip the target filter

        const filterValue = filters[config.key];
        const dataField = config.dataField || config.optionsSource;

        if (!filterValue || !dataField) return;

        if (config.type === 'multiselect') {
          // Multi-select filter
          if (Array.isArray(filterValue) && filterValue.length > 0) {
            relevantData = relevantData.filter(item => {
              const itemValue = dataField.includes('.')
                ? _.get(item, dataField)
                : item[dataField];
              return filterValue.includes(itemValue);
            });
          }
        } else if (config.type === 'singleselect') {
          // Single-select filter
          if (filterValue && filterValue !== 'all') {
            relevantData = relevantData.filter(item => {
              const itemValue = dataField.includes('.')
                ? _.get(item, dataField)
                : item[dataField];
              return itemValue === filterValue;
            });
          }
        }
      });

      // Extract unique values from the filtered data for the target filter
      const targetDataField = targetConfig.dataField || targetConfig.optionsSource;
      const availableOptions = _.uniq(
        relevantData
          .map(item => {
            const value = targetDataField.includes('.')
              ? _.get(item, targetDataField)
              : item[targetDataField];
            return value;
          })
          .filter(value => value && value !== 'Unknown' && value.toString().trim() !== '')
      ).sort();

      return availableOptions;
    };
  }, [data, filterConfigs, filters]);

  // Handle filter changes with smart interconnection logic
  const handleFilterChange = (filterKey, newValue) => {
    setFilters(prevFilters => {
      const newFilters = { ...prevFilters, [filterKey]: newValue };
      const changedConfig = filterConfigs.find(config => config.key === filterKey);

      // Smart interconnection logic
      if (changedConfig) {
        // Clear conflicting selections in other filters
        filterConfigs.forEach(otherConfig => {
          if (otherConfig.key === filterKey) return; // Skip self

          const otherValue = newFilters[otherConfig.key];

          // If this is a single select being set to a specific value
          if (changedConfig.type === 'singleselect' && newValue && newValue !== 'all') {
            // Check if the new value is still available for multi-select filters of the same data type
            if (otherConfig.type === 'multiselect' &&
                otherConfig.optionsSource === changedConfig.optionsSource) {

              // Filter out incompatible selections
              if (Array.isArray(otherValue)) {
                const compatibleOptions = getFilteredOptions(otherConfig.key);
                newFilters[otherConfig.key] = otherValue.filter(val =>
                  compatibleOptions.includes(val)
                );
              }
            }
          }

          // If this is a multi-select being changed
          if (changedConfig.type === 'multiselect' && Array.isArray(newValue)) {
            // Update related single-select filters
            if (otherConfig.type === 'singleselect' &&
                otherConfig.optionsSource === changedConfig.optionsSource) {

              const availableOptions = getFilteredOptions(otherConfig.key);

              // If current single-select value is no longer available, reset it
              if (otherValue && otherValue !== 'all' && !availableOptions.includes(otherValue)) {
                newFilters[otherConfig.key] = availableOptions[0] || otherConfig.defaultValue || 'all';
              }
            }
          }
        });
      }

      return newFilters;
    });
  };

  // Notify parent when filters change
  useEffect(() => {
    if (onFiltersChange) {
      onFiltersChange(filters);
    }
  }, [filters, onFiltersChange]);

  // Initialize filters when data or configs change
  useEffect(() => {
    if (data.length > 0 && filterConfigs.length > 0) {
      const initializedFilters = { ...initialFilters };

      filterConfigs.forEach(config => {
        if (!(config.key in initializedFilters)) {
          if (config.type === 'multiselect') {
            initializedFilters[config.key] = [];
          } else if (config.type === 'singleselect') {
            const availableOptions = extractUniqueValues[config.key] || [];
            initializedFilters[config.key] = config.defaultValue || availableOptions[0] || 'all';
          }
        }
      });

      setFilters(initializedFilters);
    }
  }, [data, filterConfigs, extractUniqueValues, initialFilters]);

  if (loading) {
    return (
      <div className="filtering-panel loading">
        <div className="filtering-panel-header">
          <h3>{title || "Filters"}</h3>
          {description && <p>{description}</p>}
        </div>
        <div className="filtering-panel-content">
          <div className="filters-grid">
            {[1, 2, 3, 4].map(index => (
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
      {(title || description) && (
        <div className="filtering-panel-header">
          {title && <h3 className="filtering-panel-title">{title}</h3>}
          {description && <p className="filtering-panel-description">{description}</p>}
        </div>
      )}

      <div className="filtering-panel-content">
        <div className="filters-grid">
          {filterConfigs.map(config => {
            const availableOptions = getFilteredOptions(config.key);
            const currentValue = filters[config.key];

            // Skip rendering if no options available (unless it's a static filter)
            if (availableOptions.length === 0 && config.optionsSource !== 'static') {
              return null;
            }

            return (
              <div key={config.key} className="filter-item">
                <Filter
                  type={config.type}
                  options={availableOptions}
                  value={currentValue}
                  onChange={(value) => handleFilterChange(config.key, value)}
                  label={config.label}
                  icon={config.icon}
                  placeholder={config.placeholder}
                  searchPlaceholder={config.searchPlaceholder}
                  searchable={config.searchable !== false} // Default to true
                  allLabel={config.allLabel}
                  defaultValue={config.defaultValue}
                />
              </div>
            );
          })}
        </div>

        {/* Debug information (remove in production) */}
        {process.env.NODE_ENV === 'development' && (
          <details className="filter-debug">
            <summary>Filter Debug Info</summary>
            <pre>{JSON.stringify(filters, null, 2)}</pre>
          </details>
        )}
      </div>
    </div>
  );
};

export default FilteringPanel;

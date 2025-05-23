// src/components/ui/Filters/FilteringPanel/FilteringPanel.jsx
import React, { useState, useEffect, useMemo } from 'react';
import _ from 'lodash';
import Filter from '../Filter/Filter';
import './FilteringPanel.css';

/**
 * A comprehensive filtering panel that manages filters and automatically
 * updates filter options based on data
 *
 * @param {Object} props
 * @param {Array} props.data - The raw data to filter
 * @param {Array} props.filterConfigs - Configuration for each filter
 * @param {Object} props.initialFilters - Initial filter values
 * @param {Function} props.onFiltersChange - Callback when filters change
 * @param {string} [props.title] - Optional title for the filter panel
 * @param {string} [props.description] - Optional description
 * @param {boolean} [props.loading] - Loading state
 */
const FilteringPanel = ({
  data = [],
  filterConfigs = [],
  initialFilters = {},
  onFiltersChange,
  title,
  description,
  loading = false
}) => {
  // Initialize filters state with proper defaults
  const [filters, setFilters] = useState(() => {
    const initialState = {};

    filterConfigs.forEach(config => {
      if (config.type === 'multiselect') {
        // For multiselect, always start with empty array
        initialState[config.key] = initialFilters[config.key] || [];
      } else if (config.type === 'singleselect') {
        // For singleselect, use provided initial value or first option
        initialState[config.key] = initialFilters[config.key] || config.defaultValue || 'all';
      }
    });

    return initialState;
  });

  // Calculate filtered options based on current filter selections (bi-directional cascading)
  const filterOptions = useMemo(() => {
    if (!data || data.length === 0) return {};

    const options = {};

    filterConfigs.forEach(config => {
      if (config.optionsSource === 'static' && config.options) {
        // Use static options as-is
        options[config.key] = config.options;
      } else if (config.dataField || config.optionsSource) {
        // For each filter, apply all OTHER active filters to determine available options
        let filteredData = [...data];

        // Apply all other filters (not the current one we're calculating options for)
        filterConfigs.forEach(otherConfig => {
          if (otherConfig.key === config.key) return; // Skip the current filter

          const filterValue = filters[otherConfig.key];
          const dataField = otherConfig.dataField || otherConfig.optionsSource;

          if (!filterValue || !dataField) return;

          if (otherConfig.type === 'multiselect') {
            // Multi-select filter: item must match at least one selected value
            if (Array.isArray(filterValue) && filterValue.length > 0) {
              filteredData = filteredData.filter(item => {
                const itemValue = dataField.includes('.')
                  ? _.get(item, dataField)
                  : item[dataField];
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
          }
        });

        // Extract unique values from the filtered data for the current filter
        const fieldName = config.dataField || config.optionsSource;

        let values = filteredData
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
        values = _.uniq(values).sort();
        options[config.key] = values;

        // Debug logging
        console.log(`🔍 Filter "${config.key}" options:`, values.length, 'items after applying other filters');
      }
    });

    return options;
  }, [data, filterConfigs, filters]); // Important: depends on current filters state

  // Handle individual filter changes
  const handleFilterChange = (filterKey, newValue) => {
    console.log(`🔧 Filter "${filterKey}" changing to:`, newValue);

    setFilters(prevFilters => {
      const updatedFilters = {
        ...prevFilters,
        [filterKey]: newValue
      };

      console.log('📋 Updated filters state:', updatedFilters);
      return updatedFilters;
    });
  };

  // Notify parent component when filters change
  useEffect(() => {
    console.log('📤 Sending filters to parent:', filters);
    if (onFiltersChange) {
      onFiltersChange(filters);
    }
  }, [filters, onFiltersChange]);

  // Loading state
  if (loading) {
    return (
      <div className="filtering-panel loading">
        <div className="filtering-panel-header">
          <h3 className="filtering-panel-title">{title || "Filters"}</h3>
          {description && <p className="filtering-panel-description">{description}</p>}
        </div>
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
      {(title || description) && (
        <div className="filtering-panel-header">
          {title && <h3 className="filtering-panel-title">{title}</h3>}
          {description && <p className="filtering-panel-description">{description}</p>}
        </div>
      )}

      <div className="filtering-panel-content">
        <div className="filters-grid">
          {filterConfigs.map(config => {
            const availableOptions = filterOptions[config.key] || [];
            const currentValue = filters[config.key];

            // Skip rendering if no options available for data-driven filters
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
                  searchable={config.searchable !== false}
                  allLabel={config.allLabel}
                  defaultValue={config.defaultValue}
                />
              </div>
            );
          })}
        </div>

        {/* Debug information in development */}
        {process.env.NODE_ENV === 'development' && (
          <details className="filter-debug">
            <summary>🐛 Filter Debug Info</summary>
            <div>
              <strong>Current Filters:</strong>
              <pre>{JSON.stringify(filters, null, 2)}</pre>
              <strong>Available Options:</strong>
              <pre>{JSON.stringify(filterOptions, null, 2)}</pre>
              <strong>Filter Configs:</strong>
              <pre>{JSON.stringify(filterConfigs.map(c => ({
                key: c.key,
                type: c.type,
                dataField: c.dataField,
                optionsSource: c.optionsSource
              })), null, 2)}</pre>
            </div>
          </details>
        )}
      </div>
    </div>
  );
};

export default FilteringPanel;

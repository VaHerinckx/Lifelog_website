// src/components/ui/Filters/FilteringPanel/FilteringPanel.jsx
import React, { useState, useEffect, useMemo } from 'react';
import _ from 'lodash';
import Papa from 'papaparse';
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
  fullDataset = '',
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
          console.log(`🎵 Calculating date boundaries from full dataset for ${config.key}`);
          
          const allDates = [];
          let processedRows = 0;
          
          Papa.parse(fullDataset, {
            delimiter: "|",
            header: true,
            skipEmptyLines: true,
            step: (row) => {
              processedRows++;
              const track = row.data;
              const dateValue = track[fieldName];
              
              if (dateValue) {
                const date = new Date(dateValue);
                if (!isNaN(date.getTime()) && date.getFullYear() > 1900) {
                  allDates.push(date);
                }
              }
              
              // Log progress every 50k rows
              if (processedRows % 50000 === 0) {
                console.log(`🎵 Date boundary calculation: processed ${processedRows} rows, found ${allDates.length} valid dates`);
              }
            },
            complete: () => {
              if (allDates.length > 0) {
                allDates.sort((a, b) => a - b);
                dateBoundaries[config.key] = {
                  minDate: allDates[0],
                  maxDate: allDates[allDates.length - 1]
                };
                
                console.log(`🎵 Full dataset date boundaries for ${config.key}:`, {
                  totalDates: allDates.length,
                  minDate: allDates[0].toISOString(),
                  maxDate: allDates[allDates.length - 1].toISOString(),
                  dateRange: {
                    earliest: allDates[0].getFullYear(),
                    latest: allDates[allDates.length - 1].getFullYear()
                  }
                });
              }
            }
          });
        } else {
          // Fallback to display data if full dataset not available
          let filteredData = [...data];

          // Apply all other filters to determine date boundaries
          filterConfigs.forEach(otherConfig => {
            if (otherConfig.key === config.key || otherConfig.type === 'daterange') return;

            const filterValue = filters[otherConfig.key];
            const dataField = otherConfig.dataField || otherConfig.optionsSource;

            if (!filterValue || !dataField) return;

            if (otherConfig.type === 'multiselect') {
              if (Array.isArray(filterValue) && filterValue.length > 0) {
                filteredData = filteredData.filter(item => {
                  const itemValue = dataField.includes('.')
                    ? _.get(item, dataField)
                    : item[dataField];
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
            
            console.log(`🎵 Display data date boundaries for ${config.key}:`, {
              validDatesCount: validDates.length,
              minDate: validDates[0]?.toISOString(),
              maxDate: validDates[validDates.length - 1]?.toISOString(),
              dateRange: {
                earliest: validDates[0].getFullYear(),
                latest: validDates[validDates.length - 1].getFullYear()
              }
            });
          }
        }

      } else if (config.dataField || config.optionsSource) {
        // For regular filters, apply all OTHER active filters to determine available options
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

    return { options, dateBoundaries };
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
            const availableOptions = filterOptions.options?.[config.key] || [];
            const boundaries = filterOptions.dateBoundaries?.[config.key];
            const currentValue = filters[config.key];

            // Skip rendering if no options available for data-driven filters (except daterange)
            if (config.type !== 'daterange' && availableOptions.length === 0 && config.optionsSource !== 'static') {
              return null;
            }

            // Skip rendering daterange if no date boundaries found
            if (config.type === 'daterange' && !boundaries) {
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
                  minDate={boundaries?.minDate}
                  maxDate={boundaries?.maxDate}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FilteringPanel;

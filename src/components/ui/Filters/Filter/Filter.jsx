// src/components/ui/Filters/Filter/Filter.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X, Check, Calendar } from 'lucide-react';
import './Filter.css';

/**
 * A versatile filter component that supports single-select, multi-select, and date range modes
 * with PowerBI-style radio button (circle) and checkbox (square) styling
 *
 * @param {Object} props
 * @param {string} props.type - 'singleselect', 'multiselect', or 'daterange'
 * @param {Array} props.options - Array of option strings (not used for daterange)
 * @param {string|Array|Object} props.value - Selected value(s) or date range object
 * @param {Function} props.onChange - Callback when selection changes
 * @param {string} props.label - Label for the filter
 * @param {React.ReactNode} [props.icon] - Optional icon
 * @param {string} [props.placeholder] - Placeholder text
 * @param {string} [props.searchPlaceholder] - Search input placeholder
 * @param {boolean} [props.searchable] - Whether to show search input
 * @param {string} [props.allLabel] - Label for "All" option (default: "All") - only for multiselect
 * @param {string} [props.defaultValue] - Default value for single select (required for singleselect)
 * @param {Date} [props.minDate] - Minimum date for daterange
 * @param {Date} [props.maxDate] - Maximum date for daterange
 */
const Filter = ({
  type = 'singleselect',
  options = [],
  value,
  onChange,
  label,
  icon = null,
  placeholder = "Select option",
  searchPlaceholder = "Search...",
  searchable = true,
  allLabel = "All",
  defaultValue = null,
  minDate = null,
  maxDate = null
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const sliderRef = useRef(null);

  // Date range specific state
  const [dragging, setDragging] = useState(null);

  // Normalize value to always be an array for easier processing (except daterange)
  const selectedValues = type === 'daterange'
    ? value || { startDate: null, endDate: null }
    : type === 'multiselect'
    ? (Array.isArray(value) ? value : [])
    : (value ? [value] : []);

  // Validation for single select
  if (type === 'singleselect' && !defaultValue) {
    console.error('Filter: defaultValue is required for singleselect type');
  }

  // Date range helper functions
  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateForInput = (date) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  const positionToDate = (position) => {
    if (!minDate || !maxDate) return null;
    const totalMs = maxDate.getTime() - minDate.getTime();
    const offsetMs = totalMs * (position / 100);
    return new Date(minDate.getTime() + offsetMs);
  };

  const dateToPosition = (date) => {
    if (!date || !minDate || !maxDate) return 0;
    const totalMs = maxDate.getTime() - minDate.getTime();
    if (totalMs === 0) return 0;
    const dateMs = date.getTime() - minDate.getTime();
    return (dateMs / totalMs) * 100;
  };

  // Filter options based on search term
  const filteredOptions = options.filter(option => {
    // Ensure option is a string before calling toLowerCase
    const optionStr = typeof option === 'string' ? option : String(option);
    return optionStr.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current && type !== 'daterange') {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable, type]);

  // Handle mouse/touch events for date range slider
  useEffect(() => {
    if (type !== 'daterange') return;

    const handleMouseMove = (e) => {
      if (!dragging || !sliderRef.current) return;

      const rect = sliderRef.current.getBoundingClientRect();
      const position = ((e.clientX - rect.left) / rect.width) * 100;
      const clampedPosition = Math.max(0, Math.min(100, position));
      const date = positionToDate(clampedPosition);

      if (!date) return;

      let newRange = { ...selectedValues };

      if (dragging === 'start') {
        if (date <= new Date(selectedValues.endDate || maxDate)) {
          newRange.startDate = formatDateForInput(date);
        }
      } else if (dragging === 'end') {
        if (date >= new Date(selectedValues.startDate || minDate)) {
          newRange.endDate = formatDateForInput(date);
        }
      }

      onChange(newRange);
    };

    const handleEnd = () => {
      setDragging(null);
      document.body.style.userSelect = '';
    };

    if (dragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('touchmove', handleMouseMove);
      document.addEventListener('touchend', handleEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMouseMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [dragging, selectedValues, minDate, maxDate, onChange, type]);

  // Toggle dropdown
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    setSearchTerm('');
  };

  // Handle single select option selection
  const handleSingleSelect = (option) => {
    onChange(option);
    setIsOpen(false);
  };

  // Handle multi-select option selection
  const handleMultiSelect = (option) => {
    let newSelected;
    if (selectedValues.includes(option)) {
      newSelected = selectedValues.filter(item => item !== option);
    } else {
      newSelected = [...selectedValues, option];
    }
    onChange(newSelected);
  };

  // Handle "All" option for multiselect only
  const handleSelectAll = () => {
    if (type === 'multiselect') {
      if (selectedValues.length === filteredOptions.length) {
        onChange([]);
      } else {
        onChange([...filteredOptions]);
      }
    }
  };

  // Handle date range input changes
  const handleDateInputChange = (e, dateType) => {
    const newDate = e.target.value;
    const newRange = {
      ...selectedValues,
      [dateType]: newDate
    };
    onChange(newRange);
  };

  // Handle date range slider interactions
  const handleSliderMouseDown = (e, handle) => {
    e.preventDefault();
    setDragging(handle);
    document.body.style.userSelect = 'none';
  };

  const handleTrackClick = (e) => {
    if (!sliderRef.current || !minDate || !maxDate) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickPosition = (clickX / rect.width) * 100;
    const clickDate = positionToDate(clickPosition);

    if (!clickDate) return;

    const startPos = dateToPosition(new Date(selectedValues.startDate || minDate));
    const endPos = dateToPosition(new Date(selectedValues.endDate || maxDate));
    const distToStart = Math.abs(clickPosition - startPos);
    const distToEnd = Math.abs(clickPosition - endPos);

    let newRange = { ...selectedValues };

    if (distToStart <= distToEnd) {
      newRange.startDate = formatDateForInput(clickDate);
    } else {
      newRange.endDate = formatDateForInput(clickDate);
    }

    // Ensure start date is not after end date
    if (new Date(newRange.startDate) > new Date(newRange.endDate)) {
      if (distToStart <= distToEnd) {
        newRange.startDate = newRange.endDate;
      } else {
        newRange.endDate = newRange.startDate;
      }
    }

    onChange(newRange);
  };

  // Clear all selections
  const clearAll = (e) => {
    e.stopPropagation();
    if (type === 'multiselect') {
      onChange([]);
    } else if (type === 'daterange') {
      onChange({ startDate: null, endDate: null });
    }
  };

  // Get display text for the selected value(s)
  const getDisplayText = () => {
    if (type === 'daterange') {
      if (!selectedValues.startDate && !selectedValues.endDate) {
        return placeholder;
      }
      const start = selectedValues.startDate ? formatDate(new Date(selectedValues.startDate)) : 'Start';
      const end = selectedValues.endDate ? formatDate(new Date(selectedValues.endDate)) : 'End';
      return `${start} - ${end}`;
    } else if (type === 'singleselect') {
      if (!value) {
        return defaultValue || placeholder;
      }
      return value;
    } else {
      if (selectedValues.length === 0) {
        return allLabel;
      } else if (selectedValues.length === 1) {
        return selectedValues[0];
      } else {
        return `${selectedValues.length} items selected`;
      }
    }
  };

  // Check if all filtered options are selected (for multiselect)
  const areAllFilteredSelected = () => {
    return filteredOptions.length > 0 &&
           filteredOptions.every(option => selectedValues.includes(option));
  };

  // Check if we should show clear button
  const shouldShowClear = () => {
    if (type === 'multiselect') {
      return selectedValues.length > 0;
    } else if (type === 'daterange') {
      return selectedValues.startDate || selectedValues.endDate;
    }
    return false;
  };

  return (
    <div className="filter-container" ref={dropdownRef}>
      {label && <label className="filter-label">{label}</label>}

      <div
        className={`filter-header ${isOpen ? 'open' : ''}`}
        onClick={toggleDropdown}
      >
        {icon && <span className="filter-icon">{icon}</span>}

        <div className="filter-selection-display">
          <span className={selectedValues.length === 0 && type !== 'daterange' ? 'filter-placeholder' : 'filter-selected'}>
            {getDisplayText()}
          </span>
        </div>

        {shouldShowClear() && (
          <button
            className="filter-clear-btn"
            onClick={clearAll}
            title="Clear selection"
          >
            <X size={16} />
          </button>
        )}

        <span className="filter-dropdown-arrow">
          <ChevronDown size={18} />
        </span>
      </div>

      {isOpen && (
        <div className="filter-dropdown">
          {/* Date Range Content */}
          {type === 'daterange' && (
            <>
              {minDate && maxDate ? (
                <div className="filter-daterange-content">
                  <div className="daterange-inputs">
                    <div className="daterange-input-group">
                      <label htmlFor="start-date">Start:</label>
                      <input
                        type="date"
                        id="start-date"
                        value={selectedValues.startDate || ''}
                        onChange={(e) => handleDateInputChange(e, 'startDate')}
                        min={formatDateForInput(minDate)}
                        max={formatDateForInput(maxDate)}
                      />
                    </div>
                    <div className="daterange-input-group">
                      <label htmlFor="end-date">End:</label>
                      <input
                        type="date"
                        id="end-date"
                        value={selectedValues.endDate || ''}
                        onChange={(e) => handleDateInputChange(e, 'endDate')}
                        min={formatDateForInput(minDate)}
                        max={formatDateForInput(maxDate)}
                      />
                    </div>
                  </div>

                  <div className="daterange-slider" ref={sliderRef} onClick={handleTrackClick}>
                    <div className="slider-track">
                      {/* Slider fill */}
                      <div
                        className="slider-fill"
                        style={{
                          left: `${dateToPosition(new Date(selectedValues.startDate || minDate))}%`,
                          width: `${dateToPosition(new Date(selectedValues.endDate || maxDate)) - dateToPosition(new Date(selectedValues.startDate || minDate))}%`
                        }}
                      />
                    </div>

                    {/* Start handle */}
                    <div
                      className="slider-handle slider-handle-start"
                      style={{ left: `${dateToPosition(new Date(selectedValues.startDate || minDate))}%` }}
                      onMouseDown={(e) => handleSliderMouseDown(e, 'start')}
                      title={formatDate(new Date(selectedValues.startDate || minDate))}
                    />

                    {/* End handle */}
                    <div
                      className="slider-handle slider-handle-end"
                      style={{ left: `${dateToPosition(new Date(selectedValues.endDate || maxDate))}%` }}
                      onMouseDown={(e) => handleSliderMouseDown(e, 'end')}
                      title={formatDate(new Date(selectedValues.endDate || maxDate))}
                    />
                  </div>

                  <div className="slider-labels">
                    <div className="slider-label">{formatDate(minDate)}</div>
                    <div className="slider-label">{formatDate(maxDate)}</div>
                  </div>
                </div>
              ) : (
                <div className="filter-no-results">No dates available with current filters</div>
              )}
            </>
          )}

          {/* Search for non-daterange types */}
          {type !== 'daterange' && searchable && (
            <div className="filter-search-container">
              <Search size={16} className="filter-search-icon" />
              <input
                ref={searchInputRef}
                type="text"
                className="filter-search-input"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}

          {/* Select All for multiselect only */}
          {type === 'multiselect' && (
            <div className="filter-select-all-container">
              <div
                className="filter-option checkbox-option"
                onClick={handleSelectAll}
              >
                <span className="filter-control checkbox-control">
                  <span className={`checkbox ${areAllFilteredSelected() ? 'selected' : ''}`}>
                    {areAllFilteredSelected() && <Check size={14} />}
                  </span>
                </span>
                <span className="filter-option-text">
                  {areAllFilteredSelected() ? "Deselect All" : "Select All"}
                </span>
              </div>
            </div>
          )}

          {/* Options list for non-daterange types */}
          {type !== 'daterange' && (
            <div className="filter-options-list">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option, index) => (
                  <div
                    key={index}
                    className={`filter-option ${type === 'singleselect' ? 'radio-option' : 'checkbox-option'} ${
                      selectedValues.includes(option) ? 'selected' : ''
                    }`}
                    onClick={() =>
                      type === 'singleselect'
                        ? handleSingleSelect(option)
                        : handleMultiSelect(option)
                    }
                  >
                    <span className={`filter-control ${type === 'singleselect' ? 'radio-control' : 'checkbox-control'}`}>
                      {type === 'singleselect' ? (
                        <span className={`radio-button ${selectedValues.includes(option) ? 'selected' : ''}`}>
                          {selectedValues.includes(option) && <span className="radio-dot" />}
                        </span>
                      ) : (
                        <span className={`checkbox ${selectedValues.includes(option) ? 'selected' : ''}`}>
                          {selectedValues.includes(option) && <Check size={14} />}
                        </span>
                      )}
                    </span>
                    <span className="filter-option-text">{option}</span>
                  </div>
                ))
              ) : (
                <div className="filter-no-results">No options match your search</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Filter;

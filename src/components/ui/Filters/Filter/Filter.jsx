// src/components/ui/Filters/Filter/Filter.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X, Check } from 'lucide-react';
import './Filter.css';

/**
 * A versatile filter component that supports both single-select and multi-select modes
 * with PowerBI-style radio button (circle) and checkbox (square) styling
 *
 * @param {Object} props
 * @param {string} props.type - 'singleselect' or 'multiselect'
 * @param {Array} props.options - Array of option strings
 * @param {string|Array} props.value - Selected value(s)
 * @param {Function} props.onChange - Callback when selection changes
 * @param {string} props.label - Label for the filter
 * @param {React.ReactNode} [props.icon] - Optional icon
 * @param {string} [props.placeholder] - Placeholder text
 * @param {string} [props.searchPlaceholder] - Search input placeholder
 * @param {boolean} [props.searchable] - Whether to show search input
 * @param {string} [props.allLabel] - Label for "All" option (default: "All") - only for multiselect
 * @param {string} [props.defaultValue] - Default value for single select (required for singleselect)
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
  defaultValue = null
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Normalize value to always be an array for easier processing
  const selectedValues = type === 'multiselect'
    ? (Array.isArray(value) ? value : [])
    : (value ? [value] : []);

  // Validation for single select
  if (type === 'singleselect' && !defaultValue) {
    console.error('Filter: defaultValue is required for singleselect type');
  }

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

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
      // For multiselect, toggle between all and none
      if (selectedValues.length === filteredOptions.length) {
        onChange([]); // Deselect all
      } else {
        onChange([...filteredOptions]); // Select all filtered options
      }
    }
  };

  // Clear all selections (multiselect only)
  const clearAll = (e) => {
    e.stopPropagation();
    if (type === 'multiselect') {
      onChange([]);
    }
  };

  // Get display text for the selected value(s)
  const getDisplayText = () => {
    if (type === 'singleselect') {
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

  return (
    <div className="filter-container" ref={dropdownRef}>
      {label && <label className="filter-label">{label}</label>}

      <div
        className={`filter-header ${isOpen ? 'open' : ''}`}
        onClick={toggleDropdown}
      >
        {icon && <span className="filter-icon">{icon}</span>}

        <div className="filter-selection-display">
          <span className={selectedValues.length === 0 ? 'filter-placeholder' : 'filter-selected'}>
            {getDisplayText()}
          </span>
        </div>

        {type === 'multiselect' && selectedValues.length > 0 && (
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
          {searchable && (
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

          {/* Only show Select All/Deselect All for multiselect */}
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
                      // Radio button for single select
                      <span className={`radio-button ${selectedValues.includes(option) ? 'selected' : ''}`}>
                        {selectedValues.includes(option) && <span className="radio-dot" />}
                      </span>
                    ) : (
                      // Checkbox for multiselect
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
        </div>
      )}
    </div>
  );
};

export default Filter;

// src/components/ui/MultiSelectDropdown/MultiSelectDropdown.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X, Check } from 'lucide-react';
import './MultiSelectDropdown.css';

const MultiSelectDropdown = ({
  options,
  selectedValues = [],
  onChange,
  placeholder = "Select options",
  label,
  searchPlaceholder = "Search...",
  maxHeight = 300,
  icon = null
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

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
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Toggle dropdown
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    setSearchTerm('');
  };

  // Toggle selection of an option
  const toggleOption = (option) => {
    let newSelected;
    if (selectedValues.includes(option)) {
      newSelected = selectedValues.filter(item => item !== option);
    } else {
      newSelected = [...selectedValues, option];
    }
    onChange(newSelected);
  };

  // Select or deselect all filtered options
  const toggleAll = () => {
    if (filteredOptions.length === 0) return;

    // Check if all filtered options are already selected
    const allFiltered = filteredOptions.every(option => selectedValues.includes(option));

    let newSelected;
    if (allFiltered) {
      // Deselect all filtered options
      newSelected = selectedValues.filter(item => !filteredOptions.includes(item));
    } else {
      // Select all filtered options
      const optionsToAdd = filteredOptions.filter(option => !selectedValues.includes(option));
      newSelected = [...selectedValues, ...optionsToAdd];
    }

    onChange(newSelected);
  };

  // Clear all selections
  const clearAll = (e) => {
    e.stopPropagation();
    onChange([]);
  };

  return (
    <div className="multi-select-container" ref={dropdownRef}>
      {label && <label className="multi-select-label">{label}</label>}

      <div
        className={`multi-select-header ${isOpen ? 'open' : ''}`}
        onClick={toggleDropdown}
      >
        {icon && <span className="dropdown-icon">{icon}</span>}

        <div className="selection-display">
          {selectedValues.length === 0 ? (
            <span className="placeholder">{placeholder}</span>
          ) : selectedValues.length === 1 ? (
            <span className="selected-option">{selectedValues[0]}</span>
          ) : (
            <span className="selected-count">{selectedValues.length} items selected</span>
          )}
        </div>

        {selectedValues.length > 0 && (
          <button
            className="clear-selection-btn"
            onClick={clearAll}
            title="Clear selection"
          >
            <X size={16} />
          </button>
        )}

        <span className="dropdown-arrow">
          <ChevronDown size={18} />
        </span>
      </div>

      {isOpen && (
        <div className="multi-select-dropdown">
          <div className="search-container">
            <Search size={16} className="search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              className="search-input"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div className="select-all-container">
            <div
              className="select-all-option"
              onClick={() => toggleAll()}
            >
              <span className="checkbox">
                {filteredOptions.length > 0 && filteredOptions.every(option => selectedValues.includes(option)) ? (
                  <Check size={14} />
                ) : null}
              </span>
              <span className="option">
                {filteredOptions.length > 0 && filteredOptions.every(option => selectedValues.includes(option))
                  ? "Deselect All"
                  : "Select All"}
              </span>
            </div>
          </div>

          <div className="options-list" style={{ maxHeight: `${maxHeight}px` }}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <div
                  key={index}
                  className={`option ${selectedValues.includes(option) ? 'selected' : ''}`}
                  onClick={() => toggleOption(option)}
                >
                  <span className="checkbox">
                    {selectedValues.includes(option) && <Check size={14} />}
                  </span>
                  <span className="option-text">{option}</span>
                </div>
              ))
            ) : (
              <div className="no-results">No options match your search</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSelectDropdown;

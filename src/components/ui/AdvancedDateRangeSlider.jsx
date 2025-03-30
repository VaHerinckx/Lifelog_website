// src/components/ui/AdvancedDateRangeSlider/AdvancedDateRangeSlider.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Calendar } from 'lucide-react';
import './AdvancedDateRangeSlider.css';

const AdvancedDateRangeSlider = ({
  data,
  dateColumnName = 'timestamp',
  onChange,
  initialStartDate = null,
  initialEndDate = null,
  title = "Date Range"
}) => {
  const sliderRef = useRef(null);
  const startHandleRef = useRef(null);
  const endHandleRef = useRef(null);

  // Track if a handle is being dragged
  const [dragging, setDragging] = useState(null); // 'start', 'end', or null

  // State for date boundaries (from data)
  const [dateBoundaries, setDateBoundaries] = useState({
    minDate: null,
    maxDate: null
  });

  // State for currently selected range
  const [selectedRange, setSelectedRange] = useState({
    startDate: null,
    endDate: null
  });

  // For input fields
  const [inputDates, setInputDates] = useState({
    start: '',
    end: ''
  });

  // Extract date range from data when component mounts or data changes
  useEffect(() => {
    if (!Array.isArray(data) || data.length === 0) return;

    // Extract and validate dates from the data
    const extractedDates = data
      .map(item => {
        // Handle both string dates and Date objects
        const dateValue = item[dateColumnName];
        if (!dateValue) return null;

        const date = dateValue instanceof Date
          ? dateValue
          : new Date(dateValue);

        return isNaN(date.getTime()) ? null : date;
      })
      .filter(Boolean)
      .sort((a, b) => a - b);

    if (extractedDates.length === 0) return;

    const minDate = extractedDates[0];
    const maxDate = extractedDates[extractedDates.length - 1];

    setDateBoundaries({ minDate, maxDate });

    // Set initial selected range if not already set
    if (!selectedRange.startDate || !selectedRange.endDate) {
      const newStartDate = initialStartDate ? new Date(initialStartDate) : minDate;
      const newEndDate = initialEndDate ? new Date(initialEndDate) : maxDate;

      setSelectedRange({
        startDate: newStartDate,
        endDate: newEndDate
      });

      setInputDates({
        start: formatDateForInput(newStartDate),
        end: formatDateForInput(newEndDate)
      });

      // Notify parent component about initial range
      if (onChange) {
        onChange({
          startDate: newStartDate.toISOString().split('T')[0],
          endDate: newEndDate.toISOString().split('T')[0]
        });
      }
    }
  }, [data, dateColumnName, initialStartDate, initialEndDate]);

  // Format date for display
  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format date for input field
  const formatDateForInput = (date) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  // Convert position to date
  const positionToDate = (position) => {
    if (!dateBoundaries.minDate || !dateBoundaries.maxDate) return null;

    const { minDate, maxDate } = dateBoundaries;
    const totalMs = maxDate.getTime() - minDate.getTime();
    const offsetMs = totalMs * (position / 100);

    return new Date(minDate.getTime() + offsetMs);
  };

  // Convert date to position percentage
  const dateToPosition = (date) => {
    if (!date || !dateBoundaries.minDate || !dateBoundaries.maxDate) return 0;

    const { minDate, maxDate } = dateBoundaries;
    const totalMs = maxDate.getTime() - minDate.getTime();
    if (totalMs === 0) return 0;

    const dateMs = date.getTime() - minDate.getTime();
    return (dateMs / totalMs) * 100;
  };

  // Handle mouse down on slider handles
  const handleMouseDown = (e, handle) => {
    e.preventDefault();
    setDragging(handle);
    document.body.style.userSelect = 'none'; // Prevent text selection during drag
  };

  // Handle touch start on slider handles
  const handleTouchStart = (e, handle) => {
    setDragging(handle);
    document.body.style.userSelect = 'none'; // Prevent text selection during drag
  };

  // Handle slider track click
  const handleTrackClick = (e) => {
    if (!sliderRef.current || !dateBoundaries.minDate || !dateBoundaries.maxDate) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickPosition = (clickX / rect.width) * 100;
    const clickDate = positionToDate(clickPosition);

    if (!clickDate) return;

    // Determine which handle to move based on proximity
    const startPos = dateToPosition(selectedRange.startDate);
    const endPos = dateToPosition(selectedRange.endDate);
    const distToStart = Math.abs(clickPosition - startPos);
    const distToEnd = Math.abs(clickPosition - endPos);

    let newRange = { ...selectedRange };

    if (distToStart <= distToEnd) {
      newRange.startDate = clickDate;
    } else {
      newRange.endDate = clickDate;
    }

    // Ensure start date is not after end date
    if (newRange.startDate > newRange.endDate) {
      if (distToStart <= distToEnd) {
        newRange.startDate = new Date(newRange.endDate);
      } else {
        newRange.endDate = new Date(newRange.startDate);
      }
    }

    setSelectedRange(newRange);
    updateInputDates(newRange);
    notifyChange(newRange);
  };

  // Update date inputs when selected range changes
  const updateInputDates = (range) => {
    setInputDates({
      start: formatDateForInput(range.startDate),
      end: formatDateForInput(range.endDate)
    });
  };

  // Notify parent component when range changes
  const notifyChange = (range) => {
    if (onChange && range.startDate && range.endDate) {
      onChange({
        startDate: range.startDate.toISOString().split('T')[0],
        endDate: range.endDate.toISOString().split('T')[0]
      });
    }
  };

  // Handle date input change
  const handleInputChange = (e, type) => {
    const value = e.target.value;
    setInputDates({ ...inputDates, [type]: value });

    try {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        let newRange = { ...selectedRange };

        if (type === 'start') {
          newRange.startDate = date;
          // Ensure start date is not after end date
          if (newRange.startDate > newRange.endDate) {
            newRange.startDate = new Date(newRange.endDate);
          }
        } else {
          newRange.endDate = date;
          // Ensure end date is not before start date
          if (newRange.endDate < newRange.startDate) {
            newRange.endDate = new Date(newRange.startDate);
          }
        }

        setSelectedRange(newRange);
        notifyChange(newRange);
      }
    } catch (error) {
      console.error("Invalid date input:", error);
    }
  };

  // Handle global mouse/touch move and up events
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!dragging || !sliderRef.current) return;

      const rect = sliderRef.current.getBoundingClientRect();
      const position = ((e.clientX - rect.left) / rect.width) * 100;
      const clampedPosition = Math.max(0, Math.min(100, position));

      const date = positionToDate(clampedPosition);
      if (!date) return;

      let newRange = { ...selectedRange };

      if (dragging === 'start') {
        if (date < selectedRange.endDate) {
          newRange.startDate = date;
        } else {
          newRange.startDate = new Date(selectedRange.endDate);
        }
      } else if (dragging === 'end') {
        if (date > selectedRange.startDate) {
          newRange.endDate = date;
        } else {
          newRange.endDate = new Date(selectedRange.startDate);
        }
      }

      setSelectedRange(newRange);
      updateInputDates(newRange);
    };

    const handleTouchMove = (e) => {
      if (!dragging || !sliderRef.current || !e.touches[0]) return;

      const rect = sliderRef.current.getBoundingClientRect();
      const touchX = e.touches[0].clientX - rect.left;
      const position = (touchX / rect.width) * 100;
      const clampedPosition = Math.max(0, Math.min(100, position));

      const date = positionToDate(clampedPosition);
      if (!date) return;

      let newRange = { ...selectedRange };

      if (dragging === 'start') {
        if (date < selectedRange.endDate) {
          newRange.startDate = date;
        } else {
          newRange.startDate = new Date(selectedRange.endDate);
        }
      } else if (dragging === 'end') {
        if (date > selectedRange.startDate) {
          newRange.endDate = date;
        } else {
          newRange.endDate = new Date(selectedRange.startDate);
        }
      }

      setSelectedRange(newRange);
      updateInputDates(newRange);
    };

    const handleEnd = () => {
      if (dragging) {
        notifyChange(selectedRange);
        setDragging(null);
        document.body.style.userSelect = ''; // Restore text selection
      }
    };

    // Add event listeners
    if (dragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleEnd);
    }

    // Clean up event listeners
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [dragging, selectedRange]);

  // If data is not loaded yet, show a placeholder
  if (!dateBoundaries.minDate || !dateBoundaries.maxDate) {
    return (
      <div className="advanced-date-range-container">
        <div className="date-range-header">
          <div className="date-range-title">
            <Calendar size={18} />
            <h3>{title}</h3>
          </div>
        </div>
        <div className="date-range-slider loading">Loading date range...</div>
      </div>
    );
  }

  // Calculate positions for rendering
  const startPosition = dateToPosition(selectedRange.startDate);
  const endPosition = dateToPosition(selectedRange.endDate);

  return (
    <div className="advanced-date-range-container">
      <div className="date-range-header">
        <div className="date-range-title">
          <Calendar size={18} />
          <h3>{title}</h3>
        </div>
      </div>

      <div className="date-range-content">
        <div className="date-inputs">
          <div className="date-input-group">
            <label htmlFor="start-date">Start:</label>
            <input
              type="date"
              id="start-date"
              value={inputDates.start}
              onChange={(e) => handleInputChange(e, 'start')}
              min={formatDateForInput(dateBoundaries.minDate)}
              max={formatDateForInput(dateBoundaries.maxDate)}
            />
          </div>
          <div className="date-input-group">
            <label htmlFor="end-date">End:</label>
            <input
              type="date"
              id="end-date"
              value={inputDates.end}
              onChange={(e) => handleInputChange(e, 'end')}
              min={formatDateForInput(dateBoundaries.minDate)}
              max={formatDateForInput(dateBoundaries.maxDate)}
            />
          </div>
        </div>

        <div className="date-range-slider" ref={sliderRef} onClick={handleTrackClick}>
          <div className="slider-track">
            {/* Left inactive area */}
            <div
              className="slider-inactive slider-inactive-left"
              style={{ width: `${startPosition}%` }}
            />

            {/* Active track fill */}
            <div
              className="slider-fill"
              style={{
                left: `${startPosition}%`,
                width: `${endPosition - startPosition}%`
              }}
            />

            {/* Right inactive area */}
            <div
              className="slider-inactive slider-inactive-right"
              style={{
                left: `${endPosition}%`,
                width: `${100 - endPosition}%`
              }}
            />
          </div>

          {/* Start handle */}
          <div
            ref={startHandleRef}
            className="slider-handle slider-handle-start"
            style={{ left: `${startPosition}%` }}
            onMouseDown={(e) => handleMouseDown(e, 'start')}
            onTouchStart={(e) => handleTouchStart(e, 'start')}
            title={formatDate(selectedRange.startDate)}
          />

          {/* End handle */}
          <div
            ref={endHandleRef}
            className="slider-handle slider-handle-end"
            style={{ left: `${endPosition}%` }}
            onMouseDown={(e) => handleMouseDown(e, 'end')}
            onTouchStart={(e) => handleTouchStart(e, 'end')}
            title={formatDate(selectedRange.endDate)}
          />
        </div>

        <div className="slider-labels">
          <div className="slider-label">{formatDate(dateBoundaries.minDate)}</div>
          <div className="slider-label">{formatDate(dateBoundaries.maxDate)}</div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedDateRangeSlider;

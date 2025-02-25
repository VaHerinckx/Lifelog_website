// src/components/ui/DateRangeSlider/DateRangeSlider.jsx
import React, { useState, useEffect, useRef } from 'react';
import './DateRangeSlider.css';

const DateRangeSlider = ({ startDate, endDate, onChange }) => {
  const sliderRef = useRef(null);

  // Store absolute min/max dates that never change
  const [absoluteRange, setAbsoluteRange] = useState({
    min: null,
    max: null
  });

  // Store the currently selected range
  const [selectedRange, setSelectedRange] = useState({
    start: null,
    end: null
  });

  // Date utilities
  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  };

  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Initialize the slider with absolute date range
  useEffect(() => {
    const minDate = parseDate(startDate);
    const maxDate = parseDate(endDate);

    if (minDate && maxDate) {
      setAbsoluteRange({
        min: minDate,
        max: maxDate
      });

      setSelectedRange({
        start: minDate,
        end: maxDate
      });
    }
  }, [startDate, endDate]);

  // Convert position to date and vice versa
  const positionToDate = (position) => {
    if (!absoluteRange.min || !absoluteRange.max) return null;

    // Calculate total range in milliseconds
    const totalMs = absoluteRange.max.getTime() - absoluteRange.min.getTime();
    const offsetMs = totalMs * (position / 100);

    return new Date(absoluteRange.min.getTime() + offsetMs);
  };

  const dateToPosition = (date) => {
    if (!date || !absoluteRange.min || !absoluteRange.max) return 0;

    const totalMs = absoluteRange.max.getTime() - absoluteRange.min.getTime();
    if (totalMs === 0) return 0;

    const dateMs = date.getTime() - absoluteRange.min.getTime();
    return (dateMs / totalMs) * 100;
  };

  // Handle mouse interactions
  const handleMouseDown = (e, handleType) => {
    e.preventDefault();

    // Prevent text selection during drag
    document.body.style.userSelect = 'none';

    const handleMouseMove = (moveEvent) => {
      const rect = sliderRef.current.getBoundingClientRect();
      const position = ((moveEvent.clientX - rect.left) / rect.width) * 100;
      const clampedPosition = Math.max(0, Math.min(100, position));

      // Get date from position
      const date = positionToDate(clampedPosition);
      if (!date) return;

      // Update the appropriate handle
      if (handleType === 'start' && date < selectedRange.end) {
        setSelectedRange(prev => ({
          ...prev,
          start: date
        }));
      } else if (handleType === 'end' && date > selectedRange.start) {
        setSelectedRange(prev => ({
          ...prev,
          end: date
        }));
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      // Restore text selection
      document.body.style.userSelect = '';

      // Notify parent of the change
      if (onChange && selectedRange.start && selectedRange.end) {
        onChange({
          startDate: selectedRange.start.toISOString().split('T')[0],
          endDate: selectedRange.end.toISOString().split('T')[0]
        });
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Handle track click
  const handleTrackClick = (e) => {
    if (!absoluteRange.min || !absoluteRange.max) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const position = ((e.clientX - rect.left) / rect.width) * 100;
    const clickDate = positionToDate(position);

    if (!clickDate) return;

    // Determine which handle to move based on proximity
    const startDistance = Math.abs(clickDate.getTime() - selectedRange.start.getTime());
    const endDistance = Math.abs(clickDate.getTime() - selectedRange.end.getTime());

    if (startDistance <= endDistance) {
      // Move start handle, but don't allow it to go past end handle
      if (clickDate < selectedRange.end) {
        setSelectedRange(prev => ({
          ...prev,
          start: clickDate
        }));
      }
    } else {
      // Move end handle, but don't allow it to go before start handle
      if (clickDate > selectedRange.start) {
        setSelectedRange(prev => ({
          ...prev,
          end: clickDate
        }));
      }
    }

    // Notify parent of the change
    if (onChange && selectedRange.start && selectedRange.end) {
      onChange({
        startDate: selectedRange.start.toISOString().split('T')[0],
        endDate: selectedRange.end.toISOString().split('T')[0]
      });
    }
  };

  // Don't render until we have valid date ranges
  if (!absoluteRange.min || !absoluteRange.max || !selectedRange.start || !selectedRange.end) {
    return <div className="date-range-slider loading">Loading date range...</div>;
  }

  // Calculate positions for rendering
  const startPosition = dateToPosition(selectedRange.start);
  const endPosition = dateToPosition(selectedRange.end);

  return (
    <div className="date-range-slider">
      <div className="date-range-display">
        <span className="date-label">{formatDate(selectedRange.start)}</span>
        <span className="date-label">{formatDate(selectedRange.end)}</span>
      </div>

      <div className="slider-container" ref={sliderRef} onClick={handleTrackClick}>
        <div className="slider-track">
          {/* Left inactive area */}
          <div
            className="slider-inactive slider-inactive-left"
            style={{ width: `${startPosition}%` }}
          ></div>

          {/* Active track fill */}
          <div
            className="slider-fill"
            style={{
              left: `${startPosition}%`,
              width: `${endPosition - startPosition}%`
            }}
          ></div>

          {/* Right inactive area */}
          <div
            className="slider-inactive slider-inactive-right"
            style={{
              left: `${endPosition}%`,
              width: `${100 - endPosition}%`
            }}
          ></div>
        </div>

        {/* Left handle */}
        <div
          className="slider-thumb slider-thumb-left"
          style={{ left: `${startPosition}%` }}
          onMouseDown={(e) => handleMouseDown(e, 'start')}
        ></div>

        {/* Right handle */}
        <div
          className="slider-thumb slider-thumb-right"
          style={{ left: `${endPosition}%` }}
          onMouseDown={(e) => handleMouseDown(e, 'end')}
        ></div>
      </div>

      <div className="date-ticks">
        <span className="date-tick">{formatDate(absoluteRange.min)}</span>
        <span className="date-tick">{formatDate(absoluteRange.max)}</span>
      </div>
    </div>
  );
};

export default DateRangeSlider;

// src/components/ui/DateRangeSlider/DateRangeSlider.jsx
import React, { useState, useEffect, useRef } from 'react';
import './DateRangeSlider.css';

const DateRangeSlider = ({ startDate, endDate, onChange }) => {
  const sliderRef = useRef(null);

  // Convert dates to numerical values for the slider (days since epoch)
  const getEpochDays = (dateStr) => {
    return Math.floor(new Date(dateStr).getTime() / (1000 * 60 * 60 * 24));
  };

  // Convert numerical values back to date strings
  const getDateFromEpochDays = (days) => {
    const date = new Date(days * 1000 * 60 * 60 * 24);
    return date.toISOString().split('T')[0];
  };

  // Keep original date range values constant
  const minDays = useRef(startDate ? getEpochDays(startDate) : 0);
  const maxDays = useRef(endDate ? getEpochDays(endDate) : 0);

  // State for selected range values (these will change with user interaction)
  const [selectedRange, setSelectedRange] = useState([
    minDays.current,
    maxDays.current
  ]);

  // Initialize once on component mount
  useEffect(() => {
    if (startDate && endDate) {
      minDays.current = getEpochDays(startDate);
      maxDays.current = getEpochDays(endDate);
      setSelectedRange([minDays.current, maxDays.current]);
    }
  }, []); // Empty dependency array means this only runs once on mount

  // Format date for display
  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate percent position for range handles
  const getPositionPercent = (value) => {
    return ((value - minDays.current) / (maxDays.current - minDays.current)) * 100;
  };

  // Handle thumb dragging
  const handleThumbMouseDown = (e, index) => {
    e.preventDefault();

    const handleMouseMove = (moveEvent) => {
      const rect = sliderRef.current.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (moveEvent.clientX - rect.left) / rect.width));
      const newValue = Math.round(minDays.current + percent * (maxDays.current - minDays.current));

      // Update specific thumb position
      const newRange = [...selectedRange];
      if (index === 0 && newValue < newRange[1]) {
        newRange[0] = newValue;
      } else if (index === 1 && newValue > newRange[0]) {
        newRange[1] = newValue;
      }

      setSelectedRange(newRange);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      // Notify parent of change
      if (onChange) {
        onChange({
          startDate: getDateFromEpochDays(selectedRange[0]),
          endDate: getDateFromEpochDays(selectedRange[1])
        });
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Handle touch events for mobile
  const handleThumbTouchStart = (e, index) => {
    e.preventDefault();

    const touch = e.touches[0];
    const startX = touch.clientX;

    const handleTouchMove = (moveEvent) => {
      const touch = moveEvent.touches[0];
      const rect = sliderRef.current.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
      const newValue = Math.round(minDays.current + percent * (maxDays.current - minDays.current));

      // Update specific thumb position
      const newRange = [...selectedRange];
      if (index === 0 && newValue < newRange[1]) {
        newRange[0] = newValue;
      } else if (index === 1 && newValue > newRange[0]) {
        newRange[1] = newValue;
      }

      setSelectedRange(newRange);
    };

    const handleTouchEnd = () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);

      // Notify parent of change
      if (onChange) {
        onChange({
          startDate: getDateFromEpochDays(selectedRange[0]),
          endDate: getDateFromEpochDays(selectedRange[1])
        });
      }
    };

    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
  };

  // Handle click on track to update slider position
  const handleTrackClick = (e) => {
    const rect = sliderRef.current.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / rect.width;
    const clickValue = Math.round(minDays.current + clickPosition * (maxDays.current - minDays.current));

    // Determine which thumb to move based on proximity
    const distToLow = Math.abs(clickValue - selectedRange[0]);
    const distToHigh = Math.abs(clickValue - selectedRange[1]);

    const newRange = [...selectedRange];
    if (distToLow <= distToHigh) {
      newRange[0] = clickValue < newRange[1] ? clickValue : newRange[1];
    } else {
      newRange[1] = clickValue > newRange[0] ? clickValue : newRange[0];
    }

    setSelectedRange(newRange);

    if (onChange) {
      onChange({
        startDate: getDateFromEpochDays(newRange[0]),
        endDate: getDateFromEpochDays(newRange[1])
      });
    }
  };

  // Calculate selected range percentage for styling
  const leftPercent = getPositionPercent(selectedRange[0]);
  const rightPercent = getPositionPercent(selectedRange[1]);
  const rangePercent = rightPercent - leftPercent;

  // Get the display dates for current selection
  const displayStartDate = getDateFromEpochDays(selectedRange[0]);
  const displayEndDate = getDateFromEpochDays(selectedRange[1]);
  const totalStartDate = getDateFromEpochDays(minDays.current);
  const totalEndDate = getDateFromEpochDays(maxDays.current);

  return (
    <div className="date-range-slider">
      <div className="date-range-display">
        <span className="date-label">{formatDisplayDate(displayStartDate)}</span>
        <span className="date-label">{formatDisplayDate(displayEndDate)}</span>
      </div>

      <div
        className="slider-container"
        ref={sliderRef}
        onClick={handleTrackClick}
      >
        {/* Base track (gray background) */}
        <div className="slider-track">
          {/* Active track fill */}
          <div
            className="slider-fill"
            style={{
              left: `${leftPercent}%`,
              width: `${rangePercent}%`
            }}
          ></div>

          {/* Left inactive area */}
          <div
            className="slider-inactive slider-inactive-left"
            style={{
              width: `${leftPercent}%`
            }}
          ></div>

          {/* Right inactive area */}
          <div
            className="slider-inactive slider-inactive-right"
            style={{
              left: `${rightPercent}%`,
              width: `${100 - rightPercent}%`
            }}
          ></div>
        </div>

        {/* Left thumb */}
        <div
          className="slider-thumb slider-thumb-left"
          style={{ left: `${leftPercent}%` }}
          onMouseDown={(e) => handleThumbMouseDown(e, 0)}
          onTouchStart={(e) => handleThumbTouchStart(e, 0)}
        ></div>

        {/* Right thumb */}
        <div
          className="slider-thumb slider-thumb-right"
          style={{ left: `${rightPercent}%` }}
          onMouseDown={(e) => handleThumbMouseDown(e, 1)}
          onTouchStart={(e) => handleThumbTouchStart(e, 1)}
        ></div>
      </div>

      <div className="date-ticks">
        <span className="date-tick">{formatDisplayDate(totalStartDate)}</span>
        <span className="date-tick">{formatDisplayDate(totalEndDate)}</span>
      </div>
    </div>
  );
};

export default DateRangeSlider;

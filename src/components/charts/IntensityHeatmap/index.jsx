// src/components/charts/IntensityHeatmap/index.jsx
import React, { useState, useEffect } from 'react';
import './IntensityHeatmap.css';

// Fixed time periods - ordered from morning to night, with unknown at the end
const BASE_TIME_PERIODS = {
  MORNING: { start: 6, end: 11, label: 'Morning (6AM-12PM)' },
  AFTERNOON: { start: 12, end: 17, label: 'Afternoon (12PM-6PM)' },
  EVENING: { start: 18, end: 23, label: 'Evening (6PM-12AM)' },
  NIGHT: { start: 0, end: 5, label: 'Night (12AM-6AM)' }
};

// Unknown time period, only included when treatMidnightAsUnknown is true
const UNKNOWN_TIME_PERIOD = {
  UNKNOWN: { label: 'Unknown Time' } // Special category for 00:00 timestamps (paper books)
};

// Fixed days array - ordered from Monday to Sunday
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Color scale function - kept the same as in original component
const getColor = (value, maxValue) => {
  if (value === 0) return '#D8DCFF';
  const intensity = Math.min((value / maxValue) * 100, 100);
  return `rgba(52, 35, 166, ${intensity / 100})`;
};

/**
 * A reusable intensity heatmap component for visualizing data across days and time periods
 *
 * @param {Object} props
 * @param {Array} props.data - The dataset to visualize
 * @param {string} props.dateColumnName - The name of the date/timestamp column in the data
 * @param {string} props.valueColumnName - The field to analyze and display intensity for
 * @param {string} props.title - The chart title
 * @param {boolean} props.treatMidnightAsUnknown - If true, 00:00 timestamps are treated as "Unknown Time" (default: true)
 */
const IntensityHeatmap = ({
  data,
  dateColumnName,
  valueColumnName,
  title = "Activity Heatmap",
  treatMidnightAsUnknown = true
}) => {
  const [heatmapData, setHeatmapData] = useState({});
  const [maxValue, setMaxValue] = useState(0);

  useEffect(() => {
    if (!Array.isArray(data) || data.length === 0) return;

    // Dynamically determine time periods based on the treatMidnightAsUnknown prop
    const TIME_PERIODS = treatMidnightAsUnknown
      ? { ...BASE_TIME_PERIODS, ...UNKNOWN_TIME_PERIOD }
      : { ...BASE_TIME_PERIODS };

    const processDataForHeatmap = () => {
      try {

        // Create a matrix for time periods and days
        const activityMatrix = {};

        // Initialize all period/day combinations with 0
        Object.keys(TIME_PERIODS).forEach(period => {
          activityMatrix[period] = {};
          DAYS.forEach((_, dayIndex) => {
            activityMatrix[period][dayIndex] = 0;
          });
        });

        // Process each data entry
        data.forEach((item, index) => {
          // Some data sources might have encoding issues or different timestamp formats
          const rawTimestamp = item[dateColumnName];
          let date;

          // Try different parsing approaches for timestamp
          if (typeof rawTimestamp === 'string') {
            // Check if it's a UTC timestamp with +00:00
            if (rawTimestamp.includes('+00:00')) {
              // Parse directly as UTC without timezone conversion
              const utcParts = rawTimestamp.split(/[^0-9]/);
              // Make sure we have enough parts for a proper date
              if (utcParts.length >= 6) {
                // Create date with local timezone, but using UTC components
                date = new Date(
                  parseInt(utcParts[0]), // year
                  parseInt(utcParts[1]) - 1, // month (0-based)
                  parseInt(utcParts[2]), // day
                  parseInt(utcParts[3]), // hour
                  parseInt(utcParts[4]), // minute
                  parseInt(utcParts[5] || 0) // second
                );
              } else {
                date = new Date(rawTimestamp);
              }
            } else {
              // Standard parsing for non-UTC dates
              date = new Date(rawTimestamp);
            }
          } else if (rawTimestamp instanceof Date) {
            date = rawTimestamp;
          } else {
            // Can't parse the timestamp
            return;
          }

          if (!date || isNaN(date.getTime())) return;

          const hour = date.getHours();
          const minutes = date.getMinutes();
          const day = date.getDay();
          // Convert from JS day (0=Sunday) to our ordering (0=Monday)
          const adjustedDayIndex = day === 0 ? 6 : day - 1;


          // Determine time period based on hour and treatMidnightAsUnknown setting
          let period;
          if (treatMidnightAsUnknown && hour === 0 && minutes === 0) {
            period = 'UNKNOWN';
          } else {
            period = Object.keys(BASE_TIME_PERIODS).find(p => {
              const { start, end } = BASE_TIME_PERIODS[p];
              return hour >= start && hour <= end;
            });
          }

          if (!period) return;

          // Get the value from the valueColumnName field
          const value = parseFloat(item[valueColumnName]) || 0;

          // For podcast data, we typically want to convert from seconds to minutes
          const normalizedValue = valueColumnName === 'duration' ? value / 60 : value;

          activityMatrix[period][adjustedDayIndex] += normalizedValue;
        });

        // Find max value
        const max = Math.max(
          ...Object.values(activityMatrix).flatMap(dayValues =>
            Object.values(dayValues)
          )
        );

        setMaxValue(max);
        setHeatmapData(activityMatrix);
      } catch (error) {
        console.error('Error processing heatmap data:', error);
      }
    };

    processDataForHeatmap();
  }, [data, dateColumnName, valueColumnName, treatMidnightAsUnknown]);

  // Dynamically determine time periods for rendering (outside useEffect)
  const TIME_PERIODS = treatMidnightAsUnknown
    ? { ...BASE_TIME_PERIODS, ...UNKNOWN_TIME_PERIOD }
    : { ...BASE_TIME_PERIODS };

  return (
    <div className="heatmap-container">
      <h3 className="heatmap-title">{title}</h3>
      <div className="heatmap-table-container">
        <table className="heatmap-table">
          <thead>
            <tr>
              <th></th>
              {Object.entries(TIME_PERIODS).map(([key, { label }]) => (
                <th key={key}>{label}</th>
              ))}
              <th className="total-header">Total</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              // Calculate grand total once for all percentage calculations
              const grandTotal = Object.keys(TIME_PERIODS).reduce((periodSum, period) => {
                return periodSum + DAYS.reduce((daySum, _, dayIndex) => {
                  return daySum + (heatmapData[period]?.[dayIndex] || 0);
                }, 0);
              }, 0);

              return (
                <>
                  {DAYS.map((day, dayIndex) => {
                    // Calculate row total (sum across all time periods for this day)
                    const rowTotal = Object.keys(TIME_PERIODS).reduce((sum, period) => {
                      return sum + (heatmapData[period]?.[dayIndex] || 0);
                    }, 0);

                    return (
                      <tr key={day}>
                        <td className="day-label">{day}</td>
                        {Object.keys(TIME_PERIODS).map((period) => {
                          const value = Math.round(heatmapData[period]?.[dayIndex] || 0);
                          return (
                            <td
                              key={`${day}-${period}`}
                              className="heatmap-cell"
                              style={{
                                backgroundColor: getColor(value, maxValue),
                                color: value > maxValue / 2 ? 'white' : '#171738'
                              }}
                              title={`${value.toLocaleString()} minutes`}
                            >
                              {value.toLocaleString()}
                            </td>
                          );
                        })}
                        <td className="total-cell">
                          {Math.round(rowTotal).toLocaleString()}
                          {grandTotal > 0 && (
                            <span className="percentage">
                              {' '}({Math.round((rowTotal / grandTotal) * 100)}%)
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Total row */}
                  <tr className="total-row">
                    <td className="total-label">Total</td>
                    {Object.keys(TIME_PERIODS).map((period) => {
                      // Calculate column total (sum across all days for this period)
                      const columnTotal = DAYS.reduce((sum, _, dayIndex) => {
                        return sum + (heatmapData[period]?.[dayIndex] || 0);
                      }, 0);

                      return (
                        <td key={`total-${period}`} className="total-cell">
                          {Math.round(columnTotal).toLocaleString()}
                          {grandTotal > 0 && (
                            <span className="percentage">
                              {' '}({Math.round((columnTotal / grandTotal) * 100)}%)
                            </span>
                          )}
                        </td>
                      );
                    })}

                    {/* Grand total (bottom-right cell) */}
                    <td className="grand-total-cell">
                      {Math.round(grandTotal).toLocaleString()}
                    </td>
                  </tr>
                </>
              );
            })()}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default IntensityHeatmap;

// src/components/charts/ListeningHeatmap/index.jsx
import React, { useState, useEffect } from 'react';
import './ListeningHeatmap.css';

const TIME_PERIODS = {
  NIGHT: { start: 0, end: 5, label: 'Night (12AM-6AM)' },
  MORNING: { start: 6, end: 11, label: 'Morning (6AM-12PM)' },
  AFTERNOON: { start: 12, end: 17, label: 'Afternoon (12PM-6PM)' },
  EVENING: { start: 18, end: 23, label: 'Evening (6PM-12AM)' }
};

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const getColor = (value, maxValue) => {
  if (value === 0) return '#D8DCFF';
  const intensity = Math.min((value / maxValue) * 100, 100);
  return `rgba(52, 35, 166, ${intensity / 100})`;
};

const ListeningHeatmap = ({ data, selectedPodcast }) => {
  const [heatmapData, setHeatmapData] = useState({});
  const [maxValue, setMaxValue] = useState(0);

  useEffect(() => {
    if (!Array.isArray(data) || data.length === 0) return;

    const processDataForHeatmap = () => {
      try {
        const filteredData = selectedPodcast === 'all'
          ? data
          : data.filter(item => item.podcast_name === selectedPodcast);

        // Create a matrix for time periods and days
        const activityMatrix = {};

        // Initialize all period/day combinations with 0
        Object.keys(TIME_PERIODS).forEach(period => {
          activityMatrix[period] = {};
          DAYS.forEach((_, dayIndex) => {
            activityMatrix[period][dayIndex] = 0;
          });
        });

        // Process each listening session
        filteredData.forEach(session => {
          const modifiedAt = session['modified at'];
          if (!modifiedAt) return;

          const date = new Date(modifiedAt);
          if (!date || isNaN(date.getTime())) return;

          const hour = date.getHours();
          const day = date.getDay();

          const period = Object.keys(TIME_PERIODS).find(p => {
            const { start, end } = TIME_PERIODS[p];
            return hour >= start && hour <= end;
          });

          if (!period) return;

          const duration = parseFloat(session.duration) || 0;
          activityMatrix[period][day] += duration / 60;
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
  }, [data, selectedPodcast]);

  return (
    <div className="heatmap-container">
      <h3 className="heatmap-title">Listening Activity Heatmap</h3>
      <div className="heatmap-table-container">
        <table className="heatmap-table">
          <thead>
            <tr>
              <th></th>
              {Object.entries(TIME_PERIODS).map(([key, { label }]) => (
                <th key={key}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS.map((day, dayIndex) => (
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
                      title={`${value} minutes`}
                    >
                      {value}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ListeningHeatmap;

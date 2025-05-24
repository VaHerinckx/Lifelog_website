// src/pages/Movies/components/MoviesAnalysisTab.jsx
import React from 'react';
import TimeSeriesBarChart from '../../../components/charts/TimeSeriesBarChart';
import IntensityHeatmap from '../../../components/charts/IntensityHeatmap';
import './MoviesAnalysisTab.css';

const MoviesAnalysisTab = ({ movies = [] }) => {
  if (!movies || movies.length === 0) {
    return (
      <div className="movies-analysis-empty">
        <p>No movie data available for analysis. Add some movies to see insights!</p>
      </div>
    );
  }

  return (
    <div className="movies-analysis-container">
      <h2 className="movies-analysis-title">Movie Analytics</h2>
      <p className="movies-analysis-description">
        Discover patterns and insights in your movie watching habits
        {movies.length > 0 && (
          <span style={{ display: 'block', marginTop: '5px', fontSize: '0.9rem', opacity: 0.8 }}>
            Analyzing {movies.length.toLocaleString()} movie entries
          </span>
        )}
      </p>

      <div className="charts-grid">
        {/* Movies watched over time */}
        <div className="chart-container">
          <TimeSeriesBarChart
            data={movies}
            dateColumnName="Date"
            metricColumnName="Rating" // We'll count movies, so any column works
            title="Movies Watched by Period"
            yAxisLabel="Movies"
          />
        </div>

        {/* Viewing activity heatmap */}
        <div className="chart-container">
          <IntensityHeatmap
            data={movies}
            dateColumnName="Date"
            valueColumnName="Rating" // Using rating as a proxy for activity
            title="Movie Watching Activity by Day and Time"
            treatMidnightAsUnknown={false}
          />
        </div>
      </div>
    </div>
  );
};

export default MoviesAnalysisTab;

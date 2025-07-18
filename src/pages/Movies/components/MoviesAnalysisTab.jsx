// src/pages/Movies/components/MoviesAnalysisTab.jsx
import React from 'react';
import TimeSeriesBarChart from '../../../components/charts/TimeSeriesBarChart';
import IntensityHeatmap from '../../../components/charts/IntensityHeatmap';
import './MoviesAnalysisTab.css';

const MoviesAnalysisTab = ({ movies = [], shows = [], contentType = 'movies' }) => {
  const data = contentType === 'movies' ? movies : shows;
  const isMovies = contentType === 'movies';
  
  if (!data || data.length === 0) {
    return (
      <div className="movies-analysis-empty">
        <p>No {isMovies ? 'movie' : 'TV show'} data available for analysis. Add some {isMovies ? 'movies' : 'shows'} to see insights!</p>
      </div>
    );
  }

  // Prepare data for charts based on content type
  const chartData = data.map(item => {
    if (isMovies) {
      return {
        ...item,
        Date: item.Date || item.date,
        Rating: item.Rating || item.rating || 1 // Default to 1 for counting
      };
    } else {
      return {
        ...item,
        Date: item.watched_at || item.Timestamp,
        Rating: 1, // Shows don't have ratings, so use 1 for counting
        show_title: item.show_title,
        season: item.season,
        episode_number: item.episode_number
      };
    }
  });

  return (
    <div className="movies-analysis-container">
      <h2 className="movies-analysis-title">
        {isMovies ? 'Movie Analytics' : 'TV Show Analytics'}
      </h2>
      <p className="movies-analysis-description">
        Discover patterns and insights in your {isMovies ? 'movie watching' : 'TV show viewing'} habits
        {data.length > 0 && (
          <span style={{ display: 'block', marginTop: '5px', fontSize: '0.9rem', opacity: 0.8 }}>
            Analyzing {data.length.toLocaleString()} {isMovies ? 'movie' : 'episode'} entries
          </span>
        )}
      </p>

      <div className="charts-grid">
        {/* Content watched over time */}
        <div className="chart-container">
          <TimeSeriesBarChart
            data={chartData}
            dateColumnName="Date"
            metricColumnName="Rating" // We'll count entries, so any column works
            title={isMovies ? "Movies Watched by Period" : "Episodes Watched by Period"}
            yAxisLabel={isMovies ? "Movies" : "Episodes"}
          />
        </div>

        {/* Viewing activity heatmap */}
        <div className="chart-container">
          <IntensityHeatmap
            data={chartData}
            dateColumnName="Date"
            valueColumnName="Rating" // Using rating/count as a proxy for activity
            title={isMovies ? "Movie Watching Activity by Day and Time" : "TV Show Viewing Activity by Day and Time"}
            treatMidnightAsUnknown={false}
          />
        </div>
      </div>
    </div>
  );
};

export default MoviesAnalysisTab;

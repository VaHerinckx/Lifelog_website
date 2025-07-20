// src/pages/Music/components/MusicAnalysisTab.jsx
import React from 'react';
import TimeSeriesBarChart from '../../../components/charts/TimeSeriesBarChart';
import IntensityHeatmap from '../../../components/charts/IntensityHeatmap';
import TopArtistsChart from '../../../components/charts/TopArtistsChart/index';
import TreemapGenre from '../../../components/charts/TreemapGenre';
import './MusicAnalysisTab.css';

const MusicAnalysisTab = ({ musicData = [], selectedArtistInfo = null, currentFilters = {} }) => {
  // No longer manages its own filters - receives filtered data as props

  return (
    <div className="music-analysis-container">
      <h2 className="music-analysis-title">Music Analytics</h2>
      <p className="music-analysis-description">
        Discover patterns and insights in your music listening habits
        {musicData.length > 0 && (
          <span style={{ display: 'block', marginTop: '5px', fontSize: '0.9rem', opacity: 0.8 }}>
            Analyzing {musicData.length.toLocaleString()} tracks
          </span>
        )}
      </p>

      {musicData.length === 0 ? (
        <div className="empty-state">
          <p>No music data available with current filters. Try adjusting your filter criteria.</p>
        </div>
      ) : (
        <div className="charts-grid">
          <div className="chart-container">
            <TimeSeriesBarChart
              data={musicData}
              dateColumnName="timestamp"
              metricColumnName="track_duration"
              title="Listening Time by Period"
              yAxisLabel="Minutes"
            />
          </div>

          <div className="chart-container">
            <IntensityHeatmap
              data={musicData}
              dateColumnName="timestamp"
              valueColumnName="track_duration"
              title="Listening Activity by Day and Time"
              treatMidnightAsUnknown={false}
            />
          </div>

          <div className="chart-container">
            <TopArtistsChart
              data={musicData}
              dateRange={currentFilters.dateRange || { startDate: null, endDate: null }}
            />
          </div>

          <div className="chart-container">
            <TreemapGenre
              data={musicData}
              selectedArtist={currentFilters.artists?.length === 1 ? currentFilters.artists[0] : 'all'}
              dateRange={currentFilters.dateRange || { startDate: null, endDate: null }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MusicAnalysisTab;
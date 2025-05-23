// src/pages/Podcast/components/PodcastAnalysisTab.jsx
import React from 'react';
import TimeSeriesBarChart from '../../../components/charts/TimeSeriesBarChart';
import IntensityHeatmap from '../../../components/charts/IntensityHeatmap';
import TopPodcastsChart from '../../../components/charts/TopPodcastsChart';
import TreemapGenre from '../../../components/charts/TreemapGenre';
import './PodcastAnalysisTab.css';

const PodcastAnalysisTab = ({ podcastData = [], selectedPodcastInfo = null, currentFilters = {} }) => {
  // No longer manages its own filters - receives filtered data as props

  return (
    <div className="podcast-analysis-container">
      <h2 className="podcast-analysis-title">Podcast Analytics</h2>
      <p className="podcast-analysis-description">
        Discover patterns and insights in your podcast listening habits
        {podcastData.length > 0 && (
          <span style={{ display: 'block', marginTop: '5px', fontSize: '0.9rem', opacity: 0.8 }}>
            Analyzing {podcastData.length.toLocaleString()} episodes
          </span>
        )}
      </p>

      {podcastData.length === 0 ? (
        <div className="empty-state">
          <p>No podcast data available with current filters. Try adjusting your filter criteria.</p>
        </div>
      ) : (
        <div className="charts-grid">
          <div className="chart-container">
            <TimeSeriesBarChart
              data={podcastData}
              dateColumnName="modified at"
              metricColumnName="duration"
              title="Listening Time by Period"
              yAxisLabel="Minutes"
            />
          </div>

          <div className="chart-container">
            <IntensityHeatmap
              data={podcastData}
              dateColumnName="modified at"
              valueColumnName="duration"
              title="Listening Activity by Day and Time"
              treatMidnightAsUnknown={false}
            />
          </div>

          <div className="chart-container">
            <TopPodcastsChart
              data={podcastData}
              dateRange={currentFilters.dateRange || { startDate: null, endDate: null }}
            />
          </div>

          <div className="chart-container">
            <TreemapGenre
              data={podcastData}
              selectedPodcast={currentFilters.podcasts?.length === 1 ? currentFilters.podcasts[0] : 'all'}
              dateRange={currentFilters.dateRange || { startDate: null, endDate: null }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PodcastAnalysisTab;

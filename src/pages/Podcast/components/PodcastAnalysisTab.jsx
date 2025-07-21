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
    <div className="analysis-tab-container">
      {podcastData.length === 0 ? (
        <div className="empty-state">
          <p>No podcast data available with current filters. Try adjusting your filter criteria.</p>
        </div>
      ) : (
        <div className="analysis-charts-grid">
          <div className="analysis-chart-section">
            <TimeSeriesBarChart
              data={podcastData}
              dateColumnName="modified at"
              metricColumnName="duration"
              title="Listening Time by Period"
              yAxisLabel="Minutes"
            />
          </div>

          <div className="analysis-chart-section">
            <IntensityHeatmap
              data={podcastData}
              dateColumnName="modified at"
              valueColumnName="duration"
              title="Listening Activity by Day and Time"
              treatMidnightAsUnknown={false}
            />
          </div>

          <div className="analysis-chart-section">
            <TopPodcastsChart
              data={podcastData}
              dateRange={currentFilters.dateRange || { startDate: null, endDate: null }}
            />
          </div>

          <div className="analysis-chart-section">
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

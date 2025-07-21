// src/pages/Reading/components/ReadingAnalysisTab.jsx
import React from 'react';
import TimeSeriesBarChart from '../../../components/charts/TimeSeriesBarChart';
import IntensityHeatmap from '../../../components/charts/IntensityHeatmap';
import './ReadingAnalysisTab.css';

const ReadingAnalysisTab = ({ books = [] }) => {

  // No longer manages its own filters - receives filtered data as props

  if (!books || books.length === 0) {
    return (
      <div className="analysis-empty-state">
        <p>No reading data available for analysis. Add some books to see insights!</p>
      </div>
    );
  }

  return (
    <div className="analysis-tab-container">
      {books.length === 0 ? (
        <div className="analysis-empty-state">
          <p>No reading data available with current filters. Try adjusting your filter criteria.</p>
        </div>
      ) : (
        <div className="analysis-charts-grid">
          {/* Reading Pace Analysis using the reusable component */}
          <div className="analysis-chart-section">
            <TimeSeriesBarChart
              data={books}
              dateColumnName="Timestamp"
              metricColumnName="page_split"
              title="Total Pages Read by Period"
              yAxisLabel="Pages"
            />
          </div>

          {/* Reading Activity Heatmap using the reusable component */}
          <div className="analysis-chart-section">
            <IntensityHeatmap
              data={books}
              dateColumnName="Timestamp"
              valueColumnName="page_split"
              title="Reading Activity by Day and Time"
              treatMidnightAsUnknown={true} // optional, this is the default
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ReadingAnalysisTab;

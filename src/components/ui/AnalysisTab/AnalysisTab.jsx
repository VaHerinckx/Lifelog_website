// AnalysisTab.jsx - Reusable analysis tab component
// Eliminates boilerplate for displaying charts with standardized structure
// Mirrors ContentTab API design for consistency

import React from 'react';
import PropTypes from 'prop-types';
import './AnalysisTab.css';

/**
 * AnalysisTab - Standardized component for analysis views
 *
 * @param {Array} data - Pre-filtered data array (required)
 * @param {Object} emptyState - Empty state configuration
 * @param {string} emptyState.message - Message to display when no data
 * @param {Function} renderCharts - Function that returns chart JSX elements
 *
 * @example
 * <AnalysisTab
 *   data={filteredData}
 *   emptyState={{ message: "No data available with current filters." }}
 *   renderCharts={(data) => (
 *     <>
 *       <TimeSeriesBarChart data={data} ... />
 *       <IntensityHeatmap data={data} ... />
 *     </>
 *   )}
 * />
 */
const AnalysisTab = ({
  data = [],
  emptyState = {},
  renderCharts
}) => {
  // Default empty state message
  const defaultEmptyMessage = "No data available with current filters. Try adjusting your criteria.";
  const emptyMessage = emptyState.message || defaultEmptyMessage;

  // Validate required props
  if (!renderCharts || typeof renderCharts !== 'function') {
    console.error('AnalysisTab: renderCharts prop is required and must be a function');
    return (
      <div className="analysis-tab-container">
        <div className="empty-state">
          <p>Configuration error: renderCharts function not provided.</p>
        </div>
      </div>
    );
  }

  // Handle empty data state
  if (!data || data.length === 0) {
    return (
      <div className="analysis-tab-container">
        <div className="empty-state">
          <p>{emptyMessage}</p>
        </div>
      </div>
    );
  }

  // Render charts and wrap each child in analysis-chart-section
  const renderWrappedCharts = () => {
    const charts = renderCharts(data);

    // Handle single element
    if (!charts) return null;

    // Convert to array if it's a fragment or single element
    const chartArray = React.Children.toArray(charts);

    // Wrap each chart in analysis-chart-section
    return chartArray.map((chart, index) => (
      <div key={`chart-section-${index}`} className="analysis-chart-section">
        {chart}
      </div>
    ));
  };

  return (
    <div className="analysis-tab-container">
      <div className="analysis-charts-grid">
        {renderWrappedCharts()}
      </div>
    </div>
  );
};

AnalysisTab.propTypes = {
  data: PropTypes.array,
  emptyState: PropTypes.shape({
    message: PropTypes.string
  }),
  renderCharts: PropTypes.func.isRequired
};

AnalysisTab.defaultProps = {
  data: [],
  emptyState: {}
};

export default AnalysisTab;

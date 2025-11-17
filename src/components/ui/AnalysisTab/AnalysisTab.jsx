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
 * @param {string} chartLayout - Layout option: 'single' | 'two-column' | 'three-column'
 * @param {Function} renderCharts - Function that returns chart JSX elements
 *
 * @example
 * <AnalysisTab
 *   data={filteredData}
 *   chartLayout="two-column"
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
  chartLayout = 'two-column',
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

  // Determine grid class based on layout
  const getGridClass = () => {
    switch (chartLayout) {
      case 'single':
        return 'analysis-charts-grid analysis-charts-grid--single';
      case 'three-column':
        return 'analysis-charts-grid analysis-charts-grid--three-column';
      case 'two-column':
      default:
        return 'analysis-charts-grid';
    }
  };

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
      <div className={getGridClass()}>
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
  chartLayout: PropTypes.oneOf(['single', 'two-column', 'three-column']),
  renderCharts: PropTypes.func.isRequired
};

AnalysisTab.defaultProps = {
  data: [],
  emptyState: {},
  chartLayout: 'two-column'
};

export default AnalysisTab;

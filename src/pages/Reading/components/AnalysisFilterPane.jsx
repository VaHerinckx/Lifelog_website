// src/pages/Reading/components/AnalysisFilterPane.jsx
import React from 'react';
import AdvancedDateRangeSlider from '../../../components/ui/AdvancedDateRangeSlider';
import './AnalysisFilterPane.css';

const AnalysisFilterPane = ({
  data,
  dateColumnName = 'Timestamp',
  dateRange,
  onDateRangeChange,
  // Additional filter props can be added here as needed
}) => {
  return (
    <div className="analysis-filter-pane">
      <AdvancedDateRangeSlider
        data={data}
        dateColumnName={dateColumnName}
        onChange={onDateRangeChange}
        initialStartDate={dateRange?.startDate}
        initialEndDate={dateRange?.endDate}
        title="Filter by Date"
      />

      {/* Additional filters can be added here */}
    </div>
  );
};

export default AnalysisFilterPane;

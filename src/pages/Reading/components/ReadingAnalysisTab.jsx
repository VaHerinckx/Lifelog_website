import React, { useState } from 'react';
import ReadingPaceChart from './ReadingPaceChart';
import './ReadingAnalysisTab.css';

const ReadingAnalysisTab = ({ books, dateRange }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');

  if (!books || books.length === 0) {
    return (
      <div className="reading-analysis-empty">
        <p>No reading data available for analysis. Add some books to see insights!</p>
      </div>
    );
  }

  return (
    <div className="reading-analysis-container">
      <h2 className="reading-analysis-title">Reading Analysis</h2>
      <p className="reading-analysis-description">
        Discover patterns and trends in your reading habits
      </p>

      <div className="analysis-grid">
        {/* Reading Pace Analysis */}
        <div className="analysis-section">
          <ReadingPaceChart
            data={books}
            dateRange={dateRange}
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
          />
        </div>

        {/* Additional analysis sections will go here */}
        {/* <div className="analysis-section">
          Future analysis component
        </div> */}
      </div>
    </div>
  );
};

export default ReadingAnalysisTab;

// src/pages/Reading/components/ReadingAnalysisTab.jsx
import React, { useState, useEffect } from 'react';
import ReadingPaceChart from './ReadingPaceChart';
import AnalysisFilterPane from './AnalysisFilterPane';
import './ReadingAnalysisTab.css';

const ReadingAnalysisTab = ({ books, dateRange }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [filteredData, setFilteredData] = useState([]);
  const [currentDateRange, setCurrentDateRange] = useState(dateRange);

  // Filter data when date range changes
  useEffect(() => {
    if (!books || books.length === 0) return;

    const filterData = () => {
      if (!currentDateRange || !currentDateRange.startDate || !currentDateRange.endDate) {
        setFilteredData(books);
        return;
      }

      const startDate = new Date(currentDateRange.startDate);
      const endDate = new Date(currentDateRange.endDate);

      // Set time to include the full day
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);

      const filtered = books.filter(entry => {
        const entryDate = new Date(entry.Timestamp || entry.timestamp);
        return entryDate >= startDate && entryDate <= endDate;
      });

      setFilteredData(filtered);
    };

    filterData();
  }, [books, currentDateRange]);

  // Initialize with passed date range
  useEffect(() => {
    if (dateRange) {
      setCurrentDateRange(dateRange);
    }
  }, [dateRange]);

  // Handle date range changes from the filter
  const handleDateRangeChange = (newRange) => {
    setCurrentDateRange(newRange);
  };

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

      {/* Add the filter pane at the top */}
      <AnalysisFilterPane
        data={books}
        dateColumnName="Timestamp"
        dateRange={currentDateRange}
        onDateRangeChange={handleDateRangeChange}
      />

      <div className="analysis-grid">
        {/* Reading Pace Analysis */}
        <div className="analysis-section">
          <ReadingPaceChart
            data={filteredData}
            dateRange={currentDateRange}
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

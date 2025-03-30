// src/pages/Reading/components/ReadingAnalysisTab.jsx
import React, { useState, useEffect } from 'react';
import ReadingPaceChart from './ReadingPaceChart';
import AnalysisFilterPane from './AnalysisFilterPane';
import './ReadingAnalysisTab.css';

const ReadingAnalysisTab = ({ books, dateRange }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [filteredData, setFilteredData] = useState([]);
  const [currentDateRange, setCurrentDateRange] = useState(dateRange);
  const [selectedTitles, setSelectedTitles] = useState([]);
  const [selectedAuthors, setSelectedAuthors] = useState([]);

  // Apply all filters when filter criteria change
  useEffect(() => {
    if (!books || books.length === 0) return;

    const applyFilters = () => {
      let filtered = [...books];

      // Apply date range filter
      if (currentDateRange && currentDateRange.startDate && currentDateRange.endDate) {
        const startDate = new Date(currentDateRange.startDate);
        const endDate = new Date(currentDateRange.endDate);

        // Set time to include the full day
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);

        filtered = filtered.filter(entry => {
          const entryDate = new Date(entry.Timestamp || entry.timestamp);
          return entryDate >= startDate && entryDate <= endDate;
        });
      }

      // Apply title filter
      if (selectedTitles.length > 0) {
        filtered = filtered.filter(entry =>
          selectedTitles.includes(entry.Title || entry.title)
        );
      }

      // Apply author filter
      if (selectedAuthors.length > 0) {
        filtered = filtered.filter(entry =>
          selectedAuthors.includes(entry.Author || entry.author)
        );
      }

      setFilteredData(filtered);
    };

    applyFilters();
  }, [books, currentDateRange, selectedTitles, selectedAuthors]);

  // Initialize with passed date range
  useEffect(() => {
    if (dateRange) {
      setCurrentDateRange(dateRange);
    }
  }, [dateRange]);

  // Handle filter changes
  const handleDateRangeChange = (newRange) => {
    setCurrentDateRange(newRange);
  };

  const handleTitleChange = (titles) => {
    setSelectedTitles(titles);
  };

  const handleAuthorChange = (authors) => {
    setSelectedAuthors(authors);
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

      {/* Filter pane with all filters */}
      <AnalysisFilterPane
        data={books}
        dateColumnName="Timestamp"
        dateRange={currentDateRange}
        onDateRangeChange={handleDateRangeChange}
        selectedTitles={selectedTitles}
        onTitleChange={handleTitleChange}
        selectedAuthors={selectedAuthors}
        onAuthorChange={handleAuthorChange}
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

        {/* Additional analysis sections can be added here */}
        {/* <div className="analysis-section">
          Future analysis component
        </div> */}
      </div>
    </div>
  );
};

export default ReadingAnalysisTab;

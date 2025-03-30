// src/pages/Reading/components/ReadingAnalysisTab.jsx
import React, { useState, useEffect } from 'react';
import TimeSeriesBarChart from '../../../components/charts/TimeSeriesBarChart';
import IntensityHeatmap from '../../../components/charts/IntensityHeatmap';
import AnalysisFilterPane from './AnalysisFilterPane';
import './ReadingAnalysisTab.css';

const ReadingAnalysisTab = ({ books, dateRange }) => {
  const [filteredData, setFilteredData] = useState([]);
  const [currentDateRange, setCurrentDateRange] = useState(dateRange);
  const [selectedTitles, setSelectedTitles] = useState([]);
  const [selectedAuthors, setSelectedAuthors] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedFictionTypes, setSelectedFictionTypes] = useState([]);

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

      // Apply genre filter
      if (selectedGenres.length > 0) {
        filtered = filtered.filter(entry => {
          const entryGenre = entry.Genre || entry.genre;
          return selectedGenres.includes(entryGenre);
        });
      }

      // Apply fiction/non-fiction filter
      if (selectedFictionTypes.length > 0) {
        filtered = filtered.filter(entry => {
          const fictionField = entry.Fiction_yn || entry.fiction || entry.fiction_yn;

          // Determine the fiction type based on various possible field formats
          let fictionType = null;
          if (fictionField === true || fictionField === 'fiction' || fictionField === 'true') {
            fictionType = 'Fiction';
          } else if (fictionField === false || fictionField === 'non-fiction' || fictionField === 'false') {
            fictionType = 'Non-Fiction';
          }

          return selectedFictionTypes.includes(fictionType);
        });
      }

      setFilteredData(filtered);
    };

    applyFilters();
  }, [books, currentDateRange, selectedTitles, selectedAuthors, selectedGenres, selectedFictionTypes]);

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

  const handleGenreChange = (genres) => {
    setSelectedGenres(genres);
  };

  const handleFictionTypeChange = (types) => {
    setSelectedFictionTypes(types);
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
        selectedGenres={selectedGenres}
        onGenreChange={handleGenreChange}
        selectedFictionTypes={selectedFictionTypes}
        onFictionTypeChange={handleFictionTypeChange}
      />

      <div className="analysis-grid">
        {/* Reading Pace Analysis using the reusable component */}
        <div className="analysis-section">
          <TimeSeriesBarChart
            data={filteredData}
            dateColumnName="Timestamp"
            metricColumnName="page_split"
            title="Total Pages Read by Period"
            yAxisLabel="Pages"
          />
        </div>

        {/* Reading Activity Heatmap using the reusable component */}
        <div className="analysis-section">
          <IntensityHeatmap
            data={filteredData}
            dateColumnName="Timestamp"
            valueColumnName="page_split"
            title="Reading Activity by Day and Time"
            treatMidnightAsUnknown={true} // optional, this is the default
          />
        </div>
      </div>
    </div>
  );
};

export default ReadingAnalysisTab;

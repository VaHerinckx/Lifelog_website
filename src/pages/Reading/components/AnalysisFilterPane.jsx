// src/pages/Reading/components/AnalysisFilterPane.jsx
import React, { useMemo } from 'react';
import { Book, User, Calendar, BookOpen, Tag } from 'lucide-react';
import AdvancedDateRangeSlider from '../../../components/ui/Slicers/AdvancedDateRangeSlider/AdvancedDateRangeSlider';
import MultiSelectDropdown from '../../../components/ui/Slicers/MultiSelectDropdown/MultiSelectDropdown';
import './AnalysisFilterPane.css';

const AnalysisFilterPane = ({
  data,
  dateColumnName = 'Timestamp',
  dateRange,
  onDateRangeChange,
  selectedTitles = [],
  onTitleChange,
  selectedAuthors = [],
  onAuthorChange,
  selectedGenres = [],
  onGenreChange,
  selectedFictionTypes = [],
  onFictionTypeChange
}) => {
  // Extract unique titles, authors, genres, and fiction/non-fiction types from data
  const { uniqueTitles, uniqueAuthors, uniqueGenres, uniqueFictionTypes } = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) {
      return {
        uniqueTitles: [],
        uniqueAuthors: [],
        uniqueGenres: [],
        uniqueFictionTypes: []
      };
    }

    // Extract and sort titles and authors
    const titles = [...new Set(data
      .map(item => item.Title || item.title)
      .filter(Boolean))]
      .sort((a, b) => a.localeCompare(b));

    const authors = [...new Set(data
      .map(item => item.Author || item.author)
      .filter(Boolean))]
      .sort((a, b) => a.localeCompare(b));

    // Extract and sort genres
    const genres = [...new Set(data
      .map(item => item.Genre || item.genre)
      .filter(Boolean))]
      .sort((a, b) => a.localeCompare(b));

    // Extract fiction/non-fiction types
    // Look for Fiction_yn, fiction, or fiction_yn fields
    const fictionValues = data.map(item => {
      // Handle different possible field names
      const fictionField = item.Fiction_yn || item.fiction || item.fiction_yn;

      if (fictionField === true || fictionField === 'fiction' || fictionField === 'true') {
        return 'Fiction';
      } else if (fictionField === false || fictionField === 'non-fiction' || fictionField === 'false') {
        return 'Non-Fiction';
      }

      return null;
    }).filter(Boolean);

    const fictionTypes = [...new Set(fictionValues)];

    return {
      uniqueTitles: titles,
      uniqueAuthors: authors,
      uniqueGenres: genres,
      uniqueFictionTypes: fictionTypes
    };
  }, [data]);

  return (
    <div className="analysis-filter-pane">
      <div className="filter-pane-header">
        <h3>Analysis Filters</h3>
        <p>Filter your reading data for more targeted analysis</p>
      </div>

      <div className="filter-pane-grid">
        <div className="filter-item">
          <AdvancedDateRangeSlider
            data={data}
            dateColumnName={dateColumnName}
            onChange={onDateRangeChange}
            initialStartDate={dateRange?.startDate}
            initialEndDate={dateRange?.endDate}
            title="Filter by Date"
          />
        </div>

        <div className="filter-item">
          <MultiSelectDropdown
            options={uniqueTitles}
            selectedValues={selectedTitles}
            onChange={onTitleChange}
            placeholder="Select books..."
            label="Filter by Book Title"
            searchPlaceholder="Search books..."
            icon={<Book size={16} />}
          />
        </div>

        <div className="filter-item">
          <MultiSelectDropdown
            options={uniqueAuthors}
            selectedValues={selectedAuthors}
            onChange={onAuthorChange}
            placeholder="Select authors..."
            label="Filter by Author"
            searchPlaceholder="Search authors..."
            icon={<User size={16} />}
          />
        </div>

        <div className="filter-item">
          <MultiSelectDropdown
            options={uniqueGenres}
            selectedValues={selectedGenres}
            onChange={onGenreChange}
            placeholder="Select genres..."
            label="Filter by Genre"
            searchPlaceholder="Search genres..."
            icon={<Tag size={16} />}
          />
        </div>

        <div className="filter-item">
          <MultiSelectDropdown
            options={uniqueFictionTypes}
            selectedValues={selectedFictionTypes}
            onChange={onFictionTypeChange}
            placeholder="Select type..."
            label="Filter by Type"
            searchPlaceholder="Fiction or Non-Fiction..."
            icon={<BookOpen size={16} />}
          />
        </div>
      </div>
    </div>
  );
};

export default AnalysisFilterPane;

// src/pages/Reading/components/AnalysisFilterPane.jsx
import React, { useMemo } from 'react';
import { Book, User, Calendar } from 'lucide-react';
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
  onAuthorChange
}) => {
  // Extract unique titles and authors from data
  const { uniqueTitles, uniqueAuthors } = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) {
      return { uniqueTitles: [], uniqueAuthors: [] };
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

    return { uniqueTitles: titles, uniqueAuthors: authors };
  }, [data]);

  return (
    <div className="analysis-filter-pane">

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
      </div>
    </div>
  );
};

export default AnalysisFilterPane;

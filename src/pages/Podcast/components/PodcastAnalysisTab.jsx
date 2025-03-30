// src/pages/Podcast/components/PodcastAnalysisTab.jsx
import React, { useState } from 'react';
import { Podcast, Tag } from 'lucide-react';
import TimeSeriesBarChart from '../../../components/charts/TimeSeriesBarChart';
import IntensityHeatmap from '../../../components/charts/IntensityHeatmap';
import TopPodcastsChart from '../../../components/charts/TopPodcastsChart';
import TreemapGenre from '../../../components/charts/TreemapGenre';
import AdvancedDateRangeSlider from '../../../components/ui/Slicers/AdvancedDateRangeSlider/AdvancedDateRangeSlider';
import MultiSelectDropdown from '../../../components/ui/Slicers/MultiSelectDropdown/MultiSelectDropdown';
import './PodcastAnalysisTab.css';

const PodcastAnalysisTab = ({
  podcastData,
  uniquePodcasts,
  uniqueGenres,
  selectedPodcasts,
  setSelectedPodcasts,
  selectedGenres,
  setSelectedGenres,
  dateRange,
  setDateRange
}) => {
  // Local state
  const [selectedPodcastInfo, setSelectedPodcastInfo] = useState(null);

  // Handle podcast selection changes
  const handlePodcastChange = (podcasts) => {
    setSelectedPodcasts(podcasts);

    // Set the selected podcast info for display if only one podcast is selected
    if (podcasts.length === 1 && podcastData) {
      const podcastInfo = podcastData.find(item => item.podcast_name === podcasts[0]);
      if (podcastInfo) {
        setSelectedPodcastInfo({
          name: podcastInfo.podcast_name,
          artist: podcastInfo.artist,
          artwork: podcastInfo.artwork_large,
          genre: podcastInfo.genre
        });
      }
    } else {
      setSelectedPodcastInfo(null);
    }
  };

  // Handle genre selection changes
  const handleGenreChange = (genres) => {
    setSelectedGenres(genres);
  };

  // Handle date range changes
  const handleDateRangeChange = (newRange) => {
    setDateRange(newRange);
  };

  // Main filter function for data
  const filterData = () => {
    if (!podcastData || !dateRange.startDate || !dateRange.endDate) return [];

    return podcastData.filter(item => {
      const itemDate = new Date(item['modified at']);
      if (isNaN(itemDate.getTime()) || itemDate.getFullYear() <= 1970) {
        return false;
      }

      // Filter by podcast if selected
      if (selectedPodcasts.length > 0 && !selectedPodcasts.includes(item['podcast_name'])) {
        return false;
      }

      // Filter by genre if selected
      if (selectedGenres.length > 0) {
        // Clean up genre value for matching
        let itemGenre = item.genre;
        if (itemGenre && (itemGenre.includes('https://') ||
                          itemGenre.includes('image/thumb') ||
                          itemGenre.length > 30)) {
          itemGenre = 'Unknown';
        }

        if (!selectedGenres.includes(itemGenre)) {
          return false;
        }
      }

      // Filter by date range
      const start = new Date(dateRange.startDate);
      const end = new Date(dateRange.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);

      return itemDate >= start && itemDate <= end;
    });
  };

  // Get filtered data
  const filteredData = filterData();

  return (
    <div className="podcast-analysis-container">
      <h2 className="podcast-analysis-title">Podcast Analytics</h2>
      <p className="podcast-analysis-description">
        Discover patterns and insights in your podcast listening habits
      </p>

      <div className="filters-section">
        <div className="filter-pane-grid">
          {/* Date Range Filter on the left */}
          <div className="filter-item date-filter">
            <AdvancedDateRangeSlider
              data={podcastData}
              dateColumnName="modified at"
              onChange={handleDateRangeChange}
              initialStartDate={dateRange.startDate}
              initialEndDate={dateRange.endDate}
              title="Filter by Date"
            />
          </div>

          {/* Podcast MultiSelect Filter */}
          <div className="filter-item">
            <MultiSelectDropdown
              options={uniquePodcasts}
              selectedValues={selectedPodcasts}
              onChange={handlePodcastChange}
              placeholder="Select podcasts..."
              label="Filter by Podcast"
              searchPlaceholder="Search podcasts..."
              icon={<Podcast size={16} />}
            />
          </div>

          {/* Genre MultiSelect Filter */}
          <div className="filter-item">
            <MultiSelectDropdown
              options={uniqueGenres}
              selectedValues={selectedGenres}
              onChange={handleGenreChange}
              placeholder="Select genres..."
              label="Filter by Genre"
              searchPlaceholder="Search genres..."
              icon={<Tag size={16} />}
            />
          </div>
        </div>

        {selectedPodcastInfo && (
          <div className="podcast-info">
            <div className="podcast-header">
              <img
                src={selectedPodcastInfo.artwork}
                alt={`${selectedPodcastInfo.name} artwork`}
                className="podcast-large-artwork"
              />
              <div className="podcast-details">
                <h2>{selectedPodcastInfo.name}</h2>
                <p className="podcast-artist">{selectedPodcastInfo.artist}</p>
                <p className="podcast-genre">{selectedPodcastInfo.genre}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="charts-grid">
        <div className="chart-container">
          {/* Using our reusable TimeSeriesBarChart component */}
          <TimeSeriesBarChart
            data={filteredData}
            dateColumnName="modified at"
            metricColumnName="duration"
            title="Listening Time by Period"
            yAxisLabel="Minutes"
          />
        </div>

        <div className="chart-container">
          <IntensityHeatmap
            data={filteredData}
            dateColumnName="modified at"
            valueColumnName="duration"
            title="Listening Activity by Day and Time"
            treatMidnightAsUnknown={false}
          />
        </div>

        <div className="chart-container">
          <TopPodcastsChart data={filteredData} dateRange={dateRange} />
        </div>

        <div className="chart-container">
          <TreemapGenre
            data={filteredData}
            selectedPodcast={selectedPodcasts.length === 1 ? selectedPodcasts[0] : 'all'}
            dateRange={dateRange}
          />
        </div>
      </div>
    </div>
  );
};

export default PodcastAnalysisTab;

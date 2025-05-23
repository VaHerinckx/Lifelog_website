// src/pages/Podcast/components/PodcastAnalysisTab.jsx
import React, { useState, useEffect } from 'react';
import { Podcast, Tag, Calendar } from 'lucide-react';
import TimeSeriesBarChart from '../../../components/charts/TimeSeriesBarChart';
import IntensityHeatmap from '../../../components/charts/IntensityHeatmap';
import TopPodcastsChart from '../../../components/charts/TopPodcastsChart';
import TreemapGenre from '../../../components/charts/TreemapGenre';
import FilteringPanel from '../../../components/ui/Filters/FilteringPanel/FilteringPanel';
import './PodcastAnalysisTab.css';

const PodcastAnalysisTab = ({ podcastData }) => {
  // Local state for filtered data and selected podcast info
  const [filteredData, setFilteredData] = useState([]);
  const [selectedPodcastInfo, setSelectedPodcastInfo] = useState(null);
  const [filters, setFilters] = useState({});

  // Define filter configurations for FilteringPanel
  const filterConfigs = [
    {
      key: 'dateRange',
      type: 'daterange',
      label: 'Listening Date',
      dataField: 'modified at',
      icon: <Calendar size={16} />,
      placeholder: 'Select date range'
    },
    {
      key: 'podcasts',
      type: 'multiselect',
      label: 'Podcasts',
      optionsSource: 'podcast_name',
      dataField: 'podcast_name',
      icon: <Podcast size={16} />,
      placeholder: 'Select podcasts',
      searchPlaceholder: 'Search podcasts...'
    },
    {
      key: 'genres',
      type: 'multiselect',
      label: 'Genres',
      optionsSource: 'genre',
      dataField: 'genre',
      icon: <Tag size={16} />,
      placeholder: 'Select genres',
      searchPlaceholder: 'Search genres...'
    }
  ];

  // Handle filter changes from FilteringPanel
  const handleFiltersChange = (newFilters) => {
    console.log('🎧 Podcast filters changed:', newFilters);
    setFilters(newFilters);
  };

  // Apply filters whenever filters or data change
  useEffect(() => {
    if (!podcastData || podcastData.length === 0) {
      setFilteredData([]);
      return;
    }

    let filtered = [...podcastData];

    // Apply date range filter
    if (filters.dateRange && (filters.dateRange.startDate || filters.dateRange.endDate)) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item['modified at']);
        if (isNaN(itemDate.getTime()) || itemDate.getFullYear() <= 1970) {
          return false;
        }

        const startDate = filters.dateRange.startDate ? new Date(filters.dateRange.startDate) : null;
        const endDate = filters.dateRange.endDate ? new Date(filters.dateRange.endDate) : null;

        if (startDate) {
          startDate.setHours(0, 0, 0, 0);
          if (itemDate < startDate) return false;
        }

        if (endDate) {
          endDate.setHours(23, 59, 59, 999);
          if (itemDate > endDate) return false;
        }

        return true;
      });
    }

    // Apply podcast filter (multi-select)
    if (filters.podcasts && Array.isArray(filters.podcasts) && filters.podcasts.length > 0) {
      filtered = filtered.filter(item => filters.podcasts.includes(item['podcast_name']));
    }

    // Apply genre filter (multi-select)
    if (filters.genres && Array.isArray(filters.genres) && filters.genres.length > 0) {
      filtered = filtered.filter(item => {
        // Clean up genre value for matching
        let itemGenre = item.genre;
        if (itemGenre && (itemGenre.includes('https://') ||
                          itemGenre.includes('image/thumb') ||
                          itemGenre.length > 30)) {
          itemGenre = 'Unknown';
        }

        return filters.genres.includes(itemGenre);
      });
    }

    setFilteredData(filtered);

    // Handle selected podcast info display
    if (filters.podcasts && filters.podcasts.length === 1) {
      const podcastInfo = podcastData.find(item => item.podcast_name === filters.podcasts[0]);
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
  }, [filters, podcastData]);

  return (
    <div className="podcast-analysis-container">
      <h2 className="podcast-analysis-title">Podcast Analytics</h2>
      <p className="podcast-analysis-description">
        Discover patterns and insights in your podcast listening habits
      </p>

      {/* FilteringPanel handles all filter logic internally */}
      <FilteringPanel
        data={podcastData}
        filterConfigs={filterConfigs}
        onFiltersChange={handleFiltersChange}
        title="Podcast Filters"
        description="Filter your podcast data for detailed analysis"
      />

      {/* Selected podcast info display */}
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

      <div className="charts-grid">
        <div className="chart-container">
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
          <TopPodcastsChart
            data={filteredData}
            dateRange={filters.dateRange || { startDate: null, endDate: null }}
          />
        </div>

        <div className="chart-container">
          <TreemapGenre
            data={filteredData}
            selectedPodcast={filters.podcasts?.length === 1 ? filters.podcasts[0] : 'all'}
            dateRange={filters.dateRange || { startDate: null, endDate: null }}
          />
        </div>
      </div>
    </div>
  );
};

export default PodcastAnalysisTab;

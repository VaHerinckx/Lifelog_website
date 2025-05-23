// src/pages/Podcast/PodcastPage.jsx

import React, { useState, useEffect } from 'react';
import _ from 'lodash';
import './PodcastPage.css';
import './components/PodcastPageTabs.css';
import { Podcast, BarChart2, Headphones, Clock, Music, Percent, Calendar, Tag } from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useData } from '../../context/DataContext';
import PodcastAnalysisTab from './components/PodcastAnalysisTab';
import EpisodeList from './components/EpisodeList';
import CardsPanel from '../../components/ui/CardsPanel/CardsPanel';
import FilteringPanel from '../../components/ui/Filters/FilteringPanel/FilteringPanel';

const PodcastPage = () => {
  // Get data and functions from context
  const { data, loading, error, fetchData } = useData();

  // State for active tab
  const [activeTab, setActiveTab] = useState('podcasts');

  // State for filters - now managed at the page level
  const [filters, setFilters] = useState({});
  const [filteredData, setFilteredData] = useState([]);
  const [selectedPodcastInfo, setSelectedPodcastInfo] = useState(null);

  // State to store podcast stats (calculated from filtered data)
  const [podcastStats, setPodcastStats] = useState({
    totalEpisodes: 0,
    totalListeningTime: 0,
    uniquePodcasts: 0,
    avgCompletion: 0
  });

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

  // Fetch podcast data when component mounts
  useEffect(() => {
    fetchData('podcast');
  }, [fetchData]);

  // Handle filter changes from FilteringPanel
  const handleFiltersChange = (newFilters) => {
    console.log('🎧 Podcast filters changed:', newFilters);
    setFilters(newFilters);
  };

  // Apply filters whenever filters or data change
  useEffect(() => {
    if (!data.podcast || data.podcast.length === 0) {
      setFilteredData([]);
      return;
    }

    let filtered = [...data.podcast];

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
      const podcastInfo = data.podcast.find(item => item.podcast_name === filters.podcasts[0]);
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
  }, [filters, data.podcast]);

  // Calculate podcast stats from filtered data
  useEffect(() => {
    if (filteredData.length > 0) {
      // Calculate stats for KPI cards based on filtered data
      const totalEpisodes = filteredData.length;

      // Total listening time in minutes with careful parsing
      const durations = filteredData.map(episode => {
        const duration = episode.duration;
        if (duration !== undefined && duration !== null) {
          const parsedDuration = parseFloat(duration);
          if (!isNaN(parsedDuration)) {
            return parsedDuration / 60; // Convert seconds to minutes
          }
        }
        return 0;
      });

      const totalMinutes = Math.round(_.sum(durations));

      // Unique podcast count from filtered data
      const uniquePodcastCount = _.uniq(filteredData.map(item => item['podcast_name'])).filter(Boolean).length;

      // Average completion rate from filtered data
      const completionValues = filteredData.map(episode => {
        const completionPercent = episode['completion_%'];
        const completion = episode.completion;

        if (completionPercent !== undefined && completionPercent !== null) {
          const parsedValue = parseFloat(completionPercent);
          if (!isNaN(parsedValue)) {
            return Math.min(parsedValue, 100);
          }
        }

        if (completion !== undefined && completion !== null) {
          const parsedValue = parseFloat(completion);
          if (!isNaN(parsedValue)) {
            const percentage = parsedValue * 100;
            return Math.min(percentage, 100);
          }
        }

        return 100;
      });

      const avgCompletion = Math.round(_.mean(completionValues));

      setPodcastStats({
        totalEpisodes,
        totalListeningTime: totalMinutes,
        uniquePodcasts: uniquePodcastCount,
        avgCompletion
      });
    } else {
      // Reset stats when no filtered data
      setPodcastStats({
        totalEpisodes: 0,
        totalListeningTime: 0,
        uniquePodcasts: 0,
        avgCompletion: 0
      });
    }
  }, [filteredData]);

  // Handle episode click (for future functionality like episode details modal)
  const handleEpisodeClick = (episode) => {
    console.log('Episode clicked:', episode);
    // TODO: Implement episode details modal or actions
  };

  // Prepare cards data for CardsPanel
  const prepareStatsCards = () => {
    return [
      {
        value: podcastStats.totalEpisodes.toLocaleString(),
        label: "Episodes Listened",
        icon: <Headphones size={24} />
      },
      {
        value: podcastStats.totalListeningTime.toLocaleString() || "0",
        label: "Total Minutes",
        icon: <Clock size={24} />
      },
      {
        value: podcastStats.uniquePodcasts.toLocaleString(),
        label: "Unique Podcasts",
        icon: <Music size={24} />
      },
      {
        value: `${Math.min(podcastStats.avgCompletion, 100)}%`,
        label: "Avg. Completion",
        icon: <Percent size={24} />
      }
    ];
  };

  if (loading.podcast) {
    return <LoadingSpinner centerIcon={Podcast} />;
  }

  if (error.podcast) {
    return <div className="error">Error loading podcast data: {error.podcast}</div>;
  }

  return (
    <div className="page-container">
      <h1>Podcast Tracking</h1>
      <p className="page-description">Monitor your podcast listening habits and discover insights</p>

      {/* FilteringPanel - now at the page level, affects all tabs */}
      <FilteringPanel
        data={data.podcast || []}
        filterConfigs={filterConfigs}
        onFiltersChange={handleFiltersChange}
        title="Podcast Filters"
        description="Filter your podcast data across all views"
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

      {/* Tab Navigation */}
      <div className="page-tabs">
        <button
          className={`page-tab ${activeTab === 'podcasts' ? 'active' : ''}`}
          onClick={() => setActiveTab('podcasts')}
        >
          <Podcast size={18} style={{ marginRight: '8px' }} />
          Episodes
        </button>
        <button
          className={`page-tab ${activeTab === 'analysis' ? 'active' : ''}`}
          onClick={() => setActiveTab('analysis')}
        >
          <BarChart2 size={18} style={{ marginRight: '8px' }} />
          Analysis
        </button>
      </div>

      {/* Episodes Tab Content */}
      {activeTab === 'podcasts' && (
        <div className="podcasts-content">
          {/* KPI Cards using CardsPanel - now shows filtered stats */}
          <CardsPanel
            title="Podcast Statistics"
            description={`Your listening progress at a glance ${filteredData.length < (data.podcast?.length || 0) ? '(filtered)' : ''}`}
            cards={prepareStatsCards()}
            loading={loading?.podcast}
          />

          {/* Episode List - replaces the "coming soon" message */}
          <EpisodeList
            episodes={filteredData}
            onEpisodeClick={handleEpisodeClick}
          />
        </div>
      )}

      {/* Analysis Tab Content - now receives filtered data */}
      {activeTab === 'analysis' && (
        <PodcastAnalysisTab
          podcastData={filteredData}
          selectedPodcastInfo={selectedPodcastInfo}
          currentFilters={filters}
        />
      )}
    </div>
  );
};

export default PodcastPage;

// src/pages/Podcast/PodcastPage.jsx
import React, { useState, useEffect } from 'react';
import _ from 'lodash';
import './PodcastPage.css';
import './components/PodcastPageTabs.css';
import { Podcast, BarChart2 } from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useData } from '../../context/DataContext';
import PodcastAnalysisTab from './components/PodcastAnalysisTab';

const PodcastPage = () => {
  // Get data and functions from context
  const { data, loading, error, fetchData } = useData();

  // State for active tab
  const [activeTab, setActiveTab] = useState('analysis'); // Default to analysis tab

  // Local state
  const [uniquePodcasts, setUniquePodcasts] = useState([]);
  const [uniqueGenres, setUniqueGenres] = useState([]);
  const [selectedPodcasts, setSelectedPodcasts] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null
  });

  // Fetch podcast data when component mounts
  useEffect(() => {
    fetchData('podcast');
  }, [fetchData]);

  // Process dates, podcasts, and genres when data is loaded
  useEffect(() => {
    if (data.podcast) {
      // Get unique podcasts
      const podcasts = _.uniq(data.podcast.map(item => item['podcast_name'])).filter(Boolean);
      setUniquePodcasts(podcasts);

      // Get unique genres with proper filtering for problematic entries
      const cleanedGenres = data.podcast
        .map(item => {
          // Clean up invalid genre entries (URLs, image paths, etc.)
          if (!item.genre) return null;
          if (item.genre.includes('https://') ||
              item.genre.includes('image/thumb') ||
              item.genre.length > 30) {
            return 'Unknown';
          }
          return item.genre;
        })
        .filter(Boolean); // Filter out null/undefined/empty values

      // Get unique cleaned genres
      const genres = _.uniq(cleanedGenres).sort();
      setUniqueGenres(genres);

      // Process and filter dates
      const validDates = data.podcast
        .map(item => new Date(item['modified at']))
        .filter(date => !isNaN(date.getTime()) && date.getFullYear() > 1970)
        .sort((a, b) => a - b);

      if (validDates.length > 0) {
        const startDate = validDates[0].toISOString().split('T')[0];
        const endDate = validDates[validDates.length - 1].toISOString().split('T')[0];
        setDateRange({ startDate, endDate });
      }
    }
  }, [data.podcast]);

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

      {/* Tab Navigation */}
      <div className="page-tabs">
        <button
          className={`page-tab ${activeTab === 'podcasts' ? 'active' : ''}`}
          onClick={() => setActiveTab('podcasts')}
        >
          <Podcast size={18} style={{ marginRight: '8px' }} />
          Podcasts
        </button>
        <button
          className={`page-tab ${activeTab === 'analysis' ? 'active' : ''}`}
          onClick={() => setActiveTab('analysis')}
        >
          <BarChart2 size={18} style={{ marginRight: '8px' }} />
          Analysis
        </button>
      </div>

      {/* Podcasts Tab Content */}
      {activeTab === 'podcasts' && (
        <div className="podcasts-tab-content">
          <p className="coming-soon-message">Podcast listing functionality coming soon!</p>
          {/* This tab will be implemented later */}
        </div>
      )}

      {/* Analysis Tab Content */}
      {activeTab === 'analysis' && (
        <PodcastAnalysisTab
          podcastData={data.podcast}
          uniquePodcasts={uniquePodcasts}
          uniqueGenres={uniqueGenres}
          selectedPodcasts={selectedPodcasts}
          setSelectedPodcasts={setSelectedPodcasts}
          selectedGenres={selectedGenres}
          setSelectedGenres={setSelectedGenres}
          dateRange={dateRange}
          setDateRange={setDateRange}
        />
      )}
    </div>
  );
};

export default PodcastPage;

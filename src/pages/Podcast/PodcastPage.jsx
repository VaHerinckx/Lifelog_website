// PodcastPage.jsx with added debugging logs

import React, { useState, useEffect } from 'react';
import _ from 'lodash';
import './PodcastPage.css';
import './components/PodcastPageTabs.css';
import { Podcast, BarChart2, Headphones, Clock, Music, Percent } from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useData } from '../../context/DataContext';
import PodcastAnalysisTab from './components/PodcastAnalysisTab';
import KpiCard from '../../components/charts/KpiCard';

const PodcastPage = () => {
  // Get data and functions from context
  const { data, loading, error, fetchData } = useData();

  // State for active tab
  const [activeTab, setActiveTab] = useState('podcasts'); // Default to podcasts tab

  // State to store podcast stats
  const [podcastStats, setPodcastStats] = useState({
    totalEpisodes: 0,
    totalListeningTime: 0,
    uniquePodcasts: 0,
    avgCompletion: 0
  });

  // Local state (from original component)
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

  // Process podcast data when it's loaded
  useEffect(() => {
    if (data.podcast && data.podcast.length > 0) {
      // DEBUG: Log first few podcast entries to inspect data structure

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

      // Calculate stats for KPI cards
      // Total episodes
      const totalEpisodes = data.podcast.length;

      // DEBUG: Log information about duration field
      const durationSamples = data.podcast.slice(0, 10).map(ep => ({
        duration: ep.duration,
        type: typeof ep.duration,
        parsed: parseFloat(ep.duration),
        minutes: parseFloat(ep.duration) / 60
      }));

      // Total listening time in minutes with more careful parsing
      const durations = data.podcast.map(episode => {
        const duration = episode.duration;
        // Check if duration exists and is a valid number
        if (duration !== undefined && duration !== null) {
          const parsedDuration = parseFloat(duration);
          if (!isNaN(parsedDuration)) {
            return parsedDuration / 60; // Convert seconds to minutes
          }
        }
        return 0; // Return 0 for invalid durations
      });

      const totalMinutes = Math.round(_.sum(durations));

      // Unique podcast count
      const uniquePodcastCount = podcasts.length;

      // DEBUG: Log information about completion fields
      const completionSamples = data.podcast.slice(0, 10).map(ep => ({
        completion_percent: ep['completion_%'],
        completion: ep.completion,
        type_percent: typeof ep['completion_%'],
        type_completion: typeof ep.completion
      }));

      // Average completion rate - with more careful calculation
      const completionValues = data.podcast.map(episode => {
        // Using bracket notation for properties with special characters
        const completionPercent = episode['completion_%'];
        const completion = episode.completion;

        if (completionPercent !== undefined && completionPercent !== null) {
          const parsedValue = parseFloat(completionPercent);
          if (!isNaN(parsedValue)) {
            // DEBUG: Log high values
            if (parsedValue > 100) {
              console.log("Abnormal completion_%:", episode);
            }
            return Math.min(parsedValue, 100); // Cap at 100%
          }
        }

        if (completion !== undefined && completion !== null) {
          const parsedValue = parseFloat(completion);
          if (!isNaN(parsedValue)) {
            // Assuming it's stored as a decimal
            const percentage = parsedValue * 100;
            // DEBUG: Log high values
            if (percentage > 100) {
              console.log("Abnormal completion:", episode);
            }
            return Math.min(percentage, 100); // Cap at 100%
          }
        }

        return 100; // Default to 100% if we can't determine
      });


      const avgCompletion = Math.round(_.mean(completionValues));

      // Update stats state
      setPodcastStats({
        totalEpisodes,
        totalListeningTime: totalMinutes,
        uniquePodcasts: uniquePodcastCount,
        avgCompletion
      });

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
        <div className="podcasts-content">
          {/* KPI Cards */}
          <div className="podcast-stats-cards">
            <KpiCard
              value={podcastStats.totalEpisodes.toLocaleString()}
              label="Episodes Listened"
              icon={<Headphones size={24} />}
            />

            <KpiCard
              value={podcastStats.totalListeningTime.toLocaleString() || "0"}
              label="Total Minutes"
              icon={<Clock size={24} />}
            />

            <KpiCard
              value={podcastStats.uniquePodcasts.toLocaleString()}
              label="Unique Podcasts"
              icon={<Music size={24} />}
            />

            <KpiCard
              value={`${Math.min(podcastStats.avgCompletion, 100)}%`}
              label="Avg. Completion"
              icon={<Percent size={24} />}
            />
          </div>

          {/* Coming Soon Message (to be replaced with actual podcast list) */}
          <div className="coming-soon-container">
            <p className="coming-soon-message">Podcast listing functionality coming soon!</p>
          </div>
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

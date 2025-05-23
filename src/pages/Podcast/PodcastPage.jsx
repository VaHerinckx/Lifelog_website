// src/pages/Podcast/PodcastPage.jsx

import React, { useState, useEffect } from 'react';
import _ from 'lodash';
import './PodcastPage.css';
import './components/PodcastPageTabs.css';
import { Podcast, BarChart2, Headphones, Clock, Music, Percent } from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useData } from '../../context/DataContext';
import PodcastAnalysisTab from './components/PodcastAnalysisTab';
import CardsPanel from '../../components/ui/CardsPanel/CardsPanel';

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

  // Fetch podcast data when component mounts
  useEffect(() => {
    fetchData('podcast');
  }, [fetchData]);

  // Process podcast data when it's loaded
  useEffect(() => {
    if (data.podcast && data.podcast.length > 0) {
      // Calculate stats for KPI cards
      const totalEpisodes = data.podcast.length;

      // Total listening time in minutes with careful parsing
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
      const uniquePodcastCount = _.uniq(data.podcast.map(item => item['podcast_name'])).filter(Boolean).length;

      // Average completion rate - with careful calculation
      const completionValues = data.podcast.map(episode => {
        // Using bracket notation for properties with special characters
        const completionPercent = episode['completion_%'];
        const completion = episode.completion;

        if (completionPercent !== undefined && completionPercent !== null) {
          const parsedValue = parseFloat(completionPercent);
          if (!isNaN(parsedValue)) {
            return Math.min(parsedValue, 100); // Cap at 100%
          }
        }

        if (completion !== undefined && completion !== null) {
          const parsedValue = parseFloat(completion);
          if (!isNaN(parsedValue)) {
            // Assuming it's stored as a decimal
            const percentage = parsedValue * 100;
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
          {/* KPI Cards using CardsPanel */}
          <CardsPanel
            title="Podcast Statistics"
            description="Your listening progress at a glance"
            cards={prepareStatsCards()}
            loading={loading?.podcast}
          />

          {/* Coming Soon Message (to be replaced with actual podcast list) */}
          <div className="coming-soon-container">
            <p className="coming-soon-message">Podcast listing functionality coming soon!</p>
          </div>
        </div>
      )}

      {/* Analysis Tab Content */}
      {activeTab === 'analysis' && (
        <PodcastAnalysisTab podcastData={data.podcast} />
      )}
    </div>
  );
};

export default PodcastPage;

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Papa from 'papaparse';
import _ from 'lodash';
import './PodcastPage.css';
import { Podcast } from 'lucide-react';
import LoadingSpinner from '../Reusable_components/LoadingSpinner';
import NavigationBar from '../Reusable_components/NavigationBar'; // Add this import
import { DRIVE_FILES, getDriveDownloadUrl } from '../../config/config';
import { useData } from '../../context/DataContext';


// Map of podcast names to their logo URLs
// In a real application, this would come from your backend or a CMS

const PodcastPage = () => {
  // Get data and functions from context
  const { data, loading, error, fetchData } = useData();

  // Local state
  const [uniquePodcasts, setUniquePodcasts] = useState([]);
  const [selectedPodcast, setSelectedPodcast] = useState('all');
  const [selectedPodcastInfo, setSelectedPodcastInfo] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('yearly');
  const [chartData, setChartData] = useState([]);

  // Function to parse date string
  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) return null;
    return new Date(match[1], parseInt(match[2]) - 1, match[3]);
  };

  // Function to get period key for grouping
  const getPeriodKey = (dateStr, period) => {
    const date = parseDate(dateStr);
    if (!date) return 'Unknown';

    switch (period) {
      case 'yearly':
        return date.getFullYear().toString();
      case 'monthly':
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      case 'daily':
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
      default:
        return date.getFullYear().toString();
    }
  };

  // Function to format period label
  const formatPeriodLabel = (key, period) => {
    if (key === 'Unknown') return key;

    switch (period) {
      case 'yearly':
        return key;
      case 'monthly': {
        const [year, month] = key.split('-');
        return `${new Date(year, parseInt(month) - 1).toLocaleString('default', { month: 'short' })} ${year}`;
      }
      case 'daily': {
        const date = new Date(key);
        return date.toLocaleDateString();
      }
      default:
        return key;
    }
  };

  // Function to process listening time data
  const processListeningData = (podcastData, podcastFilter = 'all', period = 'yearly') => {
    const filtered = podcastFilter === 'all'
      ? podcastData
      : podcastData.filter(item => item['podcast_name'] === podcastFilter);

    if (podcastFilter !== 'all' && filtered.length > 0) {
      const podcastInfo = filtered[0];
      setSelectedPodcastInfo({
        name: podcastInfo.podcast_name,
        artist: podcastInfo.artist,
        artwork: podcastInfo.artwork_large,
        genre: podcastInfo.genre
      });
    } else {
      setSelectedPodcastInfo(null);
    }

    const grouped = _.groupBy(filtered, item => getPeriodKey(item['modified at'], period));

    return Object.entries(grouped)
      .map(([key, episodes]) => ({
        period: formatPeriodLabel(key, period),
        totalMinutes: _.sumBy(episodes, episode => {
          const duration = parseFloat(episode['duration']);
          return isNaN(duration) ? 0 : duration / 60;
        }),
        rawPeriod: key
      }))
      .sort((a, b) => a.rawPeriod.localeCompare(b.rawPeriod));
  };

  // Fetch podcast data when component mounts
  useEffect(() => {
    fetchData('podcast');
  }, [fetchData]);

  // Process initial data when it's loaded
  useEffect(() => {
    if (data.podcast) {
      const podcasts = _.uniq(data.podcast.map(item => item['podcast_name'])).filter(Boolean);
      setUniquePodcasts(podcasts);
      const initialChartData = processListeningData(data.podcast, 'all', 'yearly');
      setChartData(initialChartData);
    }
  }, [data.podcast]);

  // Update chart when selections change
  useEffect(() => {
    if (data.podcast) {
      const newChartData = processListeningData(data.podcast, selectedPodcast, selectedPeriod);
      setChartData(newChartData);
    }
  }, [selectedPodcast, selectedPeriod, data.podcast]);

  if (loading.podcast) {
    return (
      <>
        <NavigationBar />
        <LoadingSpinner centerIcon={Podcast} />
      </>
    );
  }

  if (error.podcast) {
    return (
      <>
        <NavigationBar />
        <div className="error">Error loading podcast data: {error.podcast}</div>
      </>
    );
  }

  return (
    <div className="page-container">
      <NavigationBar />
      <div className="podcast-page">
        <h1>Podcast Tracking</h1>
        <p className="page-description">Monitor your podcast listening habits and discover insights</p>

        <div className="filters-section">
          <div className="filter-group">
            <label htmlFor="podcast-select">Select Podcast:</label>
            <select
              id="podcast-select"
              value={selectedPodcast}
              onChange={(e) => setSelectedPodcast(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Podcasts</option>
              {uniquePodcasts.map(podcast => (
                <option key={podcast} value={podcast}>{podcast}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="period-select">Time Period:</label>
            <select
              id="period-select"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="filter-select"
            >
              <option value="yearly">Yearly</option>
              <option value="monthly">Monthly</option>
              <option value="daily">Daily</option>
            </select>
          </div>

          {selectedPodcastInfo && (
            <div className="podcast-info">
              <div className="podcast-header">
                <img
                  src={selectedPodcastInfo.artwork}
                  alt={`${selectedPodcastInfo.name} artwork`}
                  className="podcast-artwork"
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

        <div className="chart-container">
          <h2>Listening Time by {selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)} Period</h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="period"
                angle={selectedPeriod === 'monthly' || selectedPeriod === 'daily' ? -45 : 0}
                textAnchor="end"
                height={80}
              />
              <YAxis label={{ value: 'Minutes Listened', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(value) => `${Math.round(value)} minutes`} />
              <Legend />
              <Bar dataKey="totalMinutes" name="Minutes Listened" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default PodcastPage;

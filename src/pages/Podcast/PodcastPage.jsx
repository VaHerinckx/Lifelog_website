// src/pages/Podcast/PodcastPage.jsx
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import _ from 'lodash';
import './PodcastPage.css';
import { Podcast } from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useData } from '../../context/DataContext';
import ListeningHeatmap from '../../components/charts/ListeningHeatmap';
import TopPodcastsChart from '../../components/charts/TopPodcastsChart';
import 'react-range-slider-input/dist/style.css';

const PodcastPage = () => {
  // Get data and functions from context
  const { data, loading, error, fetchData } = useData();

  // Local state
  const [uniquePodcasts, setUniquePodcasts] = useState([]);
  const [selectedPodcast, setSelectedPodcast] = useState('all');
  const [selectedPodcastInfo, setSelectedPodcastInfo] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('yearly');
  const [chartData, setChartData] = useState([]);
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null
  });
  const [allDates, setAllDates] = useState([]);
  const [sliderValues, setSliderValues] = useState([0, 100]);

  // Fetch podcast data when component mounts
  useEffect(() => {
    fetchData('podcast');
  }, [fetchData]);

  // Initialize date range when data is loaded
  useEffect(() => {
    if (data.podcast) {
      const podcasts = _.uniq(data.podcast.map(item => item['podcast_name'])).filter(Boolean);
      setUniquePodcasts(podcasts);
      const dates = data.podcast
        .map(item => new Date(item['modified at']))
        .filter(date => !isNaN(date.getTime()))
        .sort((a, b) => a - b);

      if (dates.length > 0) {
        setAllDates(dates);
        setDateRange({
          startDate: dates[0].toISOString().split('T')[0],
          endDate: dates[dates.length - 1].toISOString().split('T')[0]
        });
      }
    }
  }, [data.podcast]);

  const handleSliderChange = (values) => {
    setSliderValues(values);
    const startIdx = Math.floor((values[0] / 100) * (allDates.length - 1));
    const endIdx = Math.floor((values[1] / 100) * (allDates.length - 1));

    setDateRange({
      startDate: allDates[startIdx].toISOString().split('T')[0],
      endDate: allDates[endIdx].toISOString().split('T')[0]
    });
  };
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
    const filtered = podcastData.filter(item => {
      // Filter by podcast if needed
      if (podcastFilter !== 'all' && item['podcast_name'] !== podcastFilter) {
        return false;
      }

      // Filter by date range
      if (dateRange.startDate && dateRange.endDate) {
        const itemDate = new Date(item['modified at']);
        const start = new Date(dateRange.startDate);
        const end = new Date(dateRange.endDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        if (itemDate < start || itemDate > end) return false;
      }

      return true;
    });

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

  // Update chart when selections change
  useEffect(() => {
    if (data.podcast) {
      const newChartData = processListeningData(data.podcast, selectedPodcast, selectedPeriod);
      setChartData(newChartData);
    }
  }, [selectedPodcast, selectedPeriod, dateRange, data.podcast]);

  if (loading.podcast) {
    return (
      <div className="loading-container">
        <LoadingSpinner centerIcon={Podcast} />
      </div>
    );
  }

  if (error.podcast) {
    return (
      <div className="page-container">
        <div className="error">Error loading podcast data: {error.podcast}</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1>Podcast Tracking</h1>
      <p className="page-description">Monitor your podcast listening habits and discover insights</p>

      <div className="filters-section">
        <div className="filters-selections">
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

          <div className="filter-group date-range">
            <label>Date Range:</label>
            <div className="date-inputs">
              <input
                type="date"
                value={dateRange.startDate || ''}
                onChange={(e) => setDateRange(prev => ({
                  ...prev,
                  startDate: e.target.value
                }))}
                className="date-input"
                min={dateRange.startDate}
                max={dateRange.endDate}
              />
              <span className="date-separator">to</span>
              <input
                type="date"
                value={dateRange.endDate || ''}
                onChange={(e) => setDateRange(prev => ({
                  ...prev,
                  endDate: e.target.value
                }))}
                className="date-input"
                min={dateRange.startDate}
                max={dateRange.endDate}
              />
            </div>
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
        <div className="chart-container">
          <ListeningHeatmap
            data={data.podcast}
            selectedPodcast={selectedPodcast}
            dateRange={dateRange}
          />
        </div>
        <div className="chart-container">
          {data.podcast && <TopPodcastsChart data={data.podcast} dateRange={dateRange} />}
        </div>
      </div>
    </div>
  );
};

export default PodcastPage;

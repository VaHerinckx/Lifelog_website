import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import _ from 'lodash';
import './PodcastPage.css';
import { Podcast } from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useData } from '../../context/DataContext';
import ListeningHeatmap from '../../components/charts/ListeningHeatmap';
import TopPodcastsChart from '../../components/charts/TopPodcastsChart';
import TreemapGenre from '../../components/charts/TreemapGenre';

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

  // Fetch podcast data when component mounts
  useEffect(() => {
    fetchData('podcast');
  }, [fetchData]);

  // Process dates and podcasts when data is loaded
  useEffect(() => {
    if (data.podcast) {
      // Get unique podcasts
      const podcasts = _.uniq(data.podcast.map(item => item['podcast_name'])).filter(Boolean);
      setUniquePodcasts(podcasts);

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

  // Function to get period key for grouping
  const getPeriodKey = (dateStr, period) => {
    const date = new Date(dateStr);
    if (!date || isNaN(date.getTime())) return 'Unknown';

    switch (period) {
      case 'yearly':
        return date.getFullYear().toString();
      case 'monthly':
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      case 'daily':
        return date.toISOString().split('T')[0];
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

  const generateAllPeriods = (startDate, endDate, periodType) => {
    const periods = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    let current = new Date(start);

    while (current <= end) {
      switch (periodType) {
        case 'yearly':
          periods.push(current.getFullYear().toString());
          current.setFullYear(current.getFullYear() + 1);
          break;
        case 'monthly':
          periods.push(`${current.getFullYear()}-${(current.getMonth() + 1).toString().padStart(2, '0')}`);
          current.setMonth(current.getMonth() + 1);
          break;
        case 'daily':
          periods.push(current.toISOString().split('T')[0]);
          current.setDate(current.getDate() + 1);
          break;
      }
    }
    return periods;
  };
  const processListeningData = (podcastData, podcastFilter = 'all', period = 'yearly') => {
    if (!podcastData || !dateRange.startDate || !dateRange.endDate) return [];

    // Filter the data first
    const filtered = podcastData.filter(item => {
      const itemDate = new Date(item['modified at']);
      if (isNaN(itemDate.getTime()) || itemDate.getFullYear() <= 1970) {
        return false;
      }

      if (podcastFilter !== 'all' && item['podcast_name'] !== podcastFilter) {
        return false;
      }

      const start = new Date(dateRange.startDate);
      const end = new Date(dateRange.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);

      return itemDate >= start && itemDate <= end;
    });

    // Update podcast info if needed
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

    // Group the filtered data by period
    const grouped = _.groupBy(filtered, item => getPeriodKey(item['modified at'], period));

    // Generate all possible periods
    const allPeriods = generateAllPeriods(dateRange.startDate, dateRange.endDate, period);

    // Create the final dataset with zeros for missing periods
    return allPeriods.map(periodKey => ({
      period: formatPeriodLabel(periodKey, period),
      totalMinutes: grouped[periodKey]
        ? _.sumBy(grouped[periodKey], episode => {
            const duration = parseFloat(episode['duration']);
            return isNaN(duration) ? 0 : Math.round(duration / 60);
          })
        : 0,
      rawPeriod: periodKey
    }));
  };

  // Update chart when selections change
  useEffect(() => {
    if (data.podcast) {
      const newChartData = processListeningData(data.podcast, selectedPodcast, selectedPeriod);
      setChartData(newChartData);
    }
  }, [selectedPodcast, selectedPeriod, dateRange, data.podcast]);

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
                onChange={(e) => {
                  setDateRange(prev => ({
                    ...prev,
                    startDate: e.target.value
                  }));
                }}
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
          <h2 className="listening-time-chart__title">
            Listening Time by {selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)} Period
          </h2>
          <ResponsiveContainer width="100%" height={400} className="listening-time-chart__container">
            <BarChart data={chartData} className="listening-time-chart__graph">
              <CartesianGrid strokeDasharray="3 3"
                             className="listening-time-chart__grid"
                             />
              <XAxis
                dataKey="period"
                angle={selectedPeriod === 'monthly' || selectedPeriod === 'daily' ? -45 : 0}
                textAnchor="end"
                height={80}
                className="listening-time-chart__axis listening-time-chart__axis--x"
              />
              <YAxis
                label={{
                  value: 'Minutes Listened',
                  angle: -90,
                  position: 'insideLeft'
                }}
                className="listening-time-chart__axis listening-time-chart__axis--y"
              />
              <Tooltip
                formatter={(value) => `${Math.round(value).toLocaleString()} minutes`}
                className="listening-time-chart__tooltip"
              />
              <Legend className="listening-time-chart__legend"/>
              <Bar
                dataKey="totalMinutes"
                name="Minutes Listened"
                className="listening-time-chart__bar"
              />
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
          <TopPodcastsChart data={data.podcast} dateRange={dateRange} />
        </div>

        <div className="chart-container">
          <TreemapGenre
            data={data.podcast}
            selectedPodcast={selectedPodcast}
            dateRange={dateRange}
          />
        </div>
      </div>
    </div>
  );
};

export default PodcastPage;

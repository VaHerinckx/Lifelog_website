import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import _ from 'lodash';
import './PodcastPage.css';
import { Podcast, Tag } from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useData } from '../../context/DataContext';
import ListeningHeatmap from '../../components/charts/ListeningHeatmap';
import TopPodcastsChart from '../../components/charts/TopPodcastsChart';
import TreemapGenre from '../../components/charts/TreemapGenre';
import AdvancedDateRangeSlider from '../../components/ui/Slicers/AdvancedDateRangeSlider/AdvancedDateRangeSlider';
import MultiSelectDropdown from '../../components/ui/Slicers/MultiSelectDropdown/MultiSelectDropdown';

const PodcastPage = () => {
  // Get data and functions from context
  const { data, loading, error, fetchData } = useData();

  // Local state
  const [uniquePodcasts, setUniquePodcasts] = useState([]);
  const [uniqueGenres, setUniqueGenres] = useState([]);
  const [selectedPodcasts, setSelectedPodcasts] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);
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

  // Handle podcast selection changes
  const handlePodcastChange = (podcasts) => {
    setSelectedPodcasts(podcasts);

    // Set the selected podcast info for display if only one podcast is selected
    if (podcasts.length === 1 && data.podcast) {
      const podcastInfo = data.podcast.find(item => item.podcast_name === podcasts[0]);
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

  // Main filter function for data
  const filterData = (podcastData) => {
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

  const processListeningData = (podcastData, period = 'yearly') => {
    if (!podcastData || !dateRange.startDate || !dateRange.endDate) return [];

    // Apply the general filters first
    const filtered = filterData(podcastData);

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
      const newChartData = processListeningData(data.podcast, selectedPeriod);
      setChartData(newChartData);
    }
  }, [selectedPodcasts, selectedGenres, selectedPeriod, dateRange, data.podcast]);

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

        <div className="filter-pane-grid">
          {/* Date Range Filter on the left */}
          <div className="filter-item date-filter">
            <AdvancedDateRangeSlider
              data={data.podcast}
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
          <div className="chart-header">
            <h2 className="listening-time-chart__title">
              Listening Time by Period
            </h2>
            <div className="chart-filter">
              <label htmlFor="period-select">Period:</label>
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
          </div>
          <ResponsiveContainer width="100%" height="100%" className="listening-time-chart__container">
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
                tickFormatter={(value) => value.toLocaleString()}  // Add thousands separators
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
            data={filterData(data.podcast)}
            selectedPodcast={selectedPodcasts.length === 1 ? selectedPodcasts[0] : 'all'}
            dateRange={dateRange}
          />
        </div>

        <div className="chart-container">
          <TopPodcastsChart data={filterData(data.podcast)} dateRange={dateRange} />
        </div>

        <div className="chart-container">
          <TreemapGenre
            data={filterData(data.podcast)}
            selectedPodcast={selectedPodcasts.length === 1 ? selectedPodcasts[0] : 'all'}
            dateRange={dateRange}
          />
        </div>
      </div>
    </div>
  );
};

export default PodcastPage;

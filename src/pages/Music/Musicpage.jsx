import React, { useState, useEffect } from 'react';
import _ from 'lodash';
import './MusicPage.css';
import { Music, BarChart2, Headphones, Clock, User, Percent, Calendar, Tag, Album } from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useData } from '../../context/DataContext';
import MusicAnalysisTab from './components/MusicAnalysisTab';
import CardsPanel from '../../components/ui/CardsPanel/CardsPanel';
import FilteringPanel from '../../components/ui/Filters/FilteringPanel/FilteringPanel';

const MusicPage = () => {
  // Get data and functions from context
  const { data, loading, error, fetchData, calculateFilteredMusicStats } = useData();

  // State for filters
  const [filters, setFilters] = useState({});
  const [filteredData, setFilteredData] = useState([]);
  const [selectedArtistInfo, setSelectedArtistInfo] = useState(null);

  // State to store music stats (calculated from filtered or all data)
  const [musicStats, setMusicStats] = useState({
    totalTracks: 0,
    uniqueTracks: 0,
    totalListeningTime: 0,
    uniqueArtists: 0,
    avgCompletion: 0
  });

  // State for filtered stats loading
  const [filteredStatsLoading, setFilteredStatsLoading] = useState(false);

  // Define filter configurations for FilteringPanel
  const filterConfigs = [
    {
      key: 'listeningYear',
      type: 'multiselect',
      label: 'Listening Year',
      optionsSource: 'listening_year',
      dataField: 'listening_year',
      icon: <Calendar size={16} />,
      placeholder: 'Select years',
      searchPlaceholder: 'Search years...'
    },
    {
      key: 'dateRange',
      type: 'daterange',
      label: 'Listening Date',
      dataField: 'timestamp',
      icon: <Calendar size={16} />,
      placeholder: 'Select date range'
    },
    {
      key: 'artists',
      type: 'multiselect',
      label: 'Artists',
      optionsSource: 'artist_name',
      dataField: 'artist_name',
      icon: <User size={16} />,
      placeholder: 'Select artists',
      searchPlaceholder: 'Search artists...'
    },
    {
      key: 'albums',
      type: 'multiselect',
      label: 'Albums',
      optionsSource: 'album_name',
      dataField: 'album_name',
      icon: <Album size={16} />,
      placeholder: 'Select albums',
      searchPlaceholder: 'Search albums...'
    },
    {
      key: 'genres',
      type: 'multiselect',
      label: 'Genres',
      optionsSource: 'genre_1',
      dataField: 'genre_1',
      icon: <Tag size={16} />,
      placeholder: 'Select genres',
      searchPlaceholder: 'Search genres...'
    }
  ];


  // Fetch music data when component mounts
  useEffect(() => {
    fetchData('music');
  }, [fetchData]);

  // Handle filter changes from FilteringPanel
  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  // Apply filters whenever filters or data change
  useEffect(() => {
    if (!data.music || !data.music.displayData || data.music.displayData.length === 0) {
      setFilteredData([]);
      return;
    }

    let filtered = [...data.music.displayData];

    // Filter out tracks before 2017 and add listening year
    filtered = filtered.filter(item => {
      const itemDate = new Date(item.timestamp);
      if (!isNaN(itemDate.getTime()) && itemDate >= new Date('2017-01-01')) {
        // Add listening year field for filtering
        item.listening_year = itemDate.getFullYear().toString();
        return true;
      }
      return false;
    });

    // Apply listening year filter
    if (filters.listeningYear && Array.isArray(filters.listeningYear) && filters.listeningYear.length > 0) {
      filtered = filtered.filter(item => filters.listeningYear.includes(item.listening_year));
    }

    // Apply date range filter
    if (filters.dateRange && (filters.dateRange.startDate || filters.dateRange.endDate)) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.timestamp);
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

    // Apply artist filter (multi-select)
    if (filters.artists && Array.isArray(filters.artists) && filters.artists.length > 0) {
      filtered = filtered.filter(item => filters.artists.includes(item.artist_name));
    }

    // Apply album filter (multi-select)
    if (filters.albums && Array.isArray(filters.albums) && filters.albums.length > 0) {
      filtered = filtered.filter(item => filters.albums.includes(item.album_name));
    }

    // Apply genre filter (multi-select)
    if (filters.genres && Array.isArray(filters.genres) && filters.genres.length > 0) {
      filtered = filtered.filter(item => {
        // Check if any of the genre fields match the selected genres
        const genres = [item.genre_1, item.genre_2, item.genre_3, item.genre_4, item.genre_5]
          .filter(Boolean)
          .filter(genre => genre !== 'Unknown' && genre.trim() !== '');
        
        return genres.some(genre => filters.genres.includes(genre));
      });
    }

    setFilteredData(filtered);

    // Handle selected artist info display (use displayData for artist info)
    if (filters.artists && filters.artists.length === 1 && data.music.displayData) {
      const artistInfo = data.music.displayData.find(item => item.artist_name === filters.artists[0]);
      if (artistInfo) {
        setSelectedArtistInfo({
          name: artistInfo.artist_name,
          followers: artistInfo.followers,
          popularity: artistInfo.artist_popularity,
          genres: [artistInfo.genre_1, artistInfo.genre_2, artistInfo.genre_3]
            .filter(Boolean)
            .filter(genre => genre !== 'Unknown' && genre.trim() !== '')
        });
      }
    } else {
      setSelectedArtistInfo(null);
    }
  }, [filters, data.music]);


  // Calculate music stats - use aggregated stats for all data, filtered stats from ALL data when filters applied
  useEffect(() => {
    // Check if any meaningful filters are applied (not just empty objects)
    const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
      if (key === 'dateRange') {
        return value && (value.startDate || value.endDate);
      }
      return Array.isArray(value) ? value.length > 0 : value !== null && value !== undefined && value !== '';
    });
    
    
    if (hasActiveFilters && calculateFilteredMusicStats) {
      // Calculate filtered stats from ALL data, not just sample
      setFilteredStatsLoading(true);
      calculateFilteredMusicStats(filters)
        .then(filteredStats => {
          const stats = {
            totalTracks: filteredStats.totalTracks,
            uniqueTracks: filteredStats.uniqueTracks,
            totalListeningTime: Math.round(filteredStats.totalDurationMs / 1000 / 60), // Convert to minutes
            uniqueArtists: filteredStats.uniqueArtists,
            avgCompletion: Math.round(filteredStats.avgCompletion * 100) // Convert to percentage
          };
          
          setMusicStats(stats);
          setFilteredStatsLoading(false);
        })
        .catch(error => {
          setFilteredStatsLoading(false);
        });
    } else if (data.music?.aggregatedStats) {
      // Use pre-calculated aggregated stats for all data
      const aggregated = data.music.aggregatedStats;
      const stats = {
        totalTracks: aggregated.totalTracks,
        uniqueTracks: aggregated.uniqueTracks,
        totalListeningTime: Math.round(aggregated.totalDurationMs / 1000 / 60), // Convert to minutes
        uniqueArtists: aggregated.uniqueArtists,
        avgCompletion: Math.round(aggregated.avgCompletion * 100) // Convert to percentage
      };
      
      setMusicStats(stats);
    } else {
      // Reset stats when no data
      setMusicStats({
        totalTracks: 0,
        uniqueTracks: 0,
        totalListeningTime: 0,
        uniqueArtists: 0,
        avgCompletion: 0
      });
    }
  }, [filteredData, filters, data.music, calculateFilteredMusicStats]);



  // Prepare cards data for CardsPanel
  const prepareStatsCards = () => {
    return [
      {
        value: musicStats.totalTracks.toLocaleString(),
        label: "Toggles",
        icon: <Headphones size={24} />
      },
      {
        value: musicStats.uniqueTracks.toLocaleString(),
        label: "Tracks Played",
        icon: <Music size={24} />
      },
      {
        value: musicStats.totalListeningTime.toLocaleString() || "0",
        label: "Total Minutes",
        icon: <Clock size={24} />
      },
      {
        value: musicStats.uniqueArtists.toLocaleString(),
        label: "Unique Artists",
        icon: <User size={24} />
      },
      {
        value: `${Math.min(musicStats.avgCompletion, 100)}%`,
        label: "Avg. Completion",
        icon: <Percent size={24} />
      }
    ];
  };


  if (loading.music) {
    return <LoadingSpinner centerIcon={Music} />;
  }

  if (error.music) {
    return <div className="error">Error loading music data: {error.music}</div>;
  }

  if (!data.music) {
    return <div className="error">No music data available</div>;
  }

  return (
    <div className="page-container">
      <h1>Music Analytics</h1>
      <p className="page-description">Explore your music listening habits and discover insights</p>

      {/* FilteringPanel */}
      <FilteringPanel
        data={data.music?.displayData || []}
        fullDataset={data.music?.csvText || ''}
        filterConfigs={filterConfigs}
        onFiltersChange={handleFiltersChange}
        title="Music Filters"
        description="Filter your music data for analysis"
      />

      {/* Selected artist info display */}
      {selectedArtistInfo && (
        <div className="artist-info">
          <div className="artist-header">
            <div className="artist-details">
              <h2>{selectedArtistInfo.name}</h2>
              <p className="artist-followers">{selectedArtistInfo.followers?.toLocaleString()} followers</p>
              <p className="artist-popularity">Popularity: {selectedArtistInfo.popularity}/100</p>
              {selectedArtistInfo.genres && selectedArtistInfo.genres.length > 0 && (
                <div className="artist-genres">
                  <span>Genres: </span>
                  {selectedArtistInfo.genres.map((genre, index) => (
                    <span key={index} className="genre-tag">
                      {genre}
                      {index < selectedArtistInfo.genres.length - 1 && ', '}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards using CardsPanel - shows stats from filtered or all data */}
      <CardsPanel
        title="Music Statistics"
        description={`Your listening progress at a glance ${Object.entries(filters).some(([key, value]) => {
          if (key === 'dateRange') return value && (value.startDate || value.endDate);
          return Array.isArray(value) ? value.length > 0 : value !== null && value !== undefined && value !== '';
        }) ? '(filtered from ALL data)' : '(all data)'}`}
        cards={prepareStatsCards()}
        loading={loading?.music || filteredStatsLoading}
      />

      {/* Analysis Content - uses full dataset for comprehensive analysis */}
      <MusicAnalysisTab
        musicData={data.music?.displayData || []}
        allData={data.music?.csvText || ''}
        displaySample={data.music?.displayData || []}
        selectedArtistInfo={selectedArtistInfo}
        currentFilters={filters}
        isFullDataset={true}
      />
    </div>
  );
};

export default MusicPage;

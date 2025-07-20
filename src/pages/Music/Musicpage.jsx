import React, { useState, useEffect } from 'react';
import _ from 'lodash';
import './MusicPage.css';
import './components/MusicPageTabs.css';
import { Music, BarChart2, Headphones, Clock, User, Percent, Calendar, Tag, Album } from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useData } from '../../context/DataContext';
import MusicAnalysisTab from './components/MusicAnalysisTab';
import TrackList from './components/TrackList';
import CardsPanel from '../../components/ui/CardsPanel/CardsPanel';
import FilteringPanel from '../../components/ui/Filters/FilteringPanel/FilteringPanel';

const MusicPage = () => {
  // Get data and functions from context
  const { data, loading, error, fetchData, calculateFilteredMusicStats } = useData();

  // State for active tab
  const [activeTab, setActiveTab] = useState('tracks');

  // State for filters - now managed at the page level
  const [filters, setFilters] = useState({});
  const [filteredData, setFilteredData] = useState([]);
  const [selectedArtistInfo, setSelectedArtistInfo] = useState(null);

  // State to store music stats (calculated from filtered data)
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

  // Debug logging (reduced to prevent freeze)
  useEffect(() => {
    if (data.music) {
      console.log('🎵 Music data structure:', {
        displayDataLength: data.music.displayData?.length,
        totalTracks: data.music.totalTracks,
        aggregatedStats: data.music.aggregatedStats,
        fullDataAvailable: data.music.fullDataAvailable
      });
      
      if (data.music.displayData && data.music.displayData.length > 0) {
        console.log('🎵 First track keys:', Object.keys(data.music.displayData[0]));
        
        // Check for null/undefined values that might cause filtering issues
        const firstTrack = data.music.displayData[0];
        console.log('🎵 Key field analysis:', {
          artist_name: firstTrack.artist_name,
          track_name: firstTrack.track_name,
          timestamp: firstTrack.timestamp,
          track_duration: firstTrack.track_duration,
          completion: firstTrack.completion
        });
      }
    }
  }, [data.music]);

  // Handle filter changes from FilteringPanel
  const handleFiltersChange = (newFilters) => {
    console.log('🎵 Music filters changed:', newFilters);
    setFilters(newFilters);
  };

  // Apply filters whenever filters or data change
  useEffect(() => {
    if (!data.music || !data.music.displayData || data.music.displayData.length === 0) {
      setFilteredData([]);
      return;
    }

    let filtered = [...data.music.displayData];
    console.log('🎵 Starting with:', filtered.length, 'display tracks, filters:', Object.keys(filters).length);

    // Apply date range filter
    if (filters.dateRange && (filters.dateRange.startDate || filters.dateRange.endDate)) {
      console.log('🎵 Applying date filter:', filters.dateRange);
      const beforeFilter = filtered.length;
      
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
      
      console.log(`🎵 Date filter: ${beforeFilter} -> ${filtered.length} tracks`);
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

    console.log('🎵 Filtered data length:', filtered.length);
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
    
    console.log('🎵 Calculating stats for:', hasActiveFilters ? 'filtered' : 'all', 'data');
    console.log('🎵 Active filters detected:', hasActiveFilters, 'Filter keys:', Object.keys(filters));
    
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
          
          console.log('🎵 Calculated filtered stats from ALL data:', stats);
          setMusicStats(stats);
          setFilteredStatsLoading(false);
        })
        .catch(error => {
          console.error('🎵 Error calculating filtered stats:', error);
          setFilteredStatsLoading(false);
          // Fallback to sample-based calculation
          if (filteredData.length > 0) {
            const totalTracks = filteredData.length;
            const durations = filteredData.map(track => {
              const duration = track.track_duration;
              if (duration !== undefined && duration !== null) {
                const parsedDuration = parseFloat(duration);
                if (!isNaN(parsedDuration)) {
                  return parsedDuration / 1000 / 60;
                }
              }
              return 0;
            });
            const totalMinutes = Math.round(_.sum(durations));
            const uniqueArtistCount = _.uniq(filteredData.map(item => item.artist_name)).filter(Boolean).length;
            const uniqueTrackCount = _.uniq(filteredData.map(item => item.song_key || `${item.track_name} by ${item.artist_name}`)).filter(Boolean).length;
            const completionValues = filteredData.map(track => {
              const completion = track.completion;
              if (completion !== undefined && completion !== null) {
                const parsedValue = parseFloat(completion);
                if (!isNaN(parsedValue)) {
                  return Math.min(parsedValue * 100, 100);
                }
              }
              return 100;
            });
            const avgCompletion = Math.round(_.mean(completionValues));

            setMusicStats({
              totalTracks,
              uniqueTracks: uniqueTrackCount,
              totalListeningTime: totalMinutes,
              uniqueArtists: uniqueArtistCount,
              avgCompletion
            });
          }
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
      
      console.log('🎵 Using aggregated stats:', stats);
      setMusicStats(stats);
    } else {
      // Reset stats when no data
      console.log('🎵 No data available, resetting stats');
      setMusicStats({
        totalTracks: 0,
        uniqueTracks: 0,
        totalListeningTime: 0,
        uniqueArtists: 0,
        avgCompletion: 0
      });
    }
  }, [filteredData, filters, data.music, calculateFilteredMusicStats]);

  // Handle track click (for future functionality like track details modal)
  const handleTrackClick = (track) => {
    console.log('Track clicked:', track);
    // TODO: Implement track details modal or actions
  };


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

  return (
    <div className="page-container">
      <h1>Music Tracking</h1>
      <p className="page-description">Explore your music listening habits and discover insights</p>

      {/* FilteringPanel - now at the page level, affects all tabs */}
      <FilteringPanel
        data={data.music?.displayData || []}
        filterConfigs={filterConfigs}
        onFiltersChange={handleFiltersChange}
        title="Music Filters"
        description="Filter your music data across all views (based on sample data)"
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

      {/* Tab Navigation */}
      <div className="page-tabs">
        <button
          className={`page-tab ${activeTab === 'tracks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tracks')}
        >
          <Music size={18} style={{ marginRight: '8px' }} />
          Tracks
        </button>
        <button
          className={`page-tab ${activeTab === 'analysis' ? 'active' : ''}`}
          onClick={() => setActiveTab('analysis')}
        >
          <BarChart2 size={18} style={{ marginRight: '8px' }} />
          Analysis
        </button>
      </div>

      {/* Tracks Tab Content */}
      {activeTab === 'tracks' && (
        <div className="tracks-content">
          {/* KPI Cards using CardsPanel - shows overall or filtered stats */}
          <CardsPanel
            title="Music Statistics"
            description={`Your listening progress at a glance ${Object.entries(filters).some(([key, value]) => {
              if (key === 'dateRange') return value && (value.startDate || value.endDate);
              return Array.isArray(value) ? value.length > 0 : value !== null && value !== undefined && value !== '';
            }) ? '(filtered from ALL data)' : '(all data)'}`}
            cards={prepareStatsCards()}
            loading={loading?.music || filteredStatsLoading}
          />

          {/* Track List */}
          <TrackList
            tracks={filteredData}
            onTrackClick={handleTrackClick}
            showSampleNote={true}
            totalCount={data.music?.totalTracks || 0}
          />
        </div>
      )}

      {/* Analysis Tab Content - receives display data for analysis */}
      {activeTab === 'analysis' && (
        <MusicAnalysisTab
          musicData={data.music?.displayData || []}
          selectedArtistInfo={selectedArtistInfo}
          currentFilters={filters}
        />
      )}
    </div>
  );
};

export default MusicPage;

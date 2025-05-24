// src/pages/Movies/MoviesPage.jsx
import React, { useState, useEffect } from 'react';
import { Film, Star, StarHalf, Grid, List, Calendar, User, Tag, Clock, BarChart } from 'lucide-react';
import Papa from 'papaparse';
import _ from 'lodash';
import './MoviesPage.css';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useData } from '../../context/DataContext';

// Import components
import MoviesAnalysisTab from './components/MoviesAnalysisTab';
import CardsPanel from '../../components/ui/CardsPanel/CardsPanel';
import FilteringPanel from '../../components/ui/Filters/FilteringPanel/FilteringPanel';

// Component to display star ratings
const StarRating = ({ rating, size = 16 }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="stars">
      {[...Array(fullStars)].map((_, i) => (
        <Star key={`full-${i}`} className="star" size={size} fill="#EAC435" />
      ))}
      {hasHalfStar && <StarHalf className="star" size={size} />}
      {[...Array(emptyStars)].map((_, i) => (
        <Star key={`empty-${i}`} className="empty-star" size={size} />
      ))}
    </div>
  );
};

// Function to get poster URL from processed data
const getPosterUrl = (movie) => {
  // First try to get from the PosterURL field added by Python processing
  if (movie.originalEntry && movie.originalEntry.PosterURL && movie.originalEntry.PosterURL !== 'No poster found') {
    return movie.originalEntry.PosterURL;
  }

  // Fallback to placeholder
  return "/api/placeholder/500/750";
};

// Component to display a movie card
const MovieCard = ({ movie, onClick }) => {
  const formatDate = (date) => {
    if (!date || !(date instanceof Date) || isNaN(date)) return 'Unknown date';
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="movie-card" onClick={() => onClick(movie)}>
      <div className="movie-poster-container">
        <img
          src={getPosterUrl(movie)}
          alt={`${movie.name} poster`}
          className="movie-poster"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "/api/placeholder/500/750";
          }}
        />
        {movie.isRewatch && (
          <div className="rewatch-badge">Rewatch</div>
        )}
      </div>
      <div className="movie-info">
        <h3 className="movie-title" title={movie.name}>{movie.name}</h3>
        <p className="movie-year">{movie.year}</p>

        {movie.rating && movie.rating > 0 && (
          <div className="rating-container">
            <StarRating rating={movie.rating} size={16} />
            <span>{movie.rating.toFixed(1)}</span>
          </div>
        )}

        <div className="movie-meta">
          <div className="movie-date">
            <span className="date-label">Watched:</span>
            <span className="date-value">{formatDate(movie.watchedDate)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const MoviesPage = () => {
  const { data, loading, error, fetchData } = useData();
  const [movies, setMovies] = useState([]);
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [movieEntries, setMovieEntries] = useState([]);
  const [uniqueGenres, setUniqueGenres] = useState([]);

  // Filter state - managed by FilteringPanel
  const [filters, setFilters] = useState({});

  // Function to extract unique genres from comma-separated genre strings
  const extractUniqueGenres = (moviesData) => {
    const genreSet = new Set();

    moviesData.forEach(movie => {
      if (movie.genre && movie.genre !== 'Unknown') {
        // Split by comma and clean up each genre
        const genres = movie.genre.split(',').map(g => g.trim());
        genres.forEach(genre => {
          if (genre && genre !== 'Unknown') {
            genreSet.add(genre);
          }
        });
      }
    });

    // Convert to sorted array
    return Array.from(genreSet).sort();
  };

  const [viewMode, setViewMode] = useState('grid');
  const [movieStats, setMovieStats] = useState({
    totalMovies: 0,
    totalHours: 0,
    avgRating: 0,
    moviesThisMonth: 0,
    totalRewatches: 0
  });
  const [activeTab, setActiveTab] = useState('movies');

  // Define filter configurations for FilteringPanel
  const filterConfigs = [
    {
      key: 'dateRange',
      type: 'daterange',
      label: 'Watch Date',
      dataField: 'Date',
      icon: <Calendar size={16} />,
      placeholder: 'Select date range'
    },
    {
      key: 'genres',
      type: 'multiselect',
      label: 'Genres',
      optionsSource: 'custom', // We'll handle this specially
      dataField: 'genre',
      icon: <Tag size={16} />,
      placeholder: 'Select genres',
      searchPlaceholder: 'Search genres...'
    },
    {
      key: 'years',
      type: 'multiselect',
      label: 'Release Year',
      optionsSource: 'Year',
      dataField: 'Year',
      icon: <Clock size={16} />,
      placeholder: 'Select years',
      searchPlaceholder: 'Search years...'
    },
    {
      key: 'ratings',
      type: 'singleselect',
      label: 'My Rating',
      optionsSource: 'static',
      options: ['All Ratings', '5 Stars', '4+ Stars', '3+ Stars', '2+ Stars', '1+ Stars', 'Unrated'],
      dataField: 'Rating',
      icon: <Star size={16} />,
      placeholder: 'Filter by rating',
      defaultValue: 'All Ratings'
    }
  ];

  // Function to process movies data from the API response
  const processRawData = (rawData) => {
    const processedData = rawData.map(item => {
      return Object.entries(item).reduce((acc, [key, value]) => {
        const cleanKey = key.replace(/\u0000/g, '');
        acc[cleanKey] = value;
        return acc;
      }, {});
    });
    return processedData;
  };

  // Fetch movies data from actual CSV when we can't load from data context
  const fetchMoviesData = async () => {
    try {
      const response = await window.fs.readFile('letterboxd_processed_sample.csv', { encoding: 'utf8' });
      const cleanedResponse = response.replace(/\u0000/g, '');

      const parsedData = Papa.parse(cleanedResponse, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        delimiter: '|'
      });

      if (data) {
        data.movies = parsedData.data;
      }

      processMovies(parsedData.data);
    } catch (error) {
      console.error('Error fetching movies data:', error);
    }
  };

  // Fetch movies data when component mounts
  useEffect(() => {
    if (typeof fetchData === 'function') {
      fetchData('movies');
    } else {
      fetchMoviesData();
    }
  }, [fetchData]);

  // Process the movies data
  const processMovies = (moviesData) => {
    if (!moviesData || moviesData.length === 0) return;

    setMovieEntries(moviesData);

    // Process each movie entry (each watch is separate)
    const processedMovies = moviesData.map((entry, index) => {
      const watchDate = new Date(entry.Date || entry.date || '');
      const movieName = entry.Name || entry.name || 'Unknown Movie';
      const movieYear = entry.Year || entry.year || '';
      const rating = parseFloat(entry.Rating || entry.rating || 0);
      const letterboxdUri = entry['Letterboxd URI'] || entry.letterboxdUri || '';
      const genre = entry.Genre || entry.genre || 'Unknown';

      // Detect rewatches by checking if this movie name+year appears earlier in the data
      const earlierWatches = moviesData.slice(0, index).filter(prevEntry =>
        (prevEntry.Name || prevEntry.name) === movieName &&
        (prevEntry.Year || prevEntry.year) === movieYear
      );
      const isRewatch = earlierWatches.length > 0;

      return {
        id: `${movieName}-${movieYear}-${index}`, // Unique ID for each watch
        name: movieName,
        year: parseInt(movieYear) || null,
        rating: rating,
        watchedDate: isNaN(watchDate.getTime()) ? null : watchDate,
        letterboxdUri: letterboxdUri,
        genre: genre,
        isRewatch: isRewatch,
        originalEntry: entry
      };
    }).filter(movie => movie.name !== 'Unknown Movie');

    // Sort by watch date (most recent first)
    const sortedMovies = _.sortBy(processedMovies, movie => movie.watchedDate || new Date(0)).reverse();
    setMovies(sortedMovies);
    setFilteredMovies(sortedMovies);

    // Extract unique genres for filtering
    const genres = extractUniqueGenres(sortedMovies);
    setUniqueGenres(genres);
    console.log('Extracted unique genres:', genres);

    // Calculate stats
    const now = new Date();
    const lastMonthDate = new Date();
    lastMonthDate.setMonth(now.getMonth() - 1);

    const recentMovies = sortedMovies.filter(movie =>
      movie.watchedDate && movie.watchedDate >= lastMonthDate
    ).length;

    const totalRewatches = sortedMovies.filter(movie => movie.isRewatch).length;
    const ratedMovies = sortedMovies.filter(movie => movie.rating > 0);

    setMovieStats({
      totalMovies: sortedMovies.length,
      totalHours: 0, // We don't have duration data from Letterboxd
      avgRating: ratedMovies.length > 0 ? _.meanBy(ratedMovies, 'rating').toFixed(1) : "0.0",
      moviesThisMonth: recentMovies,
      totalRewatches: totalRewatches
    });
  };

  // Process movies data when it's loaded
  useEffect(() => {
    if (data && data.movies) {
      processMovies(data.movies);
    }
  }, [data]);

  // Apply filters when FilteringPanel filters change
  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);

    if (movies.length > 0) {
      let filtered = [...movies];

      // Apply date range filter
      if (newFilters.dateRange && (newFilters.dateRange.startDate || newFilters.dateRange.endDate)) {
        filtered = filtered.filter(movie => {
          if (!movie.watchedDate || isNaN(movie.watchedDate.getTime())) return false;

          const movieDate = movie.watchedDate;
          const startDate = newFilters.dateRange.startDate ? new Date(newFilters.dateRange.startDate) : null;
          const endDate = newFilters.dateRange.endDate ? new Date(newFilters.dateRange.endDate) : null;

          if (startDate && movieDate < startDate) return false;
          if (endDate && movieDate > endDate) return false;

          return true;
        });
      }

      // Apply genres filter (multi-select)
      if (newFilters.genres && Array.isArray(newFilters.genres) && newFilters.genres.length > 0) {
        filtered = filtered.filter(movie => {
          if (!movie.genre || movie.genre === 'Unknown') return false;

          // Check if any of the selected genres appear in this movie's genre string
          return newFilters.genres.some(selectedGenre =>
            movie.genre.includes(selectedGenre)
          );
        });
      }

      // Apply years filter (multi-select)
      if (newFilters.years && Array.isArray(newFilters.years) && newFilters.years.length > 0) {
        filtered = filtered.filter(movie =>
          movie.year && newFilters.years.includes(movie.year.toString())
        );
      }

      // Apply rating filter (single-select)
      if (newFilters.ratings && newFilters.ratings !== 'All Ratings') {
        filtered = filtered.filter(movie => {
          if (newFilters.ratings === 'Unrated') {
            return !movie.rating || movie.rating === 0;
          }

          const minRating = parseInt(newFilters.ratings.split('+')[0] || newFilters.ratings.split(' ')[0]);
          if (newFilters.ratings === '5 Stars') {
            return movie.rating === 5;
          } else {
            return movie.rating >= minRating;
          }
        });
      }

      // Sort by most recent
      filtered = _.sortBy(filtered, movie => {
        return movie.watchedDate instanceof Date && !isNaN(movie.watchedDate.getTime())
          ? movie.watchedDate.getTime()
          : -Infinity;
      }).reverse();

      setFilteredMovies(filtered);
    }
  };

  // Update stats when filtered movies change
  useEffect(() => {
    if (filteredMovies.length > 0) {
      const now = new Date();
      const lastMonthDate = new Date();
      lastMonthDate.setMonth(now.getMonth() - 1);

      const recentMovies = filteredMovies.filter(movie =>
        movie.watchedDate && movie.watchedDate >= lastMonthDate
      ).length;

      const totalRewatches = filteredMovies.filter(movie => movie.isRewatch).length;
      const ratedMovies = filteredMovies.filter(movie => movie.rating > 0);

      setMovieStats({
        totalMovies: filteredMovies.length,
        totalHours: 0, // Still no duration data
        avgRating: ratedMovies.length > 0 ? _.meanBy(ratedMovies, 'rating').toFixed(1) : "0.0",
        moviesThisMonth: recentMovies,
        totalRewatches: totalRewatches
      });
    }
  }, [filteredMovies]);

  // Handle file upload directly
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      delimiter: '|',
      encoding: 'UTF-8',
      complete: (results) => {
        const cleanedData = processRawData(results.data);
        if (data) {
          data.movies = cleanedData;
        }
        processMovies(cleanedData);
      }
    });
  };

  const handleMovieClick = (movie) => {
    console.log('Movie clicked:', movie);
    // TODO: Implement movie details modal
  };

  // Prepare cards data for CardsPanel
  const prepareStatsCards = () => {
    const cards = [
      {
        value: movieStats.totalMovies.toLocaleString(),
        label: "Movies Watched",
        icon: <Film size={24} />
      },
      {
        value: movieStats.avgRating,
        label: "Average Rating",
        icon: <Star size={24} />
      },
      {
        value: movieStats.moviesThisMonth.toLocaleString(),
        label: "Movies This Month",
        icon: <Calendar size={24} />
      },
      {
        value: movieStats.totalRewatches.toLocaleString(),
        label: "Rewatches",
        icon: <Film size={24} />
      }
    ];

    return cards;
  };

  if (loading && loading.movies) {
    return <LoadingSpinner centerIcon={Film} />;
  }

  if ((error && error.movies) || (!movies.length && !loading?.movies)) {
    return (
      <div className="page-container">
        <div className="page-content">
          <h1>Movies & TV Tracker</h1>
          <div className="error">
            {error?.movies ?
              `Error loading movies data: ${error.movies}` :
              "No movies data available. Please upload your data."}
          </div>
          <div className="fallback-upload">
            <p>You can manually upload your Letterboxd data CSV:</p>
            <input type="file" accept=".csv" onChange={handleFileUpload} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-content">
        <h1>Movies & TV Tracker</h1>
        <p className="page-description">Track your viewing habits and discover insights about your movie preferences</p>

        {/* Tab Navigation */}
        <div className="page-tabs">
          <button
            className={`page-tab ${activeTab === 'movies' ? 'active' : ''}`}
            onClick={() => setActiveTab('movies')}
          >
            <Film size={18} style={{ marginRight: '8px' }} />
            Movies
          </button>
          <button
            className={`page-tab ${activeTab === 'analysis' ? 'active' : ''}`}
            onClick={() => setActiveTab('analysis')}
          >
            <BarChart size={18} style={{ marginRight: '8px' }} />
            Analysis
          </button>
        </div>

        {/* FilteringPanel */}
        <FilteringPanel
          data={movies}
          filterConfigs={filterConfigs.map(config => {
            // For genres, override with our extracted unique genres
            if (config.key === 'genres') {
              return {
                ...config,
                optionsSource: 'static',
                options: uniqueGenres
              };
            }
            return config;
          })}
          onFiltersChange={handleFiltersChange}
          title="Movie Filters"
          description="Filter and sort your movie collection"
        />

        {/* Movies Tab Content */}
        {activeTab === 'movies' && (
          <>
            <div className="view-controls">
              <button
                className={`view-control-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Grid View"
              >
                <Grid size={20} />
              </button>
              <button
                className={`view-control-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="List View"
              >
                <List size={20} />
              </button>
              <div className="movie-count">
                {filteredMovies.length} {filteredMovies.length === 1 ? 'movie' : 'movies'} found
              </div>
            </div>

            <CardsPanel
              title="Movie Statistics"
              description="Your viewing progress at a glance"
              cards={prepareStatsCards()}
              loading={loading?.movies}
            />

            {/* Movies Display */}
            {filteredMovies.length > 0 ? (
              <>
                {viewMode === 'grid' && (
                  <div className="movies-grid">
                    {filteredMovies.map(movie => (
                      <MovieCard
                        key={movie.id}
                        movie={movie}
                        onClick={handleMovieClick}
                      />
                    ))}
                  </div>
                )}

                {viewMode === 'list' && (
                  <div className="movies-list">
                    {filteredMovies.map(movie => (
                      <div
                        key={`list-${movie.id}`}
                        className="movie-list-item"
                        onClick={() => handleMovieClick(movie)}
                      >
                        <div className="movie-list-poster">
                          <img
                            src={getPosterUrl(movie)}
                            alt={`${movie.name} poster`}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "/api/placeholder/80/120";
                            }}
                          />
                          {movie.isRewatch && (
                            <div className="rewatch-badge-small">R</div>
                          )}
                        </div>
                        <div className="movie-list-info">
                          <h3 className="movie-list-title">{movie.name}</h3>
                          <p className="movie-list-year">{movie.year}</p>
                          <div className="movie-list-meta">
                            {movie.rating > 0 && (
                              <div className="rating-container">
                                <StarRating rating={movie.rating} />
                                <span className="rating-value">{movie.rating.toFixed(1)}</span>
                              </div>
                            )}
                            <div className="movie-list-details">
                              <Calendar size={16} />
                              <span>
                                {movie.watchedDate ?
                                  movie.watchedDate.toLocaleDateString() :
                                  'Unknown date'
                                }
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="movie-list-tags">
                          {movie.isRewatch && (
                            <span className="movie-list-tag rewatch-tag">Rewatch</span>
                          )}
                          {movie.year && (
                            <span className="movie-list-tag year-tag">{movie.year}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="empty-state">
                <Film size={48} className="empty-state-icon" />
                <p className="empty-state-message">
                  No movies match your current filters. Try adjusting your criteria.
                </p>
              </div>
            )}
          </>
        )}

        {/* Analysis Tab Content */}
        {activeTab === 'analysis' && (
          <MoviesAnalysisTab movies={movieEntries} />
        )}
      </div>
    </div>
  );
};

export default MoviesPage;

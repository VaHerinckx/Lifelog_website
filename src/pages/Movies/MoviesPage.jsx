import { useState, useEffect, useMemo } from 'react';
import { Film, Grid, List, Calendar, Tag, Star, User, Clock, Award } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { usePageTitle } from '../../hooks/usePageTitle';

// Import components
import MovieDetails from './components/MovieDetails';
import MovieCard from './components/MovieCard';

// Import standardized UI components
import {
  FilteringPanel,
  Filter,
  PageWrapper,
  PageHeader,
  TabNavigation,
  ContentTab,
  AnalysisTab,
  KPICardsPanel,
  ContentCardsGroup
} from '../../components/ui';
import KpiCard from '../../components/charts/KpiCard';

// Import chart components for analysis tab
import TimeSeriesBarChart from '../../components/charts/TimeSeriesBarChart';
import TopChart from '../../components/charts/TopChart';

// Import utilities
import { sortByDateSafely } from '../../utils/sortingUtils';

const MoviesPage = () => {
  usePageTitle('Movies');
  const { data, loading, error, fetchData } = useData();
  const [movies, setMovies] = useState([]);
  const [filteredMovies, setFilteredMovies] = useState([]);

  const [viewMode, setViewMode] = useState('grid');
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [activeTab, setActiveTab] = useState('content');

  // Fetch movies data when component mounts
  useEffect(() => {
    if (typeof fetchData === 'function') {
      fetchData('movies');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Process movies data when it's loaded
  useEffect(() => {
    if (data?.movies) {
      // Log data info
      if (data.movies.length > 0) {
        const columns = Object.keys(data.movies[0]);
        console.log('📊 Movies data loaded');
        console.log('   Columns:', columns.join(', '));
      }

      // Group by movie_id to get unique movies (since genres are now in separate rows)
      const moviesByIdMap = new Map();

      data.movies.forEach((row) => {
        const movieId = row.movie_id;
        if (!moviesByIdMap.has(movieId)) {
          // First time seeing this movie - create the movie object
          // Only convert date if it's not null/empty
          const parsedDate = row.date && row.date.trim() !== '' ? new Date(row.date) : null;

          moviesByIdMap.set(movieId, {
            ...row,
            id: movieId,
            date: parsedDate,
            rating: row.rating ? parseFloat(row.rating) : 0,
            genres: [row.genre] // Start collecting genres
          });
        } else {
          // We've seen this movie before - just add this genre to the list
          const existingMovie = moviesByIdMap.get(movieId);
          if (row.genre && !existingMovie.genres.includes(row.genre)) {
            existingMovie.genres.push(row.genre);
          }
        }
      });

      // Convert map to array and detect rewatches
      const seenMovies = new Set();
      const processedMovies = Array.from(moviesByIdMap.values()).map((movie) => {
        const movieKey = `${movie.name}-${movie.year}`;
        const isRewatch = seenMovies.has(movieKey);
        seenMovies.add(movieKey);

        // Parse cast field into array of individual actors
        const castArray = movie.cast
          ? movie.cast.split(',').map(actor => actor.trim()).filter(Boolean)
          : [];

        return {
          ...movie,
          isRewatch,
          // Keep original genre field for display, add genres array for filtering
          genreArray: movie.genres,
          // Add cast array for individual actor filtering
          castArray: castArray
        };
      });

      // Sort by date (most recent first) and log last movie date
      const sortedMovies = processedMovies.sort((a, b) => {
        if (!a.date) return 1;
        if (!b.date) return -1;
        return b.date - a.date;
      });

      setMovies(sortedMovies);
      setFilteredMovies(sortedMovies);
      // Reset content ready state when new data arrives
      }
  }, [data?.movies]);

  // Apply filters when FilteringPanel filters change
  // FilteringPanel returns pre-filtered data per source
  const handleFiltersChange = (filteredDataSources) => {
    // Re-sort filtered data (most recent first)
    const sortedMovies = sortByDateSafely(filteredDataSources.movies || [], 'date');
    setFilteredMovies(sortedMovies);
  };

  const handleMovieClick = (movie) => {
    setSelectedMovie(movie);
  };

  const handleCloseDetails = () => {
    setSelectedMovie(null);
  };

  // Memoize data object to prevent FilteringPanel re-renders
  const filterPanelData = useMemo(() => ({
    movies: movies
  }), [movies]);

  return (
    <PageWrapper
      error={error?.movies}
      errorTitle="Movies & TV Tracker"
    >
      {/* Page Header */}
      <PageHeader
        title="Movies & TV Tracker"
        description="Track your viewing habits and discover insights about your movie preferences"
      />

      {!loading?.movies && (
        <>
          {/* FilteringPanel with Filter children */}
          <FilteringPanel
            data={filterPanelData}
            onFiltersChange={handleFiltersChange}
          >
            <Filter
              type="daterange"
              label="Watch Date"
              field="date"
              icon={<Calendar />}
              dataSources={['movies']}
            />
            <Filter
              type="multiselect"
              label="Genres"
              field="genre"
              icon={<Tag />}
              placeholder="Select genres"
              dataSources={['movies']}
            />
            <Filter
              type="multiselect"
              label="Years"
              field="year"
              icon={<Film />}
              placeholder="Select years"
              dataSources={['movies']}
            />
            <Filter
              type="multiselect"
              label="My Rating"
              field="rating"
              icon={<Star />}
              placeholder="Select ratings"
              dataSources={['movies']}
            />
            <Filter
              type="multiselect"
              label="Director"
              field="director"
              icon={<User />}
              placeholder="Select directors"
              dataSources={['movies']}
            />
            <Filter
              type="multiselect"
              label="Cast"
              field="cast"
              icon={<User />}
              placeholder="Search cast members"
              searchPlaceholder="Search actors..."
              delimiter=","
              matchMode="contains"
              dataSources={['movies']}
            />
            <Filter
              type="multiselect"
              label="Certification"
              field="certification"
              icon={<Award />}
              placeholder="Select certifications"
              dataSources={['movies']}
            />
            <Filter
              type="range"
              label="Runtime"
              field="runtime"
              icon={<Clock />}
              placeholder="Select runtime range"
              dataSources={['movies']}
            />
          </FilteringPanel>

          {/* Statistics Cards with KpiCard children */}
          <KPICardsPanel
            dataSources={{
              movies: filteredMovies
            }}
            loading={loading?.movies}
          >
            <KpiCard
              dataSource="movies"
              computation="count"
              label="Movies Watched"
              icon={<Film />}
            />
            <KpiCard
              dataSource="movies"
              field="rating"
              computation="average"
              computationOptions={{ decimals: 1, filterZeros: true }}
              label="Average Rating"
              icon={<Star />}
            />
            <KpiCard
              dataSource="movies"
              computation="custom"
              customValue={() => {
                const now = new Date();
                const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                return filteredMovies.filter(m => m.date >= thirtyDaysAgo).length;
              }}
              label="Movies This Month"
              icon={<Calendar />}
            />
            <KpiCard
              dataSource="movies"
              computation="custom"
              customValue={() => filteredMovies.filter(m => m.isRewatch).length}
              label="Rewatches"
              icon={<Film />}
            />
            <KpiCard
              dataSource="movies"
              field="runtime"
              computation="average"
              computationOptions={{ decimals: 0, filterZeros: true, suffix: ' min' }}
              label="Avg Runtime"
              icon={<Clock />}
            />
            <KpiCard
              dataSource="movies"
              computation="custom"
              customValue={() => {
                const uniqueDirectors = new Set(
                  filteredMovies
                    .map(m => m.director)
                    .filter(d => d && d !== 'Unknown')
                );
                return uniqueDirectors.size;
              }}
              label="Unique Directors"
              icon={<User />}
            />
          </KPICardsPanel>

          {/* Tab Navigation */}
          <TabNavigation
            contentLabel="Movies"
            contentIcon={Film}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </>
      )}

      {/* Movies Tab Content */}
      {activeTab === 'content' && (
        <ContentTab
          loading={loading?.movies}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          viewModes={[
            { mode: 'grid', icon: Grid },
            { mode: 'list', icon: List }
          ]}
          items={filteredMovies}
          loadingIcon={Film}
          emptyState={{
            icon: Film,
            title: "No movies found",
            message: "No movies match your current filters. Try adjusting your criteria."
          }}
          onContentReady={handleContentReady}
          renderGrid={(movies) => (
            <ContentCardsGroup
              items={movies}
              viewMode="grid"
              renderItem={(movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  viewMode="grid"
                  onClick={handleMovieClick}
                />
              )}
            />
          )}
          renderList={(movies) => (
            <ContentCardsGroup
              items={movies}
              viewMode="list"
              renderItem={(movie) => (
                <MovieCard
                  key={`list-${movie.id}`}
                  movie={movie}
                  viewMode="list"
                  onClick={handleMovieClick}
                />
              )}
            />
          )}
        />
      )}

      {/* Analysis Tab Content */}
      {activeTab === 'analysis' && (
        <AnalysisTab
          data={filteredMovies}
          emptyState={{
            message: "No movie data available with current filters. Try adjusting your criteria."
          }}
          renderCharts={(data) => (
            <>
              <TimeSeriesBarChart
                data={data}
                dateColumnName="date"
                metricOptions={[
                  { value: 'count', label: 'Watch Count', aggregation: 'count', decimals: 0 },
                  { value: 'avgRating', label: 'Avg Rating', aggregation: 'average', field: 'rating', suffix: '★', decimals: 1 }
                ]}
                defaultMetric="count"
                title="Movies Over Time"
              />
              <TopChart
                data={data}
                dimensionOptions={[
                  { value: 'genre', label: 'Genre', field: 'genre', labelFields: ['genre'] },
                  { value: 'year', label: 'Year', field: 'year', labelFields: ['year'] },
                  { value: 'name', label: 'Movie', field: 'name', labelFields: ['name'] },
                  { value: 'type', label: 'Type', field: 'type', labelFields: ['type'] },
                  { value: 'director', label: 'Director', field: 'director', labelFields: ['director'] },
                  { value: 'cast', label: 'Cast', field: 'cast', labelFields: ['cast'], delimiter: ',' },
                  { value: 'certification', label: 'Certification', field: 'certification', labelFields: ['certification'] }
                ]}
                metricOptions={[
                  { value: 'avgRating', label: 'Avg Rating', aggregation: 'average', field: 'rating', suffix: '★', decimals: 1 },
                  { value: 'movies', label: 'Movies', aggregation: 'count_distinct', field: 'movie_id', countLabel: 'movies', decimals: 0 }
                ]}
                defaultDimension="genre"
                defaultMetric="movies"
                title="Top Movies Analysis"
                topN={10}
                imageField="poster_url"
                enableTopNControl={true}
                topNOptions={[5, 10, 15, 20, 25, 30]}
                enableSortToggle={true}
                scrollable={true}
                barHeight={50}
              />
            </>
          )}
        />
      )}

      {/* Movie Details Modal */}
      {selectedMovie && (
        <MovieDetails movie={selectedMovie} onClose={handleCloseDetails} />
      )}
    </PageWrapper>
  );
};

export default MoviesPage;

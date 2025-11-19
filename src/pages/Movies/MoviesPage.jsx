import { useState, useEffect } from 'react';
import { Film, Grid, List, Calendar, Tag, Star } from 'lucide-react';
import { useData } from '../../context/DataContext';

// Import components
import MovieDetails from './components/MovieDetails';
import MovieCard from './components/MovieCard';
import FilteringPanel from '../../components/ui/Filters/FilteringPanel/FilteringPanel';
import Filter from '../../components/ui/Filters/Filter/Filter';

// Import standardized components
import PageWrapper from '../../components/ui/PageWrapper/PageWrapper';
import PageHeader from '../../components/ui/PageHeader';
import TabNavigation from '../../components/ui/TabNavigation';
import ContentTab from '../../components/ui/ContentTab/ContentTab';
import AnalysisTab from '../../components/ui/AnalysisTab/AnalysisTab';
import KPICardsPanel from '../../components/ui/KPICardsPanel/KPICardsPanel';
import ContentCardsGroup from '../../components/ui/ContentCardsGroup';
import KpiCard from '../../components/charts/KpiCard';

// Import chart components for analysis tab
import TimeSeriesBarChart from '../../components/charts/TimeSeriesBarChart';
import TopChart from '../../components/charts/TopChart';

// Import utilities
import { sortByDateSafely } from '../../utils/sortingUtils';

const MoviesPage = () => {
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
  }, [fetchData]);

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

        return {
          ...movie,
          isRewatch,
          // Keep original genre field for display, add genres array for filtering
          genreArray: movie.genres
        };
      });

      // Sort by date (most recent first) and log last movie date
      const sortedMovies = processedMovies.sort((a, b) => {
        if (!a.date) return 1;
        if (!b.date) return -1;
        return b.date - a.date;
      });

      // Log the most recent movie with a date
      const mostRecentMovie = sortedMovies.find(m => m.date !== null);
      if (mostRecentMovie) {
        console.log('   Last movie watched:', mostRecentMovie.name, 'on', mostRecentMovie.date.toLocaleDateString());
      }

      setMovies(sortedMovies);
      setFilteredMovies(sortedMovies);
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
            data={{
              movies: movies
            }}
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
                metricColumnName="id"
                title="Movies Watched Over Time"
                yAxisLabel="Movies"
              />
              <TopChart
                data={data}
                dimensionOptions={[
                  { value: 'genre', label: 'Genre', field: 'genre', labelFields: ['genre'] },
                  { value: 'year', label: 'Year', field: 'year', labelFields: ['year'] },
                  { value: 'name', label: 'Movie', field: 'name', labelFields: ['name'] },
                  { value: 'type', label: 'Type', field: 'type', labelFields: ['type'] }
                ]}
                metricOptions={[
                  { value: 'count', label: 'Watch Count', aggregation: 'count', decimals: 0 },
                  { value: 'avgRating', label: 'Avg Rating', aggregation: 'average', field: 'rating', suffix: '★', decimals: 1 }
                ]}
                defaultDimension="genre"
                defaultMetric="count"
                title="Top Movies Analysis"
                topN={10}
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

import { useState, useEffect, useMemo } from 'react';
import { Book, Book as BookIcon, List, Grid, Clock, Calendar, Tag, User, Star } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { usePageTitle } from '../../hooks/usePageTitle';

// Import components
import BookDetails from './components/BookDetails';
import BookCard from './components/BookCard';

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
import IntensityHeatmap from '../../components/charts/IntensityHeatmap';
import TopChart from '../../components/charts/TopChart';


// Import utilities
import { sortByDateSafely } from '../../utils/sortingUtils';

const ReadingPage = () => {
  usePageTitle('Reading');
  const { data, loading, error, fetchData } = useData();
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [readingEntries, setReadingEntries] = useState([]);
  const [filteredReadingEntries, setFilteredReadingEntries] = useState([]);

  const [viewMode, setViewMode] = useState('grid');
  const [selectedBook, setSelectedBook] = useState(null);
  const [activeTab, setActiveTab] = useState('content');
  const [isContentReady, setIsContentReady] = useState(false);

  // Fetch reading data when component mounts
  useEffect(() => {
    if (typeof fetchData === 'function') {
      Promise.all([
        fetchData('readingBooks'),
        fetchData('readingSessions')
      ]);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Process books data when it's loaded from new dual-file structure
  useEffect(() => {
    if (data?.readingBooks && data?.readingSessions) {
      // Convert timestamp strings to Date objects for JavaScript date operations
      const processedBooks = data.readingBooks.map(book => ({
        ...book,
        timestamp: book.timestamp ? new Date(book.timestamp) : null
      }));

      const processedSessions = data.readingSessions.map(session => ({
        ...session,
        timestamp: session.timestamp ? new Date(session.timestamp) : null
      }));

      // Sort by most recent first
      const sortedBooks = sortByDateSafely(processedBooks);
      const sortedSessions = sortByDateSafely(processedSessions);

      setBooks(sortedBooks);
      setFilteredBooks(sortedBooks);
      setReadingEntries(sortedSessions);
      setFilteredReadingEntries(sortedSessions);
      // Reset content ready state when new data arrives
      setIsContentReady(false);
    }
  }, [data?.readingBooks, data?.readingSessions]);

  // Apply filters when FilteringPanel filters change
  // FilteringPanel now returns pre-filtered data per source!
  const handleFiltersChange = (filteredDataSources) => {
    // Re-sort filtered data (most recent first)
    const sortedBooks = sortByDateSafely(filteredDataSources.readingBooks || []);
    const sortedSessions = sortByDateSafely(filteredDataSources.readingSessions || []);

    setFilteredBooks(sortedBooks);
    setFilteredReadingEntries(sortedSessions);
  };

  const handleBookClick = (book) => {
    setSelectedBook(book);
  };

  const handleCloseDetails = () => {
    setSelectedBook(null);
  };

  const handleContentReady = () => {
    setIsContentReady(true);
  };

  // Memoize data object to prevent FilteringPanel re-renders
  const filterPanelData = useMemo(() => ({
    readingBooks: books,
    readingSessions: readingEntries
  }), [books, readingEntries]);

  return (
    <PageWrapper
      error={error?.readingBooks || error?.readingSessions}
      errorTitle="Reading Tracker"
    >
      {/* Page Header */}
      <PageHeader
        title="Reading Tracker"
        description="Track your reading habits and discover insights about your books"
      />

        {!(loading?.readingBooks || loading?.readingSessions) && isContentReady && (
          <>
            {/* FilteringPanel with Filter children */}
            <FilteringPanel
              data={filterPanelData}
              onFiltersChange={handleFiltersChange}
            >
              <Filter
                type="multiselect"
                label="Reading Years"
                field="reading_year"
                icon={<Clock />}
                placeholder="Select years"
                dataSources={['readingBooks', 'readingSessions']}
              />
              <Filter
                type="daterange"
                label="Reading Date"
                field="timestamp"
                icon={<Calendar />}
                dataSources={['readingBooks', 'readingSessions']}
              />
              <Filter
                type="multiselect"
                label="Genres"
                field="genre"
                icon={<Tag />}
                placeholder="Select genres"
                dataSources={['readingBooks', 'readingSessions']}
              />
              <Filter
                type="multiselect"
                label="Authors"
                field="author"
                icon={<User />}
                placeholder="Select authors"
                dataSources={['readingBooks']}
              />
              <Filter
                type="multiselect"
                label="Fiction/Non-Fiction"
                field="fiction_yn"
                icon={<Book />}
                defaultValue="all"
                dataSources={['readingBooks']}
                options={['all', 'Fiction', 'Non-Fiction']}
              />
              <Filter
                type="multiselect"
                label="My Rating"
                field="my_rating"
                icon={<Star />}
                placeholder="Select ratings"
                dataSources={['readingBooks']}
              />
            </FilteringPanel>

            {/* Statistics Cards with KpiCard children */}
            <KPICardsPanel
              dataSources={{
                readingBooks: filteredBooks,
                readingSessions: filteredReadingEntries
              }}
              loading={loading?.readingBooks || loading?.readingSessions}
            >
              <KpiCard
                dataSource="readingBooks"
                computation="count"
                label="Books Read"
                icon={<Book />}
              />
              <KpiCard
                dataSource="readingBooks"
                field="number_of_pages"
                computation="sum"
                label="Total Pages"
                icon={<BookIcon />}
              />
              <KpiCard
                dataSource="readingBooks"
                field="my_rating"
                computation="average"
                computationOptions={{ decimals: 1, filterZeros: true }}
                label="Average Rating"
                icon={<Star />}
              />
              <KpiCard
                dataSource="readingBooks"
                field="reading_duration_final"
                computation="average"
                computationOptions={{ decimals: 0, filterZeros: true }}
                label="Avg. Reading Duration (days)"
                icon={<Clock />}
              />
            </KPICardsPanel>

            {/* Tab Navigation */}
            <TabNavigation
              contentLabel="Books"
              contentIcon={BookIcon}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </>
        )}

        {/* Books Tab Content */}
        {activeTab === 'content' && (
          <ContentTab
            loading={loading?.readingBooks || loading?.readingSessions}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            viewModes={[
              { mode: 'grid', icon: Grid },
              { mode: 'list', icon: List }
            ]}
            items={filteredBooks}
            loadingIcon={Book}
            emptyState={{
              icon: BookIcon,
              title: "No books found",
              message: "No books match your current filters. Try adjusting your criteria."
            }}
            onContentReady={handleContentReady}
            renderGrid={(books) => (
              <ContentCardsGroup
                items={books}
                viewMode="grid"
                renderItem={(book) => (
                  <BookCard
                    key={`${book.book_id}-${book.title}`}
                    book={book}
                    viewMode="grid"
                    onClick={handleBookClick}
                  />
                )}
              />
            )}
            renderList={(books) => (
              <ContentCardsGroup
                items={books}
                viewMode="list"
                renderItem={(book) => (
                  <BookCard
                    key={`list-${book.book_id}-${book.title}`}
                    book={book}
                    viewMode="list"
                    onClick={handleBookClick}
                  />
                )}
              />
            )}
          />
        )}

        {/* Analysis Tab Content */}
        {activeTab === 'analysis' && (
          <AnalysisTab
            data={filteredReadingEntries}
            emptyState={{
              message: "No reading data available with current filters. Try adjusting your criteria."
            }}
            renderCharts={(readingSessions) => (
              <>
                <TimeSeriesBarChart
                  data={readingSessions}
                  dateColumnName="timestamp"
                  metricOptions={[
                    { value: 'pages', label: 'Pages Read', aggregation: 'sum', field: 'page_split', decimals: 0 },
                    { value: 'rating', label: 'Avg Rating', aggregation: 'average', field: 'my_rating', suffix: '★', decimals: 1 }
                  ]}
                  defaultMetric="pages"
                  title="Reading Activity by Period"
                />
                <IntensityHeatmap
                  data={readingSessions}
                  dateColumnName="timestamp"
                  valueColumnName="page_split"
                  title="Reading Activity by Day and Time"
                  treatMidnightAsUnknown={true}
                />
                <TopChart
                  data={filteredBooks}
                  dimensionOptions={[
                    { value: 'author', label: 'Author', field: 'author', labelFields: ['author'] },
                    { value: 'genre', label: 'Genre', field: 'genre', labelFields: ['genre'] },
                    { value: 'title', label: 'Book Title', field: 'title', labelFields: ['title', 'author'] }
                  ]}
                  metricOptions={[
                    { value: 'pages', label: 'Total Pages', aggregation: 'sum', field: 'number_of_pages', countLabel: 'pages', decimals: 0 },
                    { value: 'books', label: 'Total Books', aggregation: 'count_distinct', field: 'book_id', countLabel: 'books', decimals: 0 },
                    { value: 'pages per day', label: 'Avg pages per day', aggregation: 'average', field: 'pages_per_day', countLabel: 'pages per day', decimals: 0 },
                    { value: 'my_rating', label: 'Avg Rating', aggregation: 'average', field: 'my_rating', suffix: '★', decimals: 1 }
                  ]}
                  defaultDimension="author"
                  defaultMetric="pages"
                  title="Top Books Analysis"
                  topN={10}
                  imageField="cover_url"
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

      {/* Book Details Modal */}
      {selectedBook && (
        <BookDetails book={selectedBook} onClose={handleCloseDetails} />
      )}
    </PageWrapper>
  );
};

export default ReadingPage;

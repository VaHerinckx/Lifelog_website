import { useState, useEffect } from 'react';
import { Book, Book as BookIcon, List, Grid, Clock, Calendar, Tag, User, Star } from 'lucide-react';
import { useData } from '../../context/DataContext';

// Import components
import BookDetails from './components/BookDetails';
import BookCard from './components/BookCard';
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
import IntensityHeatmap from '../../components/charts/IntensityHeatmap';

// Import utilities
import { sortByDateSafely } from '../../utils/sortingUtils';

const ReadingPage = () => {
  const { data, loading, error, fetchData } = useData();
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [readingEntries, setReadingEntries] = useState([]);
  const [filteredReadingEntries, setFilteredReadingEntries] = useState([]);

  const [viewMode, setViewMode] = useState('grid');
  const [selectedBook, setSelectedBook] = useState(null);
  const [activeTab, setActiveTab] = useState('content');

  // Fetch reading data when component mounts
  useEffect(() => {
    if (typeof fetchData === 'function') {
      Promise.all([
        fetchData('readingBooks'),
        fetchData('readingSessions')
      ]);
    }
  }, [fetchData]);

  // Process books data when it's loaded from new dual-file structure
  useEffect(() => {
    if (data?.readingBooks && data?.readingSessions) {
      // Python processing now provides correct data types and sorting
      // Only need to convert timestamp strings to Date objects for JavaScript date operations
      const processedBooks = data.readingBooks.map(book => ({
        ...book,
        timestamp: new Date(book.timestamp)
      }));

      const processedSessions = data.readingSessions.map(session => ({
        ...session,
        timestamp: new Date(session.timestamp)
      }));

      // Data already sorted by Python, but set in state
      setBooks(processedBooks);
      setFilteredBooks(processedBooks);
      setReadingEntries(processedSessions);
      setFilteredReadingEntries(processedSessions);
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

        {!(loading?.readingBooks || loading?.readingSessions) && (
          <>
            {/* FilteringPanel with Filter children */}
            <FilteringPanel
              data={{
                readingBooks: books,
                readingSessions: readingEntries
              }}
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
            renderCharts={(books) => (
              <>
                <TimeSeriesBarChart
                  data={books}
                  dateColumnName="timestamp"
                  metricColumnName="page_split"
                  title="Total Pages Read by Period"
                  yAxisLabel="Pages"
                />
                <IntensityHeatmap
                  data={books}
                  dateColumnName="timestamp"
                  valueColumnName="page_split"
                  title="Reading Activity by Day and Time"
                  treatMidnightAsUnknown={true}
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

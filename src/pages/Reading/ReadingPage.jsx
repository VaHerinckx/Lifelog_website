import { useState, useEffect } from 'react';
import { Book, Book as BookIcon, List, Grid, Clock, Calendar, Tag, User, Star } from 'lucide-react';
import _ from 'lodash';
import { useData } from '../../context/DataContext';

// Import components
import BookDetails from './components/BookDetails';
import BookCard from './components/BookCard';
import FilteringPanel from '../../components/ui/Filters/FilteringPanel/FilteringPanel';
import Filter from '../../components/ui/Filters/Filter/Filter';

// Import new standardized components
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
      // Process books - direct mapping from CSV (no aggregation needed)
      const processedBooks = data.readingBooks.map(book => ({
        id: book.book_id,
        title: book.title || '',
        author: book.author || '',
        publicationYear: book.original_publication_year ? Math.floor(book.original_publication_year) : '',
        myRating: parseFloat(book.my_rating) || 0,
        averageRating: parseFloat(book.average_rating) || 0,
        genre: book.genre || 'Unknown',
        fiction: book.fiction_yn && book.fiction_yn.toLowerCase() === 'fiction',
        pages: parseInt(book.number_of_pages) || 0,
        coverUrl: book.cover_url || '',
        readingDuration: book.reading_duration_final ? parseInt(book.reading_duration_final) : null,
        timestamp: new Date(book.timestamp),
        reading_year: book.reading_year,
        reading_month: book.reading_month,
        reading_quarter: book.reading_quarter,
        page_split: book.page_split || 0
      }));

      // Sort by timestamp (most recent first)
      const sortedBooks = _.sortBy(processedBooks, book => book.timestamp).reverse();
      setBooks(sortedBooks);
      setFilteredBooks(sortedBooks);

      // Set reading sessions (already have derived date fields from Python)
      setReadingEntries(data.readingSessions);
      setFilteredReadingEntries(data.readingSessions);
    }
  }, [data?.readingBooks, data?.readingSessions]);

  // Apply filters when FilteringPanel filters change
  // FilteringPanel now returns pre-filtered data per source!
  const handleFiltersChange = (filteredDataSources) => {
    // Sort by timestamp (most recent first)
    const sortedBooks = _.sortBy(filteredDataSources.readingBooks || [], book => {
      return book.timestamp instanceof Date && !isNaN(book.timestamp.getTime())
        ? book.timestamp.getTime()
        : -Infinity;
    }).reverse();

    const sortedSessions = _.sortBy(filteredDataSources.readingSessions || [], entry => {
      const entryDate = new Date(entry.timestamp);
      return !isNaN(entryDate.getTime()) ? entryDate.getTime() : -Infinity;
    }).reverse();

    setFilteredBooks(sortedBooks);
    setFilteredReadingEntries(sortedSessions);
  };

  const handleBookClick = (book) => {
    setSelectedBook(book);
  };

  const handleCloseDetails = () => {
    setSelectedBook(null);
  };

  if ((error && error.readingBooks) || (error && error.readingSessions)) {
    return (
      <div className="page-container">
        <div className="page-content">
          <h1>Reading Tracker</h1>
          <div className="error">
            Error loading reading data: {error.readingBooks || error.readingSessions}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-content">
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
                type="singleselect"
                label="Fiction/Non-Fiction"
                field="fiction"
                icon={<Book />}
                defaultValue="all"
                dataSources={['readingBooks']}
                options={['all', 'fiction', 'non-fiction']}
              />
              <Filter
                type="multiselect"
                label="My Rating"
                field="myRating"
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
                field="pages"
                computation="sum"
                label="Total Pages"
                icon={<BookIcon />}
              />
              <KpiCard
                dataSource="readingBooks"
                field="myRating"
                computation="average"
                computationOptions={{ decimals: 1, filterZeros: true }}
                label="Average Rating"
                icon={<Star />}
              />
              <KpiCard
                dataSource="readingBooks"
                field="readingDuration"
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
                    key={`${book.id}-${book.title}`}
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
                    key={`list-${book.id}-${book.title}`}
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
      </div>
    </div>
  );
};

export default ReadingPage;

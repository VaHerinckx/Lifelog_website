import { useState, useEffect, useMemo } from 'react';
import { Book, Book as BookIcon, BookOpen, List, Grid, Star } from 'lucide-react';
import _ from 'lodash';
import { useData } from '../../context/DataContext';
import { applyFilters } from '../../utils';

// Import components
import BookDetails from './components/BookDetails';
import BookCard from './components/BookCard';
import FilteringPanel from '../../components/ui/Filters/FilteringPanel/FilteringPanel';
import { readingFilterConfigs } from '../../config/filterConfigs';

// Import new standardized components
import PageHeader from '../../components/ui/PageHeader';
import TabNavigation from '../../components/ui/TabNavigation';
import ContentTab from '../../components/ui/ContentTab/ContentTab';
import AnalysisTab from '../../components/ui/AnalysisTab/AnalysisTab';
import CardsPanel from '../../components/ui/CardsPanel/CardsPanel';
import CardGroup from '../../components/ui/CardGroup';

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
  const [readingStats, setReadingStats] = useState({
    totalBooks: 0,
    totalPages: 0,
    avgRating: 0,
    avgReadingDuration: 0,
    recentBooks: 0
  });
  const [activeTab, setActiveTab] = useState('content');

  // Create filter config map for applyFilters utility
  const filterConfigsMap = useMemo(() => {
    return readingFilterConfigs.reduce((acc, config) => {
      acc[config.key] = config;
      return acc;
    }, {});
  }, []);

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

      // Calculate stats
      const now = new Date();
      const lastMonthDate = new Date();
      lastMonthDate.setMonth(now.getMonth() - 1);

      const recentBooks = sortedBooks.filter(book =>
        book.timestamp && book.timestamp >= lastMonthDate
      ).length;

      setReadingStats({
        totalBooks: sortedBooks.length,
        totalPages: _.sumBy(sortedBooks, 'pages'),
        avgRating: sortedBooks.filter(book => book.myRating > 0).length > 0
          ? _.meanBy(sortedBooks.filter(book => book.myRating > 0), 'myRating').toFixed(1)
          : "0.0",
        avgReadingDuration: Math.round(_.meanBy(
          sortedBooks.filter(book => book.readingDuration),
          'readingDuration'
        )) || 0,
        recentBooks: recentBooks
      });
    }
  }, [data?.readingBooks, data?.readingSessions]);

  // Apply filters when FilteringPanel filters change
  const handleFiltersChange = (newFilters) => {
    if (books.length === 0) return;

    // Apply filters using centralized utility
    let filteredBooks = applyFilters(books, newFilters, filterConfigsMap);
    let filteredSessions = applyFilters(readingEntries, newFilters, filterConfigsMap);

    // Sort by timestamp (most recent first)
    filteredBooks = _.sortBy(filteredBooks, book => {
      return book.timestamp instanceof Date && !isNaN(book.timestamp.getTime())
        ? book.timestamp.getTime()
        : -Infinity;
    }).reverse();

    filteredSessions = _.sortBy(filteredSessions, entry => {
      const entryDate = new Date(entry.timestamp);
      return !isNaN(entryDate.getTime()) ? entryDate.getTime() : -Infinity;
    }).reverse();

    setFilteredBooks(filteredBooks);
    setFilteredReadingEntries(filteredSessions);
  };

  // Update stats when filtered books change
  useEffect(() => {
    if (filteredBooks.length > 0) {
      const now = new Date();
      const lastMonthDate = new Date();
      lastMonthDate.setMonth(now.getMonth() - 1);

      const recentBooks = filteredBooks.filter(book =>
        book.timestamp && book.timestamp >= lastMonthDate
      ).length;

      setReadingStats({
        totalBooks: filteredBooks.length,
        totalPages: _.sumBy(filteredBooks, 'pages'),
        avgRating: filteredBooks.filter(book => book.myRating > 0).length > 0
          ? _.meanBy(filteredBooks.filter(book => book.myRating > 0), 'myRating').toFixed(1)
          : "0.0",
        avgReadingDuration: Math.round(_.meanBy(
          filteredBooks.filter(book => book.readingDuration),
          'readingDuration'
        )),
        recentBooks: recentBooks
      });
    }
  }, [filteredBooks]);

  const handleBookClick = (book) => {
    setSelectedBook(book);
  };

  const handleCloseDetails = () => {
    setSelectedBook(null);
  };

  // Prepare cards data for CardsPanel
  const prepareStatsCards = () => {
    const cards = [
      {
        value: readingStats.totalBooks.toLocaleString(),
        label: "Books Read",
        icon: <Book size={24} />
      },
      {
        value: readingStats.totalPages.toLocaleString(),
        label: "Total Pages",
        icon: <BookOpen size={24} />
      },
      {
        value: readingStats.avgRating,
        label: "Average Rating",
        icon: <Star size={24} />
      },
      {
        value: readingStats.recentBooks.toLocaleString(),
        label: "Books Last Month",
        icon: <BookOpen size={24} />
      }
    ];

    if (readingStats.avgReadingDuration > 0) {
      cards.splice(3, 0, {
        value: readingStats.avgReadingDuration.toLocaleString(),
        label: "Avg. Days to Read",
        icon: <BookOpen size={24} />
      });
    }

    return cards;
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
            {/* Tab Navigation */}
            <TabNavigation
              contentLabel="Books"
              contentIcon={BookIcon}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
            {/* NEW: FilteringPanel replaces all the old filters */}
            <FilteringPanel
              data={books}
              filterConfigs={readingFilterConfigs}
              onFiltersChange={handleFiltersChange}
            />

            {/* Statistics Cards */}
            <CardsPanel
              cards={prepareStatsCards()}
              loading={loading?.readingBooks || loading?.readingSessions}
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
              <CardGroup
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
              <CardGroup
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

import { useState, useEffect } from 'react';
import { Book, Book as BookIcon, BookOpen, List, Grid, Star } from 'lucide-react';
import Papa from 'papaparse';
import _ from 'lodash';
import { useData } from '../../context/DataContext';

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


  // Function to process books data from the API response
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

  // Fetch reading data from actual CSV when we can't load from data context
  const fetchReadingData = async () => {
    try {
      const response = await window.fs.readFile('kindle_gr_processed.csv', { encoding: 'utf8' });
      const cleanedResponse = response.replace(/\u0000/g, '');

      const parsedData = Papa.parse(cleanedResponse, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        delimiter: '|'
      });

      if (data) {
        data.reading = parsedData.data;
      }

      processBooks(parsedData.data);
    } catch (error) {
      console.error('Error fetching reading data:', error);
    }
  };

  // Fetch reading data when component mounts
  useEffect(() => {
    if (typeof fetchData === 'function') {
      fetchData('reading');
    } else {
      fetchReadingData();
    }
  }, [fetchData]);

  // Process the books data
  const processBooks = (readingData) => {
    if (!readingData || readingData.length === 0) return;

    // Add reading_year field to each reading entry for filtering
    const enhancedReadingData = readingData.map(entry => {
      const timestamp = new Date(entry.Timestamp || '');
      return {
        ...entry,
        reading_year: timestamp instanceof Date && !isNaN(timestamp.getTime())
          ? timestamp.getFullYear().toString()
          : null
      };
    });

    setReadingEntries(enhancedReadingData);
    const processedBooks = _.chain(enhancedReadingData)
      .groupBy(entry => `${entry.Title}:::${entry.Author}`)
      .map((entries) => {
        const latestEntry = _.maxBy(entries, entry => new Date(entry['Timestamp'] || entry.Timestamp));
        if (!latestEntry) return null;

        const bookId = latestEntry['Book Id'] || latestEntry['��Book Id'] || '';
        const originalYear = latestEntry['Original Publication Year'] || '';
        const myRating = latestEntry['My Rating'] || 0;
        const avgRating = latestEntry['Average Rating'] || 0;
        const fictionYn = latestEntry['Fiction_yn'] || '';
        const numPages = latestEntry['Number of Pages'] || 0;
        const coverUrl = latestEntry['cover_url'] || '';
        const readingDuration = latestEntry['reading_duration'] || null;
        const bookTimestamp = new Date(latestEntry.Timestamp || '');

        return {
          id: bookId,
          title: latestEntry.Title || '',
          author: latestEntry.Author || '',
          publicationYear: originalYear ? Math.floor(originalYear) : '',
          myRating: parseFloat(myRating),
          averageRating: parseFloat(avgRating),
          genre: latestEntry.Genre || 'Unknown',
          fiction: fictionYn.toLowerCase() === 'fiction',
          pages: parseInt(numPages),
          coverUrl: coverUrl,
          readingDuration: readingDuration ? parseInt(readingDuration) : null,
          timestamp: bookTimestamp,
          reading_year: bookTimestamp instanceof Date && !isNaN(bookTimestamp.getTime())
            ? bookTimestamp.getFullYear().toString()
            : null,
          page_split: latestEntry.page_split || 0
        };
      })
      .filter(Boolean)
      .value();

    const sortedBooks = _.sortBy(processedBooks, book => book.timestamp).reverse();
    setBooks(sortedBooks);
    setFilteredBooks(sortedBooks);
    setFilteredReadingEntries(enhancedReadingData);

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
      avgRating: _.meanBy(sortedBooks, 'myRating').toFixed(1),
      avgReadingDuration: Math.round(_.meanBy(
        sortedBooks.filter(book => book.readingDuration),
        'readingDuration'
      )),
      recentBooks: recentBooks
    });
  };

  // Process books data when it's loaded
  useEffect(() => {
    if (data && data.reading) {
      processBooks(data.reading);
    }
  }, [data]);

  // Apply filters when FilteringPanel filters change
  const handleFiltersChange = (newFilters) => {
    if (books.length > 0) {
      let filtered = [...books];
      let filteredEntries = [...readingEntries];

      // Apply date range filter to books
      if (newFilters.dateRange && (newFilters.dateRange.startDate || newFilters.dateRange.endDate)) {
        filtered = filtered.filter(book => {
          if (!book.timestamp || isNaN(book.timestamp.getTime())) return false;

          const bookDate = book.timestamp;
          const startDate = newFilters.dateRange.startDate ? new Date(newFilters.dateRange.startDate) : null;
          const endDate = newFilters.dateRange.endDate ? new Date(newFilters.dateRange.endDate) : null;

          if (startDate && bookDate < startDate) return false;
          if (endDate && bookDate > endDate) return false;

          return true;
        });

        // Apply date range filter to reading entries
        filteredEntries = filteredEntries.filter(entry => {
          const entryDate = new Date(entry.Timestamp);
          if (isNaN(entryDate.getTime())) return false;

          const startDate = newFilters.dateRange.startDate ? new Date(newFilters.dateRange.startDate) : null;
          const endDate = newFilters.dateRange.endDate ? new Date(newFilters.dateRange.endDate) : null;

          if (startDate && entryDate < startDate) return false;
          if (endDate && entryDate > endDate) return false;

          return true;
        });
      }

      // Apply reading years filter (multi-select)
      if (newFilters.readingYears && Array.isArray(newFilters.readingYears) && newFilters.readingYears.length > 0) {
        filtered = filtered.filter(book => book.reading_year && newFilters.readingYears.includes(book.reading_year));
        filteredEntries = filteredEntries.filter(entry => entry.reading_year && newFilters.readingYears.includes(entry.reading_year));
      }

      // Apply genres filter (multi-select)
      if (newFilters.genres && Array.isArray(newFilters.genres) && newFilters.genres.length > 0) {
        filtered = filtered.filter(book => newFilters.genres.includes(book.genre));
        filteredEntries = filteredEntries.filter(entry => newFilters.genres.includes(entry.Genre));
      }

      // Apply authors filter (multi-select)
      if (newFilters.authors && Array.isArray(newFilters.authors) && newFilters.authors.length > 0) {
        filtered = filtered.filter(book => newFilters.authors.includes(book.author));
        filteredEntries = filteredEntries.filter(entry => newFilters.authors.includes(entry.Author));
      }

      // Apply books filter (multi-select)
      if (newFilters.books && Array.isArray(newFilters.books) && newFilters.books.length > 0) {
        filtered = filtered.filter(book => newFilters.books.includes(book.title));
        filteredEntries = filteredEntries.filter(entry => newFilters.books.includes(entry.Title));
      }

      // Default sorting by most recent
      filtered = _.sortBy(filtered, book => {
        return book.timestamp instanceof Date && !isNaN(book.timestamp.getTime())
          ? book.timestamp.getTime()
          : -Infinity;
      }).reverse();

      // Sort reading entries by timestamp as well
      filteredEntries = _.sortBy(filteredEntries, entry => {
        const entryDate = new Date(entry.Timestamp);
        return !isNaN(entryDate.getTime()) ? entryDate.getTime() : -Infinity;
      }).reverse();

      setFilteredBooks(filtered);
      setFilteredReadingEntries(filteredEntries);
    }
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
          data.reading = cleanedData;
        }
        processBooks(cleanedData);
      }
    });
  };

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

  if (error && error.reading) {
    return (
      <div className="page-container">
        <div className="page-content">
          <h1>Reading Tracker</h1>
          <div className="error">
            Error loading reading data: {error.reading}
          </div>
          <div className="fallback-upload">
            <p>You can manually upload your reading data CSV:</p>
            <input type="file" accept=".csv" onChange={handleFileUpload} />
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

        {!loading?.reading && (
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
              loading={loading?.reading}
            />
          </>
        )}

        {/* Books Tab Content */}
        {activeTab === 'content' && (
          <ContentTab
            loading={loading?.reading}
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
                  dateColumnName="Timestamp"
                  metricColumnName="page_split"
                  title="Total Pages Read by Period"
                  yAxisLabel="Pages"
                />
                <TimeSeriesBarChart
                  data={books}
                  dateColumnName="Timestamp"
                  metricColumnName="page_split"
                  title="Total Pages Read by Period (Copy)"
                  yAxisLabel="Pages"
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

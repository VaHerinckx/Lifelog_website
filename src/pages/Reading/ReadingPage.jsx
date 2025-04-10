import React, { useState, useEffect } from 'react';
import { Book, Book as BookIcon, Star, StarHalf, BookOpen, List, Grid, Clock, BarChart } from 'lucide-react';
import Papa from 'papaparse';
import _ from 'lodash';
import './ReadingPage.css';
import './components//ReadingPageTabs.css';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useData } from '../../context/DataContext';

// Import components
import BookDetails from './components/BookDetails';
import ReadingTimeline from './components/ReadingTimeline';
import ReadingAnalysisTab from './components/ReadingAnalysisTab';
import KpiCard from '../../components/charts/KpiCard';

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




// Component to display a book card
const BookCard = ({ book, onClick }) => {
  // Format the timestamp to a readable date
  const formatDate = (date) => {
    if (!date || !(date instanceof Date) || isNaN(date)) return 'Unknown date';
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="book-card" onClick={() => onClick(book)}>
      <div className="book-cover-container">
        <img
          src={book.coverUrl || "/api/placeholder/220/320"}
          alt={`${book.title} cover`}
          className="book-cover"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "/api/placeholder/220/320";
          }}
        />
      </div>
      <div className="book-info">
        <h3 className="book-title" title={book.title}>{book.title}</h3>
        <p className="book-author" title={book.author}>by {book.author}</p>

        <div className="rating-container">
          <StarRating rating={book.myRating} size={16} />
          <span>{book.myRating.toFixed(1)}</span>
        </div>

        <div className="book-meta">
          {book.publicationYear && <span>{book.publicationYear}</span>}
          <div className="book-genre-tags">
            <span className={`book-genre ${book.fiction ? 'fiction-tag' : 'non-fiction-tag'}`}>
              {book.fiction ? 'Fiction' : 'Non-Fiction'}
            </span>
          </div>
        </div>

        {/* Add reading date information */}
        <div className="reading-dates">
          <span className="date-label">Read on:</span>
          <span className="date-value">{formatDate(book.timestamp)}</span>
        </div>

        {/* If you have reading duration, you can show a calculated start date */}
        {book.readingDuration && book.timestamp && (
          <div className="reading-duration">
            <span className="duration-value">
              {book.readingDuration} days to read
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

const ReadingPage = () => {
  const { data, loading, error, fetchData } = useData();
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [readingEntries, setReadingEntries] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedFiction, setSelectedFiction] = useState('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState('all');
  const [sortOrder, setSortOrder] = useState('recent');
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'list', or 'timeline'
  const [genres, setGenres] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [readingStats, setReadingStats] = useState({
    totalBooks: 0,
    totalPages: 0,
    avgRating: 0,
    avgReadingDuration: 0,
    recentBooks: 0
  });
  const [activeTab, setActiveTab] = useState('books'); // Added state for active tab
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null
  });

  // Function to process books data from the API response
  const processRawData = (rawData) => {
    // Remove null bytes and process the data
    const processedData = rawData.map(item => {
      return Object.entries(item).reduce((acc, [key, value]) => {
        // Clean up keys by removing null bytes
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
      const response = await window.fs.readFile('kindle_gr_processed_sample.csv', { encoding: 'utf8' });
      const cleanedResponse = response.replace(/\u0000/g, '');

      const parsedData = Papa.parse(cleanedResponse, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        delimiter: '|'
      });

      // Here we assume our data context would normally handle this
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchData]);

  // Process the books data
  const processBooks = (readingData) => {
    if (!readingData || readingData.length === 0) return;

    // Process the books data: group by title to get unique books
    setReadingEntries(readingData);
    const processedBooks = _.chain(readingData)
      .groupBy('Title')
      .map((entries, title) => {
        // Use the latest entry data for each book
        const latestEntry = _.maxBy(entries, entry => new Date(entry['Timestamp'] || entry.Timestamp));
        if (!latestEntry) return null;

        // Handle different possible data structures
        const bookId = latestEntry['Book Id'] || latestEntry['��Book Id'] || '';
        const originalYear = latestEntry['Original Publication Year'] || '';
        const myRating = latestEntry['My Rating'] || 0;
        const avgRating = latestEntry['Average Rating'] || 0;
        const fictionYn = latestEntry['Fiction_yn'] || '';
        const numPages = latestEntry['Number of Pages'] || 0;
        const coverUrl = latestEntry['cover_url'] || '';
        const readingDuration = latestEntry['reading_duration'] || null;

        return {
          id: bookId,
          title: title,
          author: latestEntry.Author || '',
          publicationYear: originalYear ? Math.floor(originalYear) : '',
          myRating: parseFloat(myRating),
          averageRating: parseFloat(avgRating),
          genre: latestEntry.Genre || 'Unknown',
          fiction: fictionYn.toLowerCase() === 'fiction',
          pages: parseInt(numPages),
          coverUrl: coverUrl,
          readingDuration: readingDuration ? parseInt(readingDuration) : null,
          timestamp: new Date(latestEntry.Timestamp || ''),
          page_split: latestEntry.page_split || 0 // Important for reading pace analysis
        };
      })
      .filter(Boolean) // Remove null entries
      .value();

    // Sort books by most recently read
    const sortedBooks = _.sortBy(processedBooks, book => book.timestamp).reverse();

    setBooks(sortedBooks);
    setFilteredBooks(sortedBooks);

    // Extract unique genres
    const uniqueGenres = _.uniq(
      processedBooks
        .map(book => book.genre)
        .filter(genre => genre && genre !== 'Unknown')
    );
    setGenres(uniqueGenres);

    // Calculate reading stats
    const now = new Date();
    const lastMonthDate = new Date();
    lastMonthDate.setMonth(now.getMonth() - 1);

    // Find date range for analysis tab
    if (sortedBooks.length > 0) {
      const validDates = sortedBooks
        .map(book => book.timestamp)
        .filter(date => date instanceof Date && !isNaN(date.getTime()))
        .sort((a, b) => a - b);

      if (validDates.length > 0) {
        setDateRange({
          startDate: validDates[0].toISOString().split('T')[0],
          endDate: validDates[validDates.length - 1].toISOString().split('T')[0]
        });
      }
    }

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

  // Filter and sort books when criteria change
  useEffect(() => {
    if (books.length > 0) {
      let filtered = [...books];

      // Apply genre filter
      if (selectedGenre !== 'all') {
        filtered = filtered.filter(book => book.genre === selectedGenre);
      }

      // Apply fiction/non-fiction filter
      if (selectedFiction !== 'all') {
        const isFiction = selectedFiction === 'fiction';
        filtered = filtered.filter(book => book.fiction === isFiction);
      }

      // Apply timeframe filter
      if (selectedTimeframe !== 'all') {
        const now = new Date();
        let cutoffDate = new Date();

        switch (selectedTimeframe) {
          case 'month':
            cutoffDate.setMonth(now.getMonth() - 1);
            break;
          case 'quarter':
            cutoffDate.setMonth(now.getMonth() - 3);
            break;
          case 'year':
            cutoffDate.setFullYear(now.getFullYear() - 1);
            break;
          default:
            break;
        }

        filtered = filtered.filter(book => book.timestamp >= cutoffDate);
      }

      // Apply sorting
      if (sortOrder === 'recent') {
        filtered = _.sortBy(filtered, book => {
          // Check if timestamp is a valid date
          return book.timestamp instanceof Date && !isNaN(book.timestamp.getTime())
            ? book.timestamp.getTime()  // Use getTime() for valid dates
            : -Infinity;  // Push invalid dates to the end
        }).reverse();
      } else if (sortOrder === 'rating') {
        filtered = _.sortBy(filtered, book => book.myRating).reverse();
      } else if (sortOrder === 'title') {
        filtered = _.sortBy(filtered, book => book.title.toLowerCase());
      }

      setFilteredBooks(filtered);
    }
  }, [books, selectedGenre, selectedFiction, selectedTimeframe, sortOrder]);

  // Add this effect to update stats when filtered books change
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

  // Handle book selection for detailed view
  const handleBookClick = (book) => {
    setSelectedBook(book);
  };

  // Handle closing the book details modal
  const handleCloseDetails = () => {
    setSelectedBook(null);
  };

  if (loading && loading.reading) {
    return <LoadingSpinner centerIcon={BookIcon} />;
  }

  if ((error && error.reading) || (!books.length && !loading?.reading)) {
    return (
      <div className="page-container">
        <div className="page-content">
          <h1>Reading Tracker</h1>
          <div className="error">
            {error?.reading ?
              `Error loading reading data: ${error.reading}` :
              "No reading data available. Please upload your data."}
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
        <h1>Reading Tracker</h1>
        <p className="page-description">Track your reading habits and discover insights about your books</p>

        {/* Tab Navigation */}
        <div className="page-tabs">
          <button
            className={`page-tab ${activeTab === 'books' ? 'active' : ''}`}
            onClick={() => setActiveTab('books')}
          >
            <BookIcon size={18} style={{ marginRight: '8px' }} />
            Books
          </button>
          <button
            className={`page-tab ${activeTab === 'analysis' ? 'active' : ''}`}
            onClick={() => setActiveTab('analysis')}
          >
            <BarChart size={18} style={{ marginRight: '8px' }} />
            Analysis
          </button>
        </div>

        {/* Books Tab Content */}
        {activeTab === 'books' && (
          <>
            {/* Enhanced Filters and Controls */}
            <div className="controls-container">
              <div className="filters-section">
                <div className="filter-group">
                  <label htmlFor="genre-select">Genre:</label>
                  <select
                    id="genre-select"
                    value={selectedGenre}
                    onChange={(e) => setSelectedGenre(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All Genres</option>
                    {genres.map(genre => (
                      <option key={genre} value={genre}>{genre}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label htmlFor="fiction-select">Type:</label>
                  <select
                    id="fiction-select"
                    value={selectedFiction}
                    onChange={(e) => setSelectedFiction(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All Types</option>
                    <option value="fiction">Fiction</option>
                    <option value="non-fiction">Non-Fiction</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label htmlFor="timeframe-select">Period:</label>
                  <select
                    id="timeframe-select"
                    value={selectedTimeframe}
                    onChange={(e) => setSelectedTimeframe(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All Time</option>
                    <option value="month">Last Month</option>
                    <option value="quarter">Last 3 Months</option>
                    <option value="year">Last Year</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label htmlFor="sort-select">Sort By:</label>
                  <select
                    id="sort-select"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="filter-select"
                  >
                    <option value="recent">Most Recent</option>
                    <option value="rating">Highest Rated</option>
                    <option value="title">Title (A-Z)</option>
                  </select>
                </div>
              </div>

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
                <button
                  className={`view-control-btn ${viewMode === 'timeline' ? 'active' : ''}`}
                  onClick={() => setViewMode('timeline')}
                  title="Timeline View"
                >
                  <Clock size={20} />
                </button>
                <div className="book-count">
                  {filteredBooks.length} {filteredBooks.length === 1 ? 'book' : 'books'} found
                </div>
              </div>
            </div>

            {/* Reading Stats */}
            <div className="stats-cards">
              <KpiCard
                value={readingStats.totalBooks.toLocaleString()}
                label="Books Read"
                icon={<Book size={24} />}
              />
              <KpiCard
                value={readingStats.totalPages.toLocaleString()}
                label="Total Pages"
                icon={<BookOpen size={24} />}
              />
              <KpiCard
                value={readingStats.avgRating}
                label="Average Rating"
                icon={<Star size={24} />}
              />
              {readingStats.avgReadingDuration > 0 && (
                <KpiCard
                  value={readingStats.avgReadingDuration}
                  label="Avg. Days to Read"
                  icon={<Clock size={24} />}
                />
              )}
              <KpiCard
                value={readingStats.recentBooks}
                label="Books Last Month"
                icon={<BookOpen size={24} />}
              />
            </div>

            {/* Books Display - conditional rendering based on view mode */}
            {filteredBooks.length > 0 ? (
              <>
                {/* Grid View */}
                {viewMode === 'grid' && (
                  <div className="books-grid">
                    {filteredBooks.map(book => (
                      <BookCard
                        key={`${book.id}-${book.title}`}
                        book={book}
                        onClick={handleBookClick}
                      />
                    ))}
                  </div>
                )}

                {/* List View */}
                {viewMode === 'list' && (
                  <div className="books-list">
                    {filteredBooks.map(book => (
                      <div
                        key={`list-${book.id}-${book.title}`}
                        className="book-list-item"
                        onClick={() => handleBookClick(book)}
                      >
                        <div className="book-list-cover">
                          <img
                            src={book.coverUrl || "/api/placeholder/80/120"}
                            alt={`${book.title} cover`}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "/api/placeholder/80/120";
                            }}
                          />
                        </div>
                        <div className="book-list-info">
                          <h3 className="book-list-title">{book.title}</h3>
                          <p className="book-list-author">{book.author}</p>
                          <div className="book-list-meta">
                            <div className="rating-container">
                              <StarRating rating={book.myRating} />
                              <span className="rating-value">{book.myRating.toFixed(1)}</span>
                            </div>
                            <div className="book-list-details">
                              <BookOpen size={16} />
                              <span>{book.pages} pages</span>
                              {book.readingDuration && (
                                <span className="reading-duration">
                                  • Read in {book.readingDuration} days
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="book-list-tags">
                          <span className={`book-list-tag ${book.fiction ? 'fiction-tag' : 'non-fiction-tag'}`}>
                            {book.fiction ? 'Fiction' : 'Non-Fiction'}
                          </span>
                          {book.genre && book.genre !== 'Unknown' && (
                            <span className="book-list-tag genre-tag">{book.genre}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Timeline View */}
                {viewMode === 'timeline' && (
                  <ReadingTimeline books={filteredBooks} />
                )}
              </>
            ) : (
              <div className="empty-state">
                <BookIcon size={48} className="empty-state-icon" />
                <p className="empty-state-message">
                  No books match your current filters. Try adjusting your criteria.
                </p>
              </div>
            )}
          </>
        )}

        {/* Analysis Tab Content */}
        {activeTab === 'analysis' && (
          <ReadingAnalysisTab books={readingEntries} dateRange={dateRange} />
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

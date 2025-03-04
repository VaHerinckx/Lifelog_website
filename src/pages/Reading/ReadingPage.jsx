import React, { useState, useEffect } from 'react';
import { Book as BookIcon, Star, StarHalf, BookOpen, List, Grid } from 'lucide-react';
import Papa from 'papaparse';
import _ from 'lodash';
import './ReadingPage.css';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useData } from '../../context/DataContext';

// Import the BookDetails component
import BookDetails from './components/BookDetails';

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
      </div>
    </div>
  );
};

const ReadingPage = () => {
  const { data, loading, error, fetchData } = useData();
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedFiction, setSelectedFiction] = useState('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState('all');
  const [sortOrder, setSortOrder] = useState('recent');
  const [viewMode, setViewMode] = useState('grid');
  const [genres, setGenres] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [readingStats, setReadingStats] = useState({
    totalBooks: 0,
    totalPages: 0,
    avgRating: 0,
    avgReadingDuration: 0,
    recentBooks: 0
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
          timestamp: new Date(latestEntry.Timestamp || '')
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

    const recentBooks = processedBooks.filter(book =>
      book.timestamp && book.timestamp >= lastMonthDate
    ).length;

    setReadingStats({
      totalBooks: processedBooks.length,
      totalPages: _.sumBy(processedBooks, 'pages'),
      avgRating: _.meanBy(processedBooks, 'myRating').toFixed(1),
      avgReadingDuration: Math.round(_.meanBy(
        processedBooks.filter(book => book.readingDuration),
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
        filtered = _.sortBy(filtered, book => book.timestamp).reverse();
      } else if (sortOrder === 'rating') {
        filtered = _.sortBy(filtered, book => book.myRating).reverse();
      } else if (sortOrder === 'title') {
        filtered = _.sortBy(filtered, book => book.title.toLowerCase());
      }

      setFilteredBooks(filtered);
    }
  }, [books, selectedGenre, selectedFiction, selectedTimeframe, sortOrder]);

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

        {/* Reading Stats */}
        <div className="stats-cards">
          <div className="stat-card">
            <div className="stat-value">{readingStats.totalBooks}</div>
            <div className="stat-label">Books Read</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{readingStats.totalPages.toLocaleString()}</div>
            <div className="stat-label">Total Pages</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{readingStats.avgRating}</div>
            <div className="stat-label">Average Rating</div>
          </div>
          {readingStats.avgReadingDuration > 0 && (
            <div className="stat-card">
              <div className="stat-value">{readingStats.avgReadingDuration}</div>
              <div className="stat-label">Avg. Days to Read</div>
            </div>
          )}
          <div className="stat-card">
            <div className="stat-value">{readingStats.recentBooks}</div>
            <div className="stat-label">Books Last Month</div>
          </div>
        </div>

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
            <div className="book-count">
              {filteredBooks.length} {filteredBooks.length === 1 ? 'book' : 'books'} found
            </div>
          </div>
        </div>

        {/* Books Display */}
        {filteredBooks.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="books-grid">
              {filteredBooks.map(book => (
                <BookCard
                  key={`${book.id}-${book.title}`}
                  book={book}
                  onClick={handleBookClick}
                />
              ))}
            </div>
          ) : (
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
          )
        ) : (
          <div className="empty-state">
            <BookIcon size={48} className="empty-state-icon" />
            <p className="empty-state-message">
              No books match your current filters. Try adjusting your criteria.
            </p>
          </div>
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

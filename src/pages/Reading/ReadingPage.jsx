import React, { useState, useEffect } from 'react';
import { Book, Book as BookIcon, Star, StarHalf, BookOpen, List, Grid, Clock, BarChart, Tag, User } from 'lucide-react';
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
import CardsPanel from '../../components/ui/CardsPanel/CardsPanel';
import Filter from '../../components/ui/Filters/Filter/Filter'; // NEW: Import Filter component for testing

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

        <div className="reading-dates">
          <span className="date-label">Read on:</span>
          <span className="date-value">{formatDate(book.timestamp)}</span>
        </div>

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

  // UPDATED: Replace individual filter states with centralized filter state
  const [filters, setFilters] = useState({
    genre: 'all',
    fictionType: 'all',
    timeframe: 'all',
    sortOrder: 'recent',
    // NEW: Test filters for the new Filter component
    authors: [], // Multi-select
    selectedGenres: [] // Multi-select
  });

  const [viewMode, setViewMode] = useState('grid');
  const [genres, setGenres] = useState([]);
  const [authors, setAuthors] = useState([]); // NEW: For testing multi-select
  const [selectedBook, setSelectedBook] = useState(null);
  const [readingStats, setReadingStats] = useState({
    totalBooks: 0,
    totalPages: 0,
    avgRating: 0,
    avgReadingDuration: 0,
    recentBooks: 0
  });
  const [activeTab, setActiveTab] = useState('books');
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null
  });

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
      const response = await window.fs.readFile('kindle_gr_processed_sample.csv', { encoding: 'utf8' });
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

    setReadingEntries(readingData);
    const processedBooks = _.chain(readingData)
      .groupBy('Title')
      .map((entries, title) => {
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
          page_split: latestEntry.page_split || 0
        };
      })
      .filter(Boolean)
      .value();

    const sortedBooks = _.sortBy(processedBooks, book => book.timestamp).reverse();
    setBooks(sortedBooks);
    setFilteredBooks(sortedBooks);

    // Extract unique genres and authors for filter options
    const uniqueGenres = _.uniq(
      processedBooks
        .map(book => book.genre)
        .filter(genre => genre && genre !== 'Unknown')
    );
    setGenres(uniqueGenres);

    // NEW: Extract unique authors for testing multi-select
    const uniqueAuthors = _.uniq(
      processedBooks
        .map(book => book.author)
        .filter(author => author && author.trim() !== '')
    ).sort();
    setAuthors(uniqueAuthors);

    // Calculate stats and date range
    const now = new Date();
    const lastMonthDate = new Date();
    lastMonthDate.setMonth(now.getMonth() - 1);

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

  // UPDATED: Apply filters based on centralized filter state
  useEffect(() => {
    if (books.length > 0) {
      let filtered = [...books];

      // Apply genre filter (single select)
      if (filters.genre !== 'all') {
        filtered = filtered.filter(book => book.genre === filters.genre);
      }

      // Apply fiction/non-fiction filter (single select)
      if (filters.fictionType !== 'all') {
        const isFiction = filters.fictionType === 'fiction';
        filtered = filtered.filter(book => book.fiction === isFiction);
      }

      // NEW: Apply multi-select author filter
      if (filters.authors.length > 0) {
        filtered = filtered.filter(book => filters.authors.includes(book.author));
      }

      // NEW: Apply multi-select genre filter (for testing)
      if (filters.selectedGenres.length > 0) {
        filtered = filtered.filter(book => filters.selectedGenres.includes(book.genre));
      }

      // Apply timeframe filter
      if (filters.timeframe !== 'all') {
        const now = new Date();
        let cutoffDate = new Date();

        switch (filters.timeframe) {
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
      if (filters.sortOrder === 'recent') {
        filtered = _.sortBy(filtered, book => {
          return book.timestamp instanceof Date && !isNaN(book.timestamp.getTime())
            ? book.timestamp.getTime()
            : -Infinity;
        }).reverse();
      } else if (filters.sortOrder === 'rating') {
        filtered = _.sortBy(filtered, book => book.myRating).reverse();
      } else if (filters.sortOrder === 'title') {
        filtered = _.sortBy(filtered, book => book.title.toLowerCase());
      }

      setFilteredBooks(filtered);
    }
  }, [books, filters]);

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

  // NEW: Helper function to update specific filter
  const updateFilter = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

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
        icon: <Clock size={24} />
      });
    }

    return cards;
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
            {/* UPDATED: Test the new Filter components */}
            <div className="controls-container">
              <div className="filters-section">
                {/* Original dropdown filters for comparison */}
                <div className="filter-group">
                  <label htmlFor="genre-select">Genre (Old):</label>
                  <select
                    id="genre-select"
                    value={filters.genre}
                    onChange={(e) => updateFilter('genre', e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All Genres</option>
                    {genres.map(genre => (
                      <option key={genre} value={genre}>{genre}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label htmlFor="fiction-select">Type (Old):</label>
                  <select
                    id="fiction-select"
                    value={filters.fictionType}
                    onChange={(e) => updateFilter('fictionType', e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All Types</option>
                    <option value="fiction">Fiction</option>
                    <option value="non-fiction">Non-Fiction</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label htmlFor="sort-select">Sort By:</label>
                  <select
                    id="sort-select"
                    value={filters.sortOrder}
                    onChange={(e) => updateFilter('sortOrder', e.target.value)}
                    className="filter-select"
                  >
                    <option value="recent">Most Recent</option>
                    <option value="rating">Highest Rated</option>
                    <option value="title">Title (A-Z)</option>
                  </select>
                </div>
              </div>

              {/* NEW: Test Filter components */}
              <div className="new-filters-section" style={{
                marginTop: '2rem',
                padding: '1rem',
                backgroundColor: 'rgba(52, 35, 166, 0.1)',
                borderRadius: '8px'
              }}>
                <h3 style={{ color: 'var(--title-color)', marginBottom: '1rem' }}>
                  NEW Filter Components (Testing)
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                  {/* Test Single Select Genre Filter */}
                  <Filter
                    type="singleselect"
                    options={genres}
                    value={filters.genre === 'all' ? genres[0] : filters.genre}
                    onChange={(value) => updateFilter('genre', value)}
                    defaultValue={genres[0]}
                    label="Genre (Single Select)"
                    icon={<Tag size={16} />}
                    placeholder="Select a genre"
                  />

                  {/* Test Multi Select Authors Filter */}
                  <Filter
                    type="multiselect"
                    options={authors}
                    value={filters.authors}
                    onChange={(value) => updateFilter('authors', value)}
                    label="Authors (Multi Select)"
                    icon={<User size={16} />}
                    placeholder="Select authors"
                  />

                  {/* Test Multi Select Genres Filter */}
                  <Filter
                    type="multiselect"
                    options={genres}
                    value={filters.selectedGenres}
                    onChange={(value) => updateFilter('selectedGenres', value)}
                    label="Genres (Multi Select)"
                    icon={<Tag size={16} />}
                    placeholder="Select genres"
                  />

                  {/* Test Single Select Fiction Type */}
                  <Filter
                    type="singleselect"
                    options={['Fiction', 'Non-Fiction']}
                    value={filters.fictionType === 'all' ? 'Fiction' : filters.fictionType}
                    onChange={(value) => updateFilter('fictionType', value)}
                    defaultValue="Fiction"
                    label="Fiction Type (Single Select)"
                    icon={<BookIcon size={16} />}
                  />
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

            <CardsPanel
              title="Reading Statistics"
              description="Your reading progress at a glance"
              cards={prepareStatsCards()}
              loading={loading?.reading}
            />

            {/* Books Display */}
            {filteredBooks.length > 0 ? (
              <>
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

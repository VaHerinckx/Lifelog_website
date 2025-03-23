// src/pages/Reading/components/ReadingTimeline.jsx
import React, { useRef, useEffect, useState } from 'react';
import './ReadingTimeline.css';

const ReadingTimeline = ({ books }) => {
  const timelineRef = useRef(null);
  const [processedBooks, setProcessedBooks] = useState([]);

  // Process books data for timeline display
  useEffect(() => {
    if (!books || books.length === 0) return;

    // Separate books with and without timestamps
    const booksWithDate = books.filter(book => book.timestamp);
    const booksWithoutDate = books.filter(book => !book.timestamp);

    // Sort books by timestamp (newest to oldest)
    const sortedBooks = [...booksWithDate].sort((a, b) => {
      return new Date(b.timestamp) - new Date(a.timestamp);
    });

    // Process books with positions and sizing information
    const processed = [];
    let currentPosition = 50; // Start with some padding at the top
    let lastMonth = null;
    let lastYear = null;

    // First add sorted books with dates
    sortedBooks.forEach((book, index) => {
      const readDate = new Date(book.timestamp);
      const month = readDate.getMonth();
      const year = readDate.getFullYear();

      // Check if month or year has changed
      const isNewMonth = lastMonth !== month || lastYear !== year;
      const monthYearLabel = readDate.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
      });

      // Calculate height based on reading duration more proportionately
      const readingDuration = book.readingDuration || 3;
      // More proportional scaling: 10px per day with min/max constraints
      const heightPx = Math.max(100, Math.min(400, 80 + (readingDuration * 10)));

      processed.push({
        ...book,
        topPosition: currentPosition,
        height: heightPx,
        showMonthYear: isNewMonth,
        monthYearLabel: monthYearLabel
      });

      // Update tracking variables
      lastMonth = month;
      lastYear = year;

      // Update current position for next book (no spacing - cards are adjacent)
      currentPosition += heightPx;
    });

    // Then add books without dates at the end
    if (booksWithoutDate.length > 0) {
      // Add an extra spacing before the "Unknown date" section
      currentPosition += 60;

      // Add a marker for unknown dates
      processed.push({
        id: 'unknown-marker',
        topPosition: currentPosition - 30,
        showMonthYear: true,
        monthYearLabel: "Unknown Date",
        isMarkerOnly: true
      });

      booksWithoutDate.forEach((book, index) => {
        // Calculate height based on reading duration
        const readingDuration = book.readingDuration || 3;
        const heightPx = Math.max(100, Math.min(400, 80 + (readingDuration * 10)));

        processed.push({
          ...book,
          topPosition: currentPosition,
          height: heightPx,
          showMonthYear: false
        });

        // Update current position for next book
        currentPosition += heightPx;
      });
    }

    setProcessedBooks(processed);
  }, [books]);

  // Get color based on rotation pattern
  const getBookColor = (book, index) => {
    if (!book) return 'var(--chart-secondary-color)'; // Default color

    // Create an array of all available colors
    const colors = [
      'var(--chart-primary-color)',      // Yellow
      'var(--chart-secondary-color)',    // Purple
      'var(--timeline-color-1)',         // Blue
      'var(--timeline-color-2)',         // Teal
      'var(--timeline-color-3)',         // Coral
      'var(--timeline-color-4)',         // Lavender
      'var(--timeline-color-5)'          // Green
    ];

    // Assign colors in a rotating pattern based on index
    return colors[index % colors.length];
  };

  return (
    <div className="reading-timeline-container" ref={timelineRef}>
      <div className="timeline-header">
        <h2>Reading Timeline</h2>
        <p className="timeline-instructions">Scroll to explore your reading journey through time</p>
      </div>

      <div className="timeline-content" style={{
        height: `${Math.max(1000, processedBooks.length ? processedBooks[processedBooks.length - 1].topPosition + 200 : 0)}px`
      }}>
        {/* Center line */}
        <div className="timeline-line"></div>

        {/* Month/Year labels */}
        {processedBooks
          .filter(book => book.showMonthYear)
          .map((book, index) => (
            <div
              key={`month-${index}`}
              className={`timeline-month-marker ${book.isMarkerOnly ? 'marker-unknown' : ''}`}
              style={{ top: `${book.topPosition}px` }}
            >
              <div className="month-year-label">{book.monthYearLabel}</div>
            </div>
          ))
        }

        {/* Books */}
        {processedBooks
          .filter(book => !book.isMarkerOnly)
          .map((book, index) => (
            <div
              key={`book-${book.id || index}`}
              className="timeline-book-item"
              style={{
                top: `${book.topPosition}px`,
                height: `${book.height}px`,
                backgroundColor: getBookColor(book, index)
              }}
              title={`${book.title} by ${book.author} (${book.genre || (book.fiction ? 'Fiction' : 'Non-Fiction')})`}
            >
              <div className="book-timeline-info">
                <div className="book-timeline-title">{book.title}</div>
                {book.readingDuration && (
                  <div className="book-timeline-duration">
                    {book.readingDuration} days to read
                  </div>
                )}
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
};

export default ReadingTimeline;

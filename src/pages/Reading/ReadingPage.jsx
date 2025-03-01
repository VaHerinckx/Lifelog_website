// src/pages/Reading/ReadingPage.jsx
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import _ from 'lodash';
import './ReadingPage.css';
import { BookOpen } from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useData } from '../../context/DataContext';

const ReadingPage = () => {
  // Get data and functions from context
  const { data, loading, error, fetchData } = useData();

  // Local state
  const [uniqueBooks, setUniqueBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState('all');
  const [selectedBookInfo, setSelectedBookInfo] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('yearly');
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null
  });

  // Fetch reading data when component mounts
  useEffect(() => {
    fetchData('reading');
  }, [fetchData]);

  // Process dates and books when data is loaded
  useEffect(() => {
    if (data.reading) {
      // Get unique books
      const books = _.uniq(data.reading.map(item => item['title'])).filter(Boolean);
      setUniqueBooks(books);

      // Process and filter dates
      const validDates = data.reading
        .map(item => new Date(item['date_finished']))
        .filter(date => !isNaN(date.getTime()) && date.getFullYear() > 1970)
        .sort((a, b) => a - b);

      if (validDates.length > 0) {
        const startDate = validDates[0].toISOString().split('T')[0];
        const endDate = validDates[validDates.length - 1].toISOString().split('T')[0];
        setDateRange({ startDate, endDate });
      }
    }
  }, [data.reading]);

  // Function to get period key for grouping
  const getPeriodKey = (dateStr, period) => {
    const date = new Date(dateStr);
    if (!date || isNaN(date.getTime())) return 'Unknown';

    switch (period) {
      case 'yearly':
        return date.getFullYear().toString();
      case 'monthly':
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      case 'daily':
        return date.toISOString().split('T')[0];
      default:
        return date.getFullYear().toString();
    }
  };

  // Function to format period label
  const formatPeriodLabel = (key, period) => {
    if (key === 'Unknown') return key;

    switch (period) {
      case 'yearly':
        return key;
      case 'monthly': {
        const [year, month] = key.split('-');
        return `${new Date(year, parseInt(month) - 1).toLocaleString('default', { month: 'short' })} ${year}`;
      }
      case 'daily': {
        const date = new Date(key);
        return date.toLocaleDateString();
      }
      default:
        return key;
    }
  };

  const generateAllPeriods = (startDate, endDate, periodType) => {
    const periods = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    let current = new Date(start);

    while (current <= end) {
      switch (periodType) {
        case 'yearly':
          periods.push(current.getFullYear().toString());
          current.setFullYear(current.getFullYear() + 1);
          break;
        case 'monthly':
          periods.push(`${current.getFullYear()}-${(current.getMonth() + 1).toString().padStart(2, '0')}`);
          current.setMonth(current.getMonth() + 1);
          break;
        case 'daily':
          periods.push(current.toISOString().split('T')[0]);
          current.setDate(current.getDate() + 1);
          break;
      }
    }
    return periods;
  };

  if (loading.reading) {
    return <LoadingSpinner centerIcon={BookOpen} />;
  }

  if (error.reading) {
    return <div className="error">Error loading reading data: {error.reading}</div>;
  }

  return (
    <div className="page-container">
      <h1>Reading Tracker</h1>
      <p className="page-description">Monitor your reading habits and discover insights about your literary journey</p>

      <div className="filters-section">
        <div className="filters-selections">
          <div className="filter-group">
            <label htmlFor="book-select">Select Book:</label>
            <select
              id="book-select"
              value={selectedBook}
              onChange={(e) => setSelectedBook(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Books</option>
              {uniqueBooks.map(book => (
                <option key={book} value={book}>{book}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="period-select">Time Period:</label>
            <select
              id="period-select"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="filter-select"
            >
              <option value="yearly">Yearly</option>
              <option value="monthly">Monthly</option>
              <option value="daily">Daily</option>
            </select>
          </div>

          <div className="filter-group date-range">
            <label>Date Range:</label>
            <div className="date-inputs">
              <input
                type="date"
                value={dateRange.startDate || ''}
                onChange={(e) => {
                  setDateRange(prev => ({
                    ...prev,
                    startDate: e.target.value
                  }));
                }}
                className="date-input"
                min={dateRange.startDate}
                max={dateRange.endDate}
              />
              <span className="date-separator">to</span>
              <input
                type="date"
                value={dateRange.endDate || ''}
                onChange={(e) => setDateRange(prev => ({
                  ...prev,
                  endDate: e.target.value
                }))}
                className="date-input"
                min={dateRange.startDate}
                max={dateRange.endDate}
              />
            </div>
          </div>
        </div>

        {selectedBookInfo && (
          <div className="book-info">
            <div className="book-header">
              <img
                src={selectedBookInfo.cover}
                alt={`${selectedBookInfo.title} cover`}
                className="book-large-cover"
              />
              <div className="book-details">
                <h2>{selectedBookInfo.title}</h2>
                <p className="book-author">{selectedBookInfo.author}</p>
                <p className="book-genre">{selectedBookInfo.genre}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="placeholder-message">
        <p>Reading data visualization will appear here. Currently, we're just setting up the basic layout.</p>
        <p>Future visualizations will include:</p>
        <ul>
          <li>Books read over time</li>
          <li>Reading pace (pages per day)</li>
          <li>Genre distribution</li>
          <li>Author diversity</li>
        </ul>
      </div>
    </div>
  );
};

export default ReadingPage;

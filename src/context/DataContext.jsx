// src/context/DataContext.jsx
import React, { createContext, useContext, useState, useCallback, useRef, useMemo } from 'react';
import Papa from 'papaparse';
import { DRIVE_FILES, getDriveDownloadUrl } from '../config/config';

const DataContext = createContext();

// Helper function to clean UTF-8 strings
const decodeUTF8 = (str) => {
  if (!str) return str;

  // Just remove control characters and trim
  // Modern browsers handle UTF-8 correctly, no need for aggressive decoding
  return str
    .replace(/[\u0000-\u0019]/g, '') // Remove control characters
    .trim();
};

// In the clean string function in DataContext.jsx
const cleanString = (str) => {
  if (!str) return str;
  // Remove null bytes and trim
  return decodeUTF8(str.replace(/\u0000/g, '').trim());
};

// Add a new helper function for date validation and cleaning
const cleanDate = (dateStr) => {
  if (!dateStr) return null;

  try {
    // Parse the date string
    const date = new Date(dateStr);

    // Check if date is valid and within reasonable range (e.g., between 1990 and 2040)
    if (isNaN(date.getTime()) ||
        date.getFullYear() < 1990 ||
        date.getFullYear() > 2040) {
      return null;
    }

    return date.toISOString();
  } catch (e) {
    return null;
  }
};


// Helper function to clean data
const cleanData = (data) => {
  return data.map(item => {
    const cleanedItem = {};
    Object.entries(item).forEach(([key, value]) => {
      const cleanKey = cleanString(key).trim();

      // Special handling for date fields
      if (cleanKey.includes('date') ||
          cleanKey.includes('timestamp') ||
          cleanKey.includes('finish') ||
          cleanKey.includes('start')) {
        cleanedItem[cleanKey] = cleanDate(value);
      } else {
        // Normal string cleaning for non-date fields
        cleanedItem[cleanKey] = typeof value === 'string' ? cleanString(value).trim() : value;
      }
    });
    return cleanedItem;
  });
};


export const DataProvider = ({ children }) => {
  const [data, setData] = useState({
    nutrition: null,
    reading: null,
    readingBooks: null,
    readingSessions: null,
    movies: null,
    shows: null,
    podcasts: null
  });
  const [loading, setLoading] = useState({});
  const [error, setError] = useState({});

  // Track which data types have been logged to avoid duplicates
  const loggedDataTypes = useRef(new Set());

  // Use a ref to track data without causing re-renders
  const dataRef = useRef(data);
  dataRef.current = data;

  const fetchData = useCallback(async (dataType) => {
    if (dataRef.current[dataType]) {
      return dataRef.current[dataType];
    }

    setLoading(prev => ({ ...prev, [dataType]: true }));

    try {
      let fileId;
      switch (dataType) {
        case 'reading':
          fileId = DRIVE_FILES.READING.FILE_ID;
          console.log('📚 Reading fileId:', fileId);
          break;
        case 'readingBooks':
          fileId = DRIVE_FILES.READING_BOOKS.FILE_ID;
          break;
        case 'readingSessions':
          fileId = DRIVE_FILES.READING_SESSIONS.FILE_ID;
          break;
        case 'movies':
          fileId = DRIVE_FILES.MOVIES.FILE_ID;
          break;
        case 'shows':
          fileId = DRIVE_FILES.TRAKT.FILE_ID;
          console.log('📺 Shows fileId:', fileId);
          console.log('📺 DRIVE_FILES.TRAKT:', DRIVE_FILES.TRAKT);
          break;
        case 'nutrition':
          fileId = DRIVE_FILES.NUTRITION.FILE_ID;
          console.log('🥗 Nutrition fileId:', fileId);
          break;
        case 'podcasts':
          fileId = DRIVE_FILES.PODCASTS.FILE_ID;
          console.log('🎙️ Podcasts fileId:', fileId);
          break;
        default:
          throw new Error(`Unknown data type: ${dataType}`);
      }


      // Check if fileId is configured (not undefined or placeholder)
      if (!fileId || fileId === 'undefined') {
        const errorMsg = `File ID not configured for ${dataType}`;
        console.warn(errorMsg);
        setError(prev => ({ ...prev, [dataType]: errorMsg }));
        setLoading(prev => ({ ...prev, [dataType]: false }));
        throw new Error(errorMsg);
      }

      const response = await fetch(getDriveDownloadUrl(fileId));
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const csvText = await response.text();

      return new Promise((resolve, reject) => {
        Papa.parse(csvText, {
          delimiter: "|",
          header: true,
          skipEmptyLines: true,
          encoding: '', // Auto-detect encoding (handles both UTF-8 and UTF-16)
          transform: (value) => cleanString(value), // Clean each value as it's parsed
          complete: (results) => {
            // Simplified logging for reading data types (only log once per data type)
            if ((dataType === 'readingBooks' || dataType === 'readingSessions') && !loggedDataTypes.current.has(dataType)) {
              loggedDataTypes.current.add(dataType);

              console.log(`📚 ${dataType} columns:`, results.meta.fields);

              // Find latest date - look for date-related columns
              const dateColumns = results.meta.fields.filter(f =>
                f && (f.toLowerCase().includes('date') ||
                      f.toLowerCase().includes('finish') ||
                      f.toLowerCase().includes('timestamp'))
              );

              if (dateColumns.length > 0 && results.data.length > 0) {
                // Try each date column and find the latest date across all of them
                let allDates = [];

                dateColumns.forEach(dateColumn => {
                  const dates = results.data
                    .map(row => row[dateColumn])
                    .filter(d => d && d.toString().trim())
                    .map(d => new Date(d))
                    .filter(d => !isNaN(d.getTime()));

                  allDates = allDates.concat(dates);
                });

                if (allDates.length > 0) {
                  allDates.sort((a, b) => b - a);
                  console.log(`📚 ${dataType} latest date:`, allDates[0].toISOString().split('T')[0]);
                }
              }
            }

            let cleanedData = cleanData(results.data);

            // Type conversion for reading books
            if (dataType === 'readingBooks') {
              cleanedData = cleanedData.map(book => ({
                ...book,
                my_rating: book.my_rating ? parseFloat(book.my_rating) : 0,
                average_rating: book.average_rating ? parseFloat(book.average_rating) : 0,
                number_of_pages: book.number_of_pages ? parseInt(book.number_of_pages) : 0,
                original_publication_year: book.original_publication_year ? parseInt(book.original_publication_year) : null,
                reading_duration_final: book.reading_duration_final ? parseInt(book.reading_duration_final) : null
              }));
            }

            // Type conversion for reading sessions
            if (dataType === 'readingSessions') {
              cleanedData = cleanedData.map(session => ({
                ...session,
                page_split: session.page_split ? parseInt(session.page_split) : 0,
                my_rating: session.my_rating ? parseFloat(session.my_rating) : 0
              }));
            }

            // Type conversion for podcasts
            if (dataType === 'podcasts') {
              cleanedData = cleanedData.map(episode => ({
                ...episode,
                duration_seconds: episode.duration_seconds ? parseInt(episode.duration_seconds) : 0,
                listened_seconds: episode.listened_seconds ? parseInt(episode.listened_seconds) : 0,
                completion_percent: episode.completion_percent ? parseFloat(episode.completion_percent) : 0,
                is_new_podcast: episode.is_new_podcast ? parseInt(episode.is_new_podcast) : 0,
                is_recurring_podcast: episode.is_recurring_podcast ? parseInt(episode.is_recurring_podcast) : 0
              }));
            }

            setData(prev => ({ ...prev, [dataType]: cleanedData }));
            setLoading(prev => ({ ...prev, [dataType]: false }));
            resolve(cleanedData);
          },
          error: (error) => {
            console.error(`${dataType} Papa parse error:`, error);
            setError(prev => ({ ...prev, [dataType]: error.message }));
            setLoading(prev => ({ ...prev, [dataType]: false }));
            reject(error);
          }
        });
      });
    } catch (err) {
      setError(prev => ({ ...prev, [dataType]: err.message }));
      setLoading(prev => ({ ...prev, [dataType]: false }));
      throw err;
    }
  }, []); // Remove data dependency to prevent infinite loops


  const value = useMemo(() => ({
    data,
    loading,
    error,
    fetchData
  }), [data, loading, error, fetchData]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

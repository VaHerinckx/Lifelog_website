// src/context/DataContext.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import Papa from 'papaparse';
import { DRIVE_FILES, getDriveDownloadUrl } from '../config/config';

const DataContext = createContext();

// Helper function to decode UTF-8 strings properly
const decodeUTF8 = (str) => {
  try {
    // First try to decode as UTF-8
    return decodeURIComponent(escape(str));
  } catch (e) {
    // If that fails, try to fix common encoding issues
    return str
      .replace(/[\u0000-\u0019]/g, '') // Remove control characters
      .replace(/�/g, 'è') // Fix common special characters
      .replace(/[\u0080-\u00ff]/g, (char) => { // Fix Latin-1 characters
        const specialChars = {
          'Ã¨': 'è',
          'Ã©': 'é',
          'Ã«': 'ë',
          'Ã¯': 'ï',
          'Ã´': 'ô',
          'Ã¶': 'ö',
          'Ã¹': 'ù',
          'Ã»': 'û',
          'Ã¼': 'ü',
          'Ã ': 'à',
          'Ã¢': 'â',
          // Add more special characters as needed
        };
        return specialChars[char] || char;
      })
      .trim();
  }
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

    // Check if date is valid and within reasonable range (e.g., between 2000 and 2030)
    if (isNaN(date.getTime()) ||
        date.getFullYear() < 2019 ||
        date.getFullYear() > 2030) {
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
      if (cleanKey.includes('modified at') ||
          cleanKey.includes('date') ||
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
    podcast: null,
    music: null,
    nutrition: null,
    sport: null,
    health: null,
    reading: null,
    movies: null,
    finances: null,
    work: null
  });
  const [loading, setLoading] = useState({});
  const [error, setError] = useState({});

  const fetchData = useCallback(async (dataType) => {
    if (data[dataType]) {
      return data[dataType];
    }

    setLoading(prev => ({ ...prev, [dataType]: true }));

    try {
      let fileId;
      switch (dataType) {
        case 'podcast':
          fileId = DRIVE_FILES.PODCAST.FILE_ID;
          break;
        case 'reading':
          fileId = DRIVE_FILES.READING.FILE_ID;
          break;
        case 'music':
          fileId = DRIVE_FILES.MUSIC.FILE_ID;
          break;
        case 'movies':
          fileId = DRIVE_FILES.MOVIES.FILE_ID;
          break;
        default:
          throw new Error(`Unknown data type: ${dataType}`);
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
          encoding: 'UTF-8', // Explicitly set UTF-8 encoding
          transform: (value) => cleanString(value), // Clean each value as it's parsed
          complete: (results) => {
            const cleanedData = cleanData(results.data);
            setData(prev => ({ ...prev, [dataType]: cleanedData }));
            setLoading(prev => ({ ...prev, [dataType]: false }));
            resolve(cleanedData);
          },
          error: (error) => {
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
  }, [data]);

  const value = {
    data,
    loading,
    error,
    fetchData
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

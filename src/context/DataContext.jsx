// src/context/DataContext.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import Papa from 'papaparse';
import { DRIVE_FILES, getDriveDownloadUrl } from '../config/config';

const DataContext = createContext();

// Helper function to clean strings
const cleanString = (str) => {
  return str ? str.replace(/\u0000/g, '').trim() : str;
};

// Helper function to clean data
const cleanData = (data) => {
  return data.map(item => {
    const cleanedItem = {};
    Object.entries(item).forEach(([key, value]) => {
      const cleanKey = cleanString(key).trim();
      const cleanValue = typeof value === 'string' ? cleanString(value).trim() : value;
      cleanedItem[cleanKey] = cleanValue;
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
    // If data already exists, don't fetch again
    if (data[dataType]) {
      return data[dataType];
    }

    // Set loading state for this specific data type
    setLoading(prev => ({ ...prev, [dataType]: true }));

    try {
      let fileId;
      switch (dataType) {
        case 'podcast':
          fileId = DRIVE_FILES.PODCAST.FILE_ID;
          break;
        case 'music':
          fileId = DRIVE_FILES.MUSIC.FILE_ID;
          break;
        // Add cases for other data types
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

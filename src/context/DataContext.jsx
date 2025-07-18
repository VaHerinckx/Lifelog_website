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
      if (cleanKey.includes('modified at') ||
          cleanKey.includes('date') ||
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

// Generate sample data for testing when file IDs are not configured
const generateSampleData = (dataType) => {
  const now = new Date();
  const getRandomDate = (daysBack) => {
    const date = new Date(now);
    date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
    return date.toISOString();
  };

  switch (dataType) {
    case 'music':
      return [
        {
          artist_name: 'The Beatles',
          album_name: 'Abbey Road',
          track_name: 'Come Together',
          timestamp: getRandomDate(30),
          song_key: 'Come Together /: The Beatles',
          followers: 50000000,
          artist_popularity: 95,
          genre_1: 'rock',
          genre_2: 'classic rock',
          genre_3: 'british invasion',
          genre_4: '',
          genre_5: '',
          acousticness: 0.15,
          album_release_date: '1969-09-26',
          danceability: 0.6,
          energy: 0.8,
          instrumentalness: 0.1,
          key: 'D',
          liveness: 0.1,
          loudness: -8.5,
          mode: 1,
          speechiness: 0.05,
          tempo: 85,
          track_duration: 259000,
          track_popularity: 88,
          valence: 0.7,
          completion: 1.0
        },
        {
          artist_name: 'Radiohead',
          album_name: 'OK Computer',
          track_name: 'Paranoid Android',
          timestamp: getRandomDate(15),
          song_key: 'Paranoid Android /: Radiohead',
          followers: 8500000,
          artist_popularity: 85,
          genre_1: 'alternative rock',
          genre_2: 'art rock',
          genre_3: 'electronic',
          genre_4: '',
          genre_5: '',
          acousticness: 0.05,
          album_release_date: '1997-06-16',
          danceability: 0.3,
          energy: 0.9,
          instrumentalness: 0.0,
          key: 'C',
          liveness: 0.08,
          loudness: -6.2,
          mode: 0,
          speechiness: 0.08,
          tempo: 140,
          track_duration: 383000,
          track_popularity: 78,
          valence: 0.2,
          completion: 0.85
        },
        {
          artist_name: 'Daft Punk',
          album_name: 'Random Access Memories',
          track_name: 'Get Lucky',
          timestamp: getRandomDate(7),
          song_key: 'Get Lucky /: Daft Punk',
          followers: 12000000,
          artist_popularity: 82,
          genre_1: 'electronic',
          genre_2: 'french electronic',
          genre_3: 'house',
          genre_4: '',
          genre_5: '',
          acousticness: 0.1,
          album_release_date: '2013-05-17',
          danceability: 0.9,
          energy: 0.7,
          instrumentalness: 0.0,
          key: 'F#',
          liveness: 0.12,
          loudness: -5.8,
          mode: 1,
          speechiness: 0.15,
          tempo: 116,
          track_duration: 368000,
          track_popularity: 85,
          valence: 0.9,
          completion: 1.0
        },
        {
          artist_name: 'Kendrick Lamar',
          album_name: 'good kid, m.A.A.d city',
          track_name: 'Swimming Pools (Drank)',
          timestamp: getRandomDate(3),
          song_key: 'Swimming Pools (Drank) /: Kendrick Lamar',
          followers: 25000000,
          artist_popularity: 95,
          genre_1: 'hip hop',
          genre_2: 'west coast rap',
          genre_3: 'conscious hip hop',
          genre_4: '',
          genre_5: '',
          acousticness: 0.02,
          album_release_date: '2012-10-22',
          danceability: 0.7,
          energy: 0.6,
          instrumentalness: 0.0,
          key: 'A',
          liveness: 0.1,
          loudness: -4.5,
          mode: 1,
          speechiness: 0.25,
          tempo: 95,
          track_duration: 317000,
          track_popularity: 80,
          valence: 0.4,
          completion: 0.95
        },
        {
          artist_name: 'Billie Eilish',
          album_name: 'When We All Fall Asleep, Where Do We Go?',
          track_name: 'bad guy',
          timestamp: getRandomDate(1),
          song_key: 'bad guy /: Billie Eilish',
          followers: 45000000,
          artist_popularity: 98,
          genre_1: 'pop',
          genre_2: 'alternative pop',
          genre_3: 'electropop',
          genre_4: '',
          genre_5: '',
          acousticness: 0.35,
          album_release_date: '2019-03-29',
          danceability: 0.7,
          energy: 0.4,
          instrumentalness: 0.0,
          key: 'G',
          liveness: 0.1,
          loudness: -11.3,
          mode: 0,
          speechiness: 0.35,
          tempo: 135,
          track_duration: 194000,
          track_popularity: 92,
          valence: 0.6,
          completion: 1.0
        }
      ];

    default:
      return [];
  }
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
    shows: null,
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
          console.log('🎧 Podcast fileId:', fileId);
          break;
        case 'reading':
          fileId = DRIVE_FILES.READING.FILE_ID;
          console.log('📚 Reading fileId:', fileId);
          break;
        case 'music':
          fileId = DRIVE_FILES.MUSIC.FILE_ID;
          console.log('🎵 Music fileId:', fileId);
          break;
        case 'movies':
          console.log('🎬 DRIVE_FILES.MOVIES:', DRIVE_FILES.MOVIES);
          console.log('🎬 DRIVE_FILES.MOVIES.FILE_ID:', DRIVE_FILES.MOVIES.FILE_ID);
          console.log('🎬 import.meta.env.VITE_MOVIES_FILE_ID:', import.meta.env.VITE_MOVIES_FILE_ID);
          fileId = DRIVE_FILES.MOVIES.FILE_ID;
          console.log('🎬 Movies fileId after assignment:', fileId);
          break;
        case 'shows':
          fileId = DRIVE_FILES.TRAKT.FILE_ID;
          console.log('📺 Shows fileId:', fileId);
          console.log('📺 DRIVE_FILES.TRAKT:', DRIVE_FILES.TRAKT);
          break;
        default:
          throw new Error(`Unknown data type: ${dataType}`);
      }
      
      console.log(`📁 DRIVE_FILES object:`, DRIVE_FILES);

      console.log(`Fetching ${dataType} data with fileId:`, fileId);


      // Special handling for music data due to large file size
      if (dataType === 'music') {
        console.log(`Loading music data with special handling for large file`);
        
        try {
          const response = await fetch(getDriveDownloadUrl(fileId));
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const csvText = await response.text();
          console.log(`Music CSV text length: ${csvText.length} characters`);
          
          // Parse with Papa Parse but limit chunk size
          return new Promise((resolve, reject) => {
            let processedRows = 0;
            const maxRows = 2000; // Limit to 2000 rows to prevent browser freeze
            const musicData = [];
            
            Papa.parse(csvText, {
              delimiter: "|",
              header: true,
              skipEmptyLines: true,
              step: (row) => {
                if (processedRows < maxRows) {
                  musicData.push(row.data);
                  processedRows++;
                } else {
                  // Stop parsing after maxRows
                  return false;
                }
              },
              complete: () => {
                console.log(`Music data processed: ${musicData.length} rows`);
                const cleanedData = cleanData(musicData);
                setData(prev => ({ ...prev, [dataType]: cleanedData }));
                setLoading(prev => ({ ...prev, [dataType]: false }));
                resolve(cleanedData);
              },
              error: (error) => {
                console.error(`Music data parsing error:`, error);
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
      }

      // Check if fileId is configured (not undefined or placeholder)
      if (!fileId || fileId === 'undefined' || fileId === 'your_music_file_id_here') {
        console.warn(`File ID not configured for ${dataType}, returning sample data`);
        // Return sample data for testing (for other data types)
        const sampleData = generateSampleData(dataType);
        setData(prev => ({ ...prev, [dataType]: sampleData }));
        setLoading(prev => ({ ...prev, [dataType]: false }));
        return sampleData;
      }

      const response = await fetch(getDriveDownloadUrl(fileId));
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const csvText = await response.text();
      console.log(`${dataType} CSV text length:`, csvText.length);
      console.log(`${dataType} CSV first 500 chars:`, csvText.substring(0, 500));

      return new Promise((resolve, reject) => {
        Papa.parse(csvText, {
          delimiter: "|",
          header: true,
          skipEmptyLines: true,
          encoding: 'UTF-8', // Explicitly set UTF-8 encoding
          transform: (value) => cleanString(value), // Clean each value as it's parsed
          complete: (results) => {
            console.log(`${dataType} Papa parse results:`, {
              dataLength: results.data.length,
              fields: results.meta.fields,
              errors: results.errors,
              firstRow: results.data[0]
            });

            // Extra logging for shows data
            if (dataType === 'shows') {
              console.log('📺 TRAKT RAW DATA - First 3 rows:');
              results.data.slice(0, 3).forEach((row, index) => {
                console.log(`📺 Row ${index + 1}:`, row);
              });
              console.log('📺 TRAKT RAW DATA - Fields:', results.meta.fields);
            }

            const cleanedData = cleanData(results.data);
            console.log(`${dataType} cleaned data:`, {
              length: cleanedData.length,
              firstItem: cleanedData[0]
            });

            // Extra logging for shows cleaned data
            if (dataType === 'shows') {
              console.log('📺 TRAKT CLEANED DATA - First 3 rows:');
              cleanedData.slice(0, 3).forEach((row, index) => {
                console.log(`📺 Cleaned Row ${index + 1}:`, row);
              });
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

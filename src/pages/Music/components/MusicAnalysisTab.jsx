// src/pages/Music/components/MusicAnalysisTab.jsx
import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import TimeSeriesBarChart from '../../../components/charts/TimeSeriesBarChart';
import IntensityHeatmap from '../../../components/charts/IntensityHeatmap';
import TopArtistsChart from '../../../components/charts/TopArtistsChart';
import TreemapGenre from '../../../components/charts/TreemapGenre';
import './MusicAnalysisTab.css';

const MusicAnalysisTab = ({ 
  musicData = '', 
  allData = '', 
  displaySample = [], 
  selectedArtistInfo = null, 
  currentFilters = {},
  isFullDataset = false 
}) => {
  const [processedData, setProcessedData] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Process full dataset with filters for chart analysis
  useEffect(() => {
    if (!isFullDataset || !allData || typeof allData !== 'string') {
      // Fallback to display sample if full dataset not available
      console.log('🎵 MusicAnalysisTab using display sample data:', displaySample.length);
      setProcessedData(displaySample);
      return;
    }

    setIsProcessing(true);

    const processFullData = () => {
      return new Promise((resolve) => {
        const filteredResults = [];
        let processedRows = 0;

        Papa.parse(allData, {
          delimiter: "|",
          header: true,
          skipEmptyLines: true,
          step: (row) => {
            processedRows++;
            const track = row.data;
            
            // Apply filters to determine if track should be included
            let includeTrack = true;

            // Apply date range filter
            if (currentFilters.dateRange && (currentFilters.dateRange.startDate || currentFilters.dateRange.endDate)) {
              const itemDate = new Date(track.timestamp);
              if (isNaN(itemDate.getTime()) || itemDate.getFullYear() <= 1970) {
                includeTrack = false;
              } else {
                const startDate = currentFilters.dateRange.startDate ? new Date(currentFilters.dateRange.startDate) : null;
                const endDate = currentFilters.dateRange.endDate ? new Date(currentFilters.dateRange.endDate) : null;

                if (startDate) {
                  startDate.setHours(0, 0, 0, 0);
                  if (itemDate < startDate) includeTrack = false;
                }

                if (endDate) {
                  endDate.setHours(23, 59, 59, 999);
                  if (itemDate > endDate) includeTrack = false;
                }
              }
            }

            // Apply artist filter
            if (includeTrack && currentFilters.artists && Array.isArray(currentFilters.artists) && currentFilters.artists.length > 0) {
              if (!currentFilters.artists.includes(track.artist_name)) {
                includeTrack = false;
              }
            }

            // Apply album filter
            if (includeTrack && currentFilters.albums && Array.isArray(currentFilters.albums) && currentFilters.albums.length > 0) {
              if (!currentFilters.albums.includes(track.album_name)) {
                includeTrack = false;
              }
            }

            // Apply genre filter
            if (includeTrack && currentFilters.genres && Array.isArray(currentFilters.genres) && currentFilters.genres.length > 0) {
              const genres = [track.genre_1, track.genre_2, track.genre_3, track.genre_4, track.genre_5]
                .filter(Boolean)
                .filter(genre => genre !== 'Unknown' && genre.trim() !== '');
              
              if (!genres.some(genre => currentFilters.genres.includes(genre))) {
                includeTrack = false;
              }
            }

            // Include ALL tracks that pass filters - no limit!
            if (includeTrack) {
              filteredResults.push(track);
            }

          },
          complete: () => {
            resolve(filteredResults);
          },
          error: (error) => {
            resolve([]);
          }
        });
      });
    };

    processFullData().then(results => {
      setProcessedData(results);
      setIsProcessing(false);
    });
  }, [allData, currentFilters, isFullDataset, displaySample]);

  // Get data count for display
  const dataCount = useMemo(() => {
    if (isFullDataset && processedData.length > 0) {
      return processedData.length;
    }
    return displaySample.length;
  }, [isFullDataset, processedData.length, displaySample.length]);


  return (
    <div className="music-analysis-container">
      <h2 className="music-analysis-title">Music Analytics</h2>
      <p className="music-analysis-description">
        Discover patterns and insights in your music listening habits
        {dataCount > 0 && (
          <span style={{ display: 'block', marginTop: '5px', fontSize: '0.9rem', opacity: 0.8 }}>
            {isProcessing ? 'Processing full dataset...' : 
             isFullDataset ? `Analyzing ${dataCount.toLocaleString()} tracks from full dataset` :
             `Analyzing ${dataCount.toLocaleString()} tracks from sample`}
          </span>
        )}
      </p>

      {isProcessing ? (
        <div className="empty-state">
          <p>Processing music data for comprehensive analysis...</p>
        </div>
      ) : processedData.length === 0 ? (
        <div className="empty-state">
          <p>No music data available for analysis.</p>
        </div>
      ) : (
        <div className="charts-grid">
          <div className="chart-container">
            <TimeSeriesBarChart
              data={processedData}
              dateColumnName="timestamp"
              metricColumnName="track_duration"
              title="Listening Time by Period"
              yAxisLabel="Minutes"
            />
          </div>

          <div className="chart-container">
            <IntensityHeatmap
              data={processedData}
              dateColumnName="timestamp"
              valueColumnName="track_duration"
              title="Listening Activity by Day and Time"
              treatMidnightAsUnknown={false}
            />
          </div>

          <div className="chart-container">
            <TopArtistsChart 
              data={processedData}
              dateRange={currentFilters.dateRange || { startDate: null, endDate: null }}
            />
          </div>

          <div className="chart-container">
            <TreemapGenre
              data={processedData}
              selectedArtist={currentFilters.artists?.length === 1 ? currentFilters.artists[0] : 'all'}
              dateRange={currentFilters.dateRange || { startDate: null, endDate: null }}
              title="Top Genres by Listening Time"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MusicAnalysisTab;
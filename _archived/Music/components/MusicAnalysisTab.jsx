// src/pages/Music/components/MusicAnalysisTab.jsx
import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import TimeSeriesBarChart from '../../../components/charts/TimeSeriesBarChart';
import IntensityHeatmap from '../../../components/charts/IntensityHeatmap';
import TopChart from '../../../components/charts/TopChart';
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

  // Use the already processed data directly and apply filters
  useEffect(() => {
    if (!displaySample || displaySample.length === 0) {
      setProcessedData([]);
      return;
    }

    setIsProcessing(true);

    // Apply filters to the full dataset
    let filteredResults = [...displaySample];

    // Apply listening year filter
    if (currentFilters.listeningYear && Array.isArray(currentFilters.listeningYear) && currentFilters.listeningYear.length > 0) {
      filteredResults = filteredResults.filter(track => {
        return currentFilters.listeningYear.includes(track.listening_year);
      });
    }

    // Apply date range filter
    if (currentFilters.dateRange && (currentFilters.dateRange.startDate || currentFilters.dateRange.endDate)) {
      filteredResults = filteredResults.filter(track => {
        const itemDate = new Date(track.timestamp);
        if (isNaN(itemDate.getTime()) || itemDate.getFullYear() <= 1970) {
          return false;
        }

        const startDate = currentFilters.dateRange.startDate ? new Date(currentFilters.dateRange.startDate) : null;
        const endDate = currentFilters.dateRange.endDate ? new Date(currentFilters.dateRange.endDate) : null;

        if (startDate) {
          startDate.setHours(0, 0, 0, 0);
          if (itemDate < startDate) return false;
        }

        if (endDate) {
          endDate.setHours(23, 59, 59, 999);
          if (itemDate > endDate) return false;
        }

        return true;
      });
    }

    // Apply artist filter
    if (currentFilters.artists && Array.isArray(currentFilters.artists) && currentFilters.artists.length > 0) {
      filteredResults = filteredResults.filter(track => {
        return currentFilters.artists.includes(track.artist_name);
      });
    }

    // Apply album filter
    if (currentFilters.albums && Array.isArray(currentFilters.albums) && currentFilters.albums.length > 0) {
      filteredResults = filteredResults.filter(track => {
        return currentFilters.albums.includes(track.album_name);
      });
    }

    // Apply genre filter
    if (currentFilters.genres && Array.isArray(currentFilters.genres) && currentFilters.genres.length > 0) {
      filteredResults = filteredResults.filter(track => {
        const genres = [track.genre_1, track.genre_2, track.genre_3, track.genre_4, track.genre_5]
          .filter(Boolean)
          .filter(genre => genre !== 'Unknown' && genre.trim() !== '');

        return genres.some(genre => currentFilters.genres.includes(genre));
      });
    }

    setProcessedData(filteredResults);
    setIsProcessing(false);
  }, [displaySample, currentFilters]);

  // Get data count for display
  const dataCount = useMemo(() => {
    if (isFullDataset && processedData.length > 0) {
      return processedData.length;
    }
    return displaySample.length;
  }, [isFullDataset, processedData.length, displaySample.length]);


  return (
    <div className="analysis-tab-container">
      {isProcessing ? (
        <div className="empty-state">
          <p>Processing music data for comprehensive analysis...</p>
        </div>
      ) : processedData.length === 0 ? (
        <div className="empty-state">
          <p>No music data available for analysis.</p>
        </div>
      ) : (
        <div className="analysis-charts-grid">
          {/* Time Series Chart First */}
          <div className="analysis-chart-section">
            <TimeSeriesBarChart
              data={processedData}
              dateColumnName="timestamp"
              metricColumnName="track_duration"
              title="Listening Time by Period"
              yAxisLabel="Minutes"
            />
          </div>

          {/* Top 10 Charts - Individual containers */}
          <div className="analysis-chart-section">
            <TopChart
              data={processedData}
              dimension="artist"
              metric="listeningTime"
            />
          </div>
          <div className="analysis-chart-section">
            <TopChart
              data={processedData}
              dimension="track"
              metric="listeningTime"
            />
          </div>
          <div className="analysis-chart-section">
            <TopChart
              data={processedData}
              dimension="album"
              metric="listeningTime"
            />
          </div>

          {/* Other Charts */}
          <div className="analysis-chart-section">
            <IntensityHeatmap
              data={processedData}
              dateColumnName="timestamp"
              valueColumnName="track_duration"
              title="Listening Activity by Day and Time"
              treatMidnightAsUnknown={false}
            />
          </div>

          <div className="analysis-chart-section">
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

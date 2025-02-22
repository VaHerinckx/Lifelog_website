import React, { useMemo } from 'react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import _ from 'lodash';
import './TreemapGenre.css';

const TreemapGenre = ({ data, selectedPodcast, dateRange }) => {
  const treeMapData = useMemo(() => {
    if (!data || !dateRange.startDate || !dateRange.endDate) {
      return [];
    }

    // Filter data based on selection and date range
    const filteredData = data.filter(item => {
      const itemDate = new Date(item['modified at']);
      const start = new Date(dateRange.startDate);
      const end = new Date(dateRange.endDate);

      return (
        (selectedPodcast === 'all' || item.podcast_name === selectedPodcast) &&
        itemDate >= start &&
        itemDate <= end &&
        item.genre // Only include items with a genre
      );
    });

    // Group episodes by genre and calculate total listening time
    const genreGroups = _.groupBy(filteredData, 'genre');

    // Convert to treemap format and calculate metrics
    const genreData = Object.entries(genreGroups).map(([genre, episodes]) => {
      const totalMinutes = Math.round(
        episodes.reduce((sum, episode) => {
          const duration = parseFloat(episode.duration) || 0;
          return sum + (duration / 60);
        }, 0)
      );
      const episodeCount = episodes.length;

      return {
        name: genre || 'Unknown',
        size: totalMinutes || 0,
        episodeCount,
        averageLength: episodeCount > 0 ? Math.round(totalMinutes / episodeCount) : 0
      };
    }).filter(item => item.size > 0); // Remove genres with no listening time

    return genreData.length > 0 ? genreData : [];
  }, [data, selectedPodcast, dateRange]);

  // Custom color scale based on your theme
  const getColor = (index) => {
    const colors = ['#3423A6', '#4433B6', '#5443C6', '#6453D6', '#7463E6'];
    return colors[index % colors.length];
  };

  // Custom tooltip content
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length || !payload[0].payload) {
      return null;
    }

    const data = payload[0].payload;
    return (
      <div className="treemap-tooltip">
        <p className="tooltip-title">{data.name}</p>
        <p className="tooltip-content">Total Time: {data.size.toLocaleString()} minutes</p>
        <p className="tooltip-content">Episodes: {data.episodeCount.toLocaleString()}</p>
        <p className="tooltip-content">Avg Length: {data.averageLength.toLocaleString()} minutes</p>
      </div>
    );
  };

  if (!treeMapData.length) {
    return (
      <div className="treemap-container">
        <h2 className="treemap-title">Genre Distribution</h2>
        <div className="treemap-chart-container">
          <p className="no-data-message">No genre data available for the selected filters.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="treemap-container">
      <h2 className="treemap-title">Genre Distribution</h2>
      <div className="treemap-chart-container">
        <ResponsiveContainer width="100%" height={400}>
          <Treemap
            data={treeMapData}
            dataKey="size"
            nameKey="name"
            stroke="#171738"
            fill="#3423A6"
            aspectRatio={4 / 3}
          >
            <Tooltip content={<CustomTooltip />} />
          </Treemap>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TreemapGenre;

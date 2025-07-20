// src/components/charts/TopArtistsChart/index.jsx
import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import _ from 'lodash';
import './TopArtistsChart.css';

const formatNumber = (num) => {
  return new Intl.NumberFormat().format(Math.round(num));
};

const TopArtistsChart = ({ data }) => {
  const [topArtists, setTopArtists] = useState([]);

  useEffect(() => {
    if (!Array.isArray(data)) return;

    const artistStats = _(data)
      .groupBy('artist_name')
      .map((tracks, name) => ({
        name,
        popularity: tracks[0]?.artist_popularity || 0,
        followers: tracks[0]?.followers || 0,
        totalMinutes: _.sumBy(tracks, track => {
          const duration = parseFloat(track.track_duration);
          return isNaN(duration) ? 0 : duration / 1000 / 60; // Convert milliseconds to minutes
        })
      }))
      .orderBy(['totalMinutes'], ['desc'])
      .take(5)
      .value();

    setTopArtists(artistStats);
  }, [data]);

  const CustomBar = (props) => {
    const { x, y, width, height, name, popularity } = props;
    return (
      <g>
        {/* Text label first (artist name) */}
        <text
          x={0}
          y={y + height/2}
          dy=".35em"
          textAnchor="start"
          className="artist-name"
        >
          {name}
        </text>
        {/* Popularity indicator between text and bar */}
        <circle
          cx={x - 15} // Position circle just before the bar
          cy={y + height / 2}
          r={8}
          fill="#3423A6"
          opacity={popularity / 100} // Opacity based on popularity (0-100 scale)
          className="popularity-indicator"
        />
        <text
          x={x - 15}
          y={y + height/2}
          dy=".35em"
          textAnchor="middle"
          className="popularity-text"
          fill="white"
          fontSize="10"
        >
          {Math.round(popularity)}
        </text>
        {/* The bar itself */}
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill="#3423A6"
          opacity={0.8}
          rx={4}
        />
        {/* Value label at the end of the bar */}
        <text
          x={x + width + 5}
          y={y + height/2}
          dy=".35em"
          textAnchor="start"
          className="value-label"
        >
          {formatNumber(props.value)}m
        </text>
      </g>
    );
  };

  return (
    <div className="top-artists-container">
      <h3 className="top-artists-title">Top 5 Most Listened Artists</h3>
      <div className="top-artists-chart">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={topArtists}
            layout="vertical"
            margin={{ top: 20, right: 60, bottom: 20, left: 200 }} // Increased left margin for names
          >
            <XAxis
              type="number"
              tickFormatter={formatNumber}
              domain={[0, 'dataMax']}
            />
            <YAxis
              type="category"
              dataKey="name"
              hide // Hide default axis as we're rendering custom labels
            />
            <Bar
              dataKey="totalMinutes"
              shape={<CustomBar />}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TopArtistsChart;
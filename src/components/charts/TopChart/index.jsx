// src/components/charts/TopChart/index.jsx
import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import _ from 'lodash';
import './TopChart.css';

const formatNumber = (num) => {
  return new Intl.NumberFormat().format(Math.round(num));
};

const TopChart = ({ data, dimension, metric = 'listeningTime' }) => {
  const [topItems, setTopItems] = useState([]);

  useEffect(() => {
    if (!Array.isArray(data)) return;

    let processedData;

    switch (dimension) {
      case 'artist':
        processedData = _(data)
          .filter(track => {
            const artistName = track.artist_name || '';
            return !(artistName === 'Unknown Artist' || artistName.trim() === '');
          })
          .groupBy('artist_name')
          .map((tracks, name) => ({
            name,
            displayName: name,
            popularity: tracks[0]?.artist_popularity || 0,
            playCount: tracks.length,
            totalMinutes: _.sumBy(tracks, track => {
              const duration = parseFloat(track.track_duration);
              return isNaN(duration) ? 0 : duration / 1000 / 60;
            }),
            indicatorValue: tracks[0]?.artist_popularity || 0,
            indicatorType: 'popularity'
          }))
          .orderBy(['playCount'], ['desc'])
          .take(10)
          .value();
        break;

      case 'track':
        processedData = _(data)
          .filter(track => {
            const trackName = track.track_name || '';
            const artistName = track.artist_name || '';
            return !(
              (trackName === 'Unknown Track' || trackName.trim() === '') &&
              (artistName === 'Unknown Artist' || artistName.trim() === '')
            );
          })
          .groupBy(track => track.song_key || `${track.track_name} by ${track.artist_name}`)
          .map((plays, trackKey) => ({
            name: trackKey,
            displayName: `${plays[0]?.track_name || 'Unknown Track'} - ${plays[0]?.artist_name || 'Unknown Artist'}`,
            playCount: plays.length,
            totalMinutes: _.sumBy(plays, track => {
              const duration = parseFloat(track.track_duration);
              return isNaN(duration) ? 0 : duration / 1000 / 60;
            }),
            indicatorValue: plays[0]?.track_popularity || 0,
            indicatorType: 'popularity'
          }))
          .orderBy(['playCount'], ['desc'])
          .take(10)
          .value();
        break;

      case 'album':
        processedData = _(data)
          .filter(track => {
            const albumName = track.album_name || '';
            const artistName = track.artist_name || '';
            return !(
              (albumName === 'Unknown Album' || albumName === 'Unknown' || albumName.trim() === '') ||
              (artistName === 'Unknown Artist' || artistName.trim() === '')
            );
          })
          .groupBy(track => `${track.album_name} by ${track.artist_name}`)
          .map((tracks, albumKey) => ({
            name: albumKey,
            displayName: `${tracks[0]?.album_name || 'Unknown Album'} - ${tracks[0]?.artist_name || 'Unknown Artist'}`,
            playCount: tracks.length,
            totalMinutes: _.sumBy(tracks, track => {
              const duration = parseFloat(track.track_duration);
              return isNaN(duration) ? 0 : duration / 1000 / 60;
            }),
            indicatorValue: tracks[0]?.album_release_date ? new Date(tracks[0].album_release_date).getFullYear() : null,
            indicatorType: 'year'
          }))
          .orderBy(['playCount'], ['desc'])
          .take(10)
          .value();
        break;

      default:
        processedData = [];
    }

    setTopItems(processedData);
  }, [data, dimension, metric]);

  const getTitle = () => {
    switch (dimension) {
      case 'artist':
        return 'Top 10 Most Listened Artists';
      case 'track':
        return 'Top 10 Most Played Tracks';
      case 'album':
        return 'Top 10 Most Played Albums';
      default:
        return 'Top 10 Chart';
    }
  };

  const getIndicatorDisplay = (item) => {
    if (item.indicatorType === 'popularity') {
      return Math.round(item.indicatorValue);
    } else if (item.indicatorType === 'year') {
      return item.indicatorValue ? item.indicatorValue.toString().slice(-2) : '??';
    }
    return '';
  };

  const getIndicatorOpacity = (item) => {
    if (item.indicatorType === 'popularity') {
      return item.indicatorValue / 100;
    }
    return 0.8;
  };

  const CustomBar = (props) => {
    const { x, y, width, height, displayName } = props;
    
    return (
      <g>
        <text
          x={x - 190}
          y={y + height/2}
          dy=".35em"
          textAnchor="start"
          className={`${dimension}-name`}
          title={displayName}
          fontSize="12"
          fontWeight="600"
        >
          {displayName.length > 30 ? displayName.substring(0, 30) + '...' : displayName}
        </text>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill="#3423A6"
          opacity={0.8}
          rx={4}
        />
        <text
          x={x + width + 5}
          y={y + height/2}
          dy=".35em"
          textAnchor="start"
          className="value-label"
        >
          {formatNumber(props.value)} plays
        </text>
      </g>
    );
  };

  return (
    <div className={`top-${dimension}s-container`}>
      <h3 className={`top-${dimension}s-title`}>{getTitle()}</h3>
      <div className={`top-${dimension}s-chart`}>
        <ResponsiveContainer width="100%" height={500}>
          <BarChart
            data={topItems}
            layout="vertical"
            margin={{ top: 20, right: 100, bottom: 20, left: 200 }}
          >
            <XAxis
              type="number"
              tickFormatter={formatNumber}
              domain={[0, 'dataMax']}
            />
            <YAxis
              type="category"
              dataKey="name"
              hide
            />
            <Bar
              dataKey="playCount"
              shape={<CustomBar />}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TopChart;
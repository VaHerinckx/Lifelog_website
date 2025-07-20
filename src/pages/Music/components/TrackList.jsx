// src/pages/Music/components/TrackList.jsx
import React from 'react';
import { Clock, Play, CheckCircle, Calendar, Headphones, Music, User, Album } from 'lucide-react';
import './TrackList.css';

// Helper function to format duration from milliseconds to readable format
const formatDuration = (milliseconds) => {
  if (!milliseconds || isNaN(milliseconds)) return 'Unknown duration';

  const totalSeconds = Math.round(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return 'Unknown date';

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Unknown date';

    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return 'Unknown date';
  }
};

// Helper function to get completion percentage
const getCompletionPercentage = (track) => {
  const completion = track.completion;

  if (completion !== undefined && completion !== null) {
    const parsedValue = parseFloat(completion);
    if (!isNaN(parsedValue)) {
      // Assume it's stored as decimal (0-1) if less than or equal to 1
      if (parsedValue <= 1) {
        return Math.min(Math.max(parsedValue * 100, 0), 100);
      } else {
        // Assume it's already percentage
        return Math.min(Math.max(parsedValue, 0), 100);
      }
    }
  }

  return 100; // Default to 100% if we can't determine
};

// Helper function to get primary genre
const getPrimaryGenre = (track) => {
  const genres = [track.genre_1, track.genre_2, track.genre_3, track.genre_4, track.genre_5]
    .filter(Boolean)
    .filter(genre => genre !== 'Unknown' && genre.trim() !== '');
  
  return genres.length > 0 ? genres[0] : null;
};

// Component for individual track item
const TrackListItem = ({ track, onClick }) => {
  const completionPercent = getCompletionPercentage(track);
  const isCompleted = completionPercent >= 95; // Consider 95%+ as completed
  const primaryGenre = getPrimaryGenre(track);

  return (
    <div className="track-list-item" onClick={() => onClick && onClick(track)}>
      {/* Track artwork/icon */}
      <div className="track-artwork">
        <div className="track-icon">
          <Music size={24} />
        </div>
        {/* Completion indicator overlay */}
        <div className="completion-overlay">
          {isCompleted ? (
            <CheckCircle size={16} className="completed-icon" />
          ) : (
            <Play size={16} className="partial-icon" />
          )}
        </div>
      </div>

      {/* Track info */}
      <div className="track-info">
        <div className="track-header">
          <h3 className="track-title" title={track.track_name}>
            {track.track_name || 'Untitled Track'}
          </h3>
          <p className="artist-name" title={track.artist_name}>
            <User size={14} style={{ marginRight: '4px' }} />
            {track.artist_name || 'Unknown Artist'}
          </p>
          {track.album_name && (
            <p className="album-name" title={track.album_name}>
              <Album size={14} style={{ marginRight: '4px' }} />
              {track.album_name}
            </p>
          )}
        </div>

        <div className="track-meta">
          <div className="track-details">
            <div className="meta-item">
              <Calendar size={16} />
              <span>{formatDate(track.timestamp)}</span>
            </div>

            <div className="meta-item">
              <Clock size={16} />
              <span>{formatDuration(track.track_duration)}</span>
            </div>

            <div className="meta-item">
              <Headphones size={16} />
              <span>{Math.round(completionPercent)}% completed</span>
            </div>

            {/* Artist popularity if available */}
            {track.artist_popularity && (
              <div className="meta-item">
                <span className="popularity-indicator">
                  {track.artist_popularity}/100 popularity
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Genre tag if available */}
        {primaryGenre && (
          <div className="track-tags">
            <span className="genre-tag">{primaryGenre}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Main TrackList component
const TrackList = ({ 
  tracks = [], 
  onTrackClick = null, 
  showSampleNote = false,
  totalCount = 0
}) => {
  // Sort tracks by most recent first
  const sortedTracks = React.useMemo(() => {
    return [...tracks].sort((a, b) => {
      const dateA = new Date(a.timestamp || 0);
      const dateB = new Date(b.timestamp || 0);
      return dateB - dateA; // Descending order (newest first)
    });
  }, [tracks]);

  if (tracks.length === 0) {
    return (
      <div className="track-list-empty">
        <Music size={48} className="empty-icon" />
        <p>No tracks found matching your current filters.</p>
        <p className="empty-subtitle">Try adjusting your filter criteria to see more tracks.</p>
      </div>
    );
  }

  return (
    <div className="track-list-container">
      <div className="track-list-header">
        <h2>Your Tracks ({sortedTracks.length})</h2>
      </div>

      <div className="track-list">
        {sortedTracks.map((track, index) => (
          <TrackListItem
            key={`${track.artist_name}-${track.track_name}-${track.timestamp}-${index}`}
            track={track}
            onClick={onTrackClick}
          />
        ))}
      </div>
      
      {/* Sample note */}
      {showSampleNote && totalCount > tracks.length && (
        <div className="sample-note-section">
          <div className="sample-note-info">
            <p>📊 <strong>Statistics above</strong> are calculated from all {totalCount.toLocaleString()} tracks</p>
            <p>📋 <strong>Track list below</strong> shows a sample of {tracks.length.toLocaleString()} tracks for performance</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackList;
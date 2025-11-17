// src/pages/Podcast/components/EpisodeList.jsx
import React from 'react';
import { Clock, Play, CheckCircle, Calendar, Headphones } from 'lucide-react';
import { formatDate } from '../../../utils';
import './EpisodeList.css';

// Helper function to format duration from seconds to readable format
const formatDuration = (seconds) => {
  if (!seconds || isNaN(seconds)) return 'Unknown duration';

  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
};

// Helper function to format date with time
const formatDateWithTime = (dateString) => {
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
const getCompletionPercentage = (episode) => {
  const completionPercent = episode.completion_percent;

  if (completionPercent !== undefined && completionPercent !== null) {
    const parsedValue = parseFloat(completionPercent);
    if (!isNaN(parsedValue)) {
      return Math.min(Math.max(parsedValue, 0), 100); // Clamp between 0-100
    }
  }

  return 100; // Default to 100% if we can't determine
};

// Component for individual episode item
const EpisodeListItem = ({ episode, onClick }) => {
  const completionPercent = getCompletionPercentage(episode);
  const isCompleted = completionPercent >= 95; // Consider 95%+ as completed

  return (
    <div className="episode-list-item" onClick={() => onClick && onClick(episode)}>
      {/* Podcast artwork */}
      <div className="episode-artwork">
        <img
          src={episode.artwork_url || "/api/placeholder/80/80"}
          alt={`${episode.podcast_name || 'Unknown Podcast'} artwork`}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "/api/placeholder/80/80";
          }}
        />
        {/* Completion indicator overlay */}
        <div className="completion-overlay">
          {isCompleted ? (
            <CheckCircle size={16} className="completed-icon" />
          ) : (
            <Play size={16} className="partial-icon" />
          )}
        </div>
      </div>

      {/* Episode info */}
      <div className="episode-info">
        <div className="episode-header">
          <h3 className="episode-title" title={episode.episode_title}>
            {episode.episode_title || 'Untitled Episode'}
          </h3>
          <p className="podcast-name" title={episode.podcast_name}>
            {episode.podcast_name || 'Unknown Podcast'}
          </p>
          {episode.artist && (
            <p className="podcast-artist">by {episode.artist}</p>
          )}
        </div>

        <div className="episode-meta">
          <div className="episode-details">
            <div className="meta-item">
              <Calendar size={16} />
              <span>{formatDateWithTime(episode.listened_date)}</span>
            </div>

            <div className="meta-item">
              <Clock size={16} />
              <span>{formatDuration(episode.duration_seconds)}</span>
            </div>

            <div className="meta-item">
              <Headphones size={16} />
              <span>{Math.round(completionPercent)}% completed</span>
            </div>
          </div>
        </div>

        {/* Genre tag if available */}
        {episode.genre && episode.genre !== 'Unknown' && !episode.genre.includes('https://') && (
          <div className="episode-tags">
            <span className="genre-tag">{episode.genre}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Main EpisodeList component
const EpisodeList = ({ episodes = [], onEpisodeClick = null }) => {
  // Sort episodes by most recent first
  const sortedEpisodes = React.useMemo(() => {
    return [...episodes].sort((a, b) => {
      const dateA = new Date(a.listened_date || 0);
      const dateB = new Date(b.listened_date || 0);
      return dateB - dateA; // Descending order (newest first)
    });
  }, [episodes]);

  if (episodes.length === 0) {
    return (
      <div className="episode-list-empty">
        <Headphones size={48} className="empty-icon" />
        <p>No episodes found matching your current filters.</p>
        <p className="empty-subtitle">Try adjusting your filter criteria to see more episodes.</p>
      </div>
    );
  }

  return (
    <div className="episode-list-container">
      <div className="episode-list-header">
      </div>

      <div className="episode-list">
        {sortedEpisodes.map((episode, index) => (
          <EpisodeListItem
            key={`${episode.podcast_name}-${episode.episode_title}-${index}`}
            episode={episode}
            onClick={onEpisodeClick}
          />
        ))}
      </div>
    </div>
  );
};

export default EpisodeList;

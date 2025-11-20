import React from 'react';
import { X, Tv, Calendar, MapPin, ExternalLink } from 'lucide-react';
import './EpisodeDetails.css';
import { formatDate } from '../../../utils';

const EpisodeDetails = ({ episode, onClose }) => {
  if (!episode) return null;

  // Format season/episode as "S01E06"
  const formatEpisodeNumber = (season, episodeNum) => {
    const s = String(season).padStart(2, '0');
    const e = String(episodeNum).padStart(2, '0');
    return `S${s}E${e}`;
  };

  const episodeCode = formatEpisodeNumber(episode.season, episode.episode_number);
  const progressPercent = episode.progress ? `${Math.round(episode.progress)}%` : 'N/A';

  return (
    <div className="episode-details-overlay">
      <div className="episode-details-modal">
        <button className="close-button" onClick={onClose}>
          <X size={24} />
        </button>

        <div className="episode-details-content">
          <div className="episode-details-poster">
            <div className="icon-container">
              <Tv size={48} />
            </div>
            <img
              src={episode.season_poster_url || "/api/placeholder/300/450"}
              alt={`${episode.show_title} Season ${episode.season} poster`}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/api/placeholder/300/450";
              }}
            />
          </div>

          <div className="episode-details-info">
            <h2>{episode.episode_title}</h2>
            <h3>{episode.show_title}</h3>

            {/* Show Information Section */}
            <div className="episode-section">
              <h4>Show Information</h4>
              <div className="episode-details-meta">
                {episode.show_year && (
                  <div className="meta-item">
                    <Calendar size={18} />
                    <span>Year: {episode.show_year}</span>
                  </div>
                )}

                <div className="meta-item">
                  <Tv size={18} />
                  <span>Episode: {episodeCode}</span>
                </div>

                <div className="meta-item">
                  <span className="label">Season:</span>
                  <span>{episode.season}</span>
                </div>

                <div className="meta-item">
                  <span className="label">Episode Number:</span>
                  <span>{episode.episode_number}</span>
                </div>
              </div>
            </div>

            {/* Watch Details Section */}
            <div className="episode-section">
              <h4>Watch Details</h4>
              <div className="episode-details-meta">
                <div className="meta-item">
                  <Calendar size={18} />
                  <span>Watched: {formatDate(episode.watched_at)}</span>
                </div>

                <div className="meta-item">
                  <span className="label">Progress:</span>
                  <span className="progress-value">{progressPercent}</span>
                </div>

                {episode.location && (
                  <div className="meta-item">
                    <MapPin size={18} />
                    <span>{episode.location}</span>
                  </div>
                )}

                {episode.source && (
                  <div className="meta-item">
                    <span className="label">Source:</span>
                    <span>{episode.source}</span>
                  </div>
                )}
              </div>
            </div>

            {/* External Links Section */}
            <div className="episode-section">
              <h4>External Links</h4>
              <div className="external-links">
                {episode.show_imdb_id && (
                  <a
                    href={`https://www.imdb.com/title/${episode.show_imdb_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="external-link"
                  >
                    <ExternalLink size={16} />
                    <span>Show on IMDb</span>
                  </a>
                )}

                {episode.episode_imdb_id && (
                  <a
                    href={`https://www.imdb.com/title/${episode.episode_imdb_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="external-link"
                  >
                    <ExternalLink size={16} />
                    <span>Episode on IMDb</span>
                  </a>
                )}

                {episode.show_trakt_id && (
                  <a
                    href={`https://trakt.tv/shows/${episode.show_trakt_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="external-link"
                  >
                    <ExternalLink size={16} />
                    <span>Show on Trakt</span>
                  </a>
                )}

                {episode.episode_trakt_id && (
                  <a
                    href={`https://trakt.tv/shows/${episode.show_trakt_id}/seasons/${episode.season}/episodes/${episode.episode_number}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="external-link"
                  >
                    <ExternalLink size={16} />
                    <span>Episode on Trakt</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EpisodeDetails;

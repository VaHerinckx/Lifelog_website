import React from 'react';
import { X, Calendar, Film, ExternalLink, RotateCcw } from 'lucide-react';
import './MovieDetails.css';
import { StarRating } from '../../../components/ui';
import { formatDate } from '../../../utils';

const MovieDetails = ({ movie, onClose }) => {
  if (!movie) return null;

  // Use genreArray if available (from deduplicated data), otherwise parse genre field
  const genres = movie.genreArray || (movie.genre ? movie.genre.split(',').map(g => g.trim()).filter(Boolean) : []);

  return (
    <div className="movie-details-overlay">
      <div className="movie-details-modal">
        <button className="close-button" onClick={onClose}>
          <X size={24} />
        </button>

        <div className="movie-details-content">
          <div className="movie-details-poster">
            <img
              src={movie.poster_url || "/api/placeholder/300/450"}
              alt={`${movie.name} poster`}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/api/placeholder/300/450";
              }}
            />
          </div>

          <div className="movie-details-info">
            <h2>{movie.name}</h2>
            <h3>{movie.year}</h3>

            <div className="movie-details-meta">
              <div className="meta-item">
                <Calendar size={18} />
                <span>Watched: {formatDate(movie.date)}</span>
              </div>

              <div className="meta-item">
                <Film size={18} />
                <span>Released: {movie.year}</span>
              </div>

              {movie.isRewatch && (
                <div className="meta-item rewatch-indicator">
                  <RotateCcw size={18} />
                  <span>Rewatch</span>
                </div>
              )}
            </div>

            {movie.rating > 0 && (
              <div className="movie-ratings">
                <div className="rating-item">
                  <label>My Rating:</label>
                  <div className="rating-display">
                    <StarRating rating={movie.rating} size={18} />
                    <span>{movie.rating.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            )}

            {genres.length > 0 && (
              <div className="movie-categories">
                <label>Genres:</label>
                <div className="genre-list">
                  {genres.map((genre, index) => (
                    <span key={index} className="movie-category">
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {movie.letterboxd_uri && (
              <div className="movie-link">
                <a
                  href={movie.letterboxd_uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="letterboxd-link"
                >
                  <ExternalLink size={16} />
                  View on Letterboxd
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetails;

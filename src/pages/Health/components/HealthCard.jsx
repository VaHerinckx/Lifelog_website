import PropTypes from 'prop-types';
import { Activity, Moon, Heart, StickyNote, Brain } from 'lucide-react';
import { StarRating } from '../../../components/ui';
import { formatDate } from '../../../utils';
import './HealthCard.css';

/**
 * Get the appropriate emoji for an evaluation score (1-5)
 * @param {number} rating - The evaluation score
 * @returns {string} Emoji string
 */
const getEvaluationEmoji = (rating) => {
  if (!rating || rating === 0) return '💪'; // Default health emoji
  const score = Math.round(rating);

  const emojiMap = {
    5: '😄',  // Very happy
    4: '🙂',  // Happy
    3: '😐',  // Neutral
    2: '😕',  // Unhappy
    1: '😞',  // Very unhappy
  };
  return emojiMap[score] || '💪';
};

/**
 * HealthCard - Displays daily health information in grid or list view
 *
 * Self-contained component that adapts its layout based on viewMode prop.
 * All styling is contained in HealthCard.css.
 *
 * Grid view: Vertical layout with evaluation emoji in top right
 * List view: Horizontal layout with evaluation emoji in top right
 *
 * @param {Object} day - Health day data object
 * @param {string} viewMode - Display mode ('grid' | 'list')
 * @param {Function} onClick - Callback when card is clicked
 */
const HealthCard = ({ day, viewMode = 'grid', onClick }) => {
  const cardClass = `health-card health-card--${viewMode}`;
  const healthEmoji = getEvaluationEmoji(day.overall_evaluation);

  // Format helper functions
  const formatSteps = (steps) => {
    if (!steps || steps === 0) return 'No data';
    return `${Math.round(steps).toLocaleString()} steps`;
  };

  const formatSleepMinutes = (minutes) => {
    if (!minutes || minutes === 0) return 'No data';
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  const formatHeartRate = (hr) => {
    if (!hr || hr === 0) return null;
    return `${Math.round(hr)} bpm`;
  };

  const formatWeight = (weight) => {
    if (!weight || weight === 0) return null;
    return `${weight.toFixed(1)} kg`;
  };

  // List view - horizontal layout
  if (viewMode === 'list') {
    return (
      <div className={cardClass} onClick={() => onClick(day)}>
        <div className="health-emoji-badge">{healthEmoji}</div>

        <div className="health-info">
          <h3 className="health-date">{formatDate(day.date)}</h3>

          <div className="health-meta">
            <div className="health-metric">
              <Activity size={16} />
              <span>{formatSteps(day.daily_steps)}</span>
            </div>

            <div className="health-metric">
              <Moon size={16} />
              <span>{formatSleepMinutes(day.sleep_minutes)}</span>
            </div>

            {formatHeartRate(day.avg_heart_rate) && (
              <div className="health-metric">
                <Heart size={16} />
                <span>{formatHeartRate(day.avg_heart_rate)}</span>
              </div>
            )}

            {formatWeight(day.avg_body_weight) && (
              <div className="health-metric">
                <span>{formatWeight(day.avg_body_weight)}</span>
              </div>
            )}
          </div>

          {day.overall_evaluation && day.overall_evaluation > 0 && (
            <div className="health-rating">
              <span className="rating-label">Overall:</span>
              <StarRating rating={day.overall_evaluation} maxRating={5} size={16} />
            </div>
          )}
        </div>

        <div className="health-indicators">
          {day.dominant_city && (
            <span className="health-location">{day.dominant_city}</span>
          )}
          {day.dreams && (
            <span className="health-indicator" title="Dream recorded">
              <Brain size={14} />
            </span>
          )}
          {day.notes_summary && (
            <span className="health-indicator" title="Notes available">
              <StickyNote size={14} />
            </span>
          )}
        </div>
      </div>
    );
  }

  // Grid view - vertical layout (default)
  return (
    <div className={cardClass} onClick={() => onClick(day)}>
      <div className="health-emoji-badge">{healthEmoji}</div>

      <div className="health-info">
        <h3 className="health-date" title={formatDate(day.date)}>
          {formatDate(day.date)}
        </h3>

        {day.overall_evaluation && day.overall_evaluation > 0 && (
          <div className="health-rating">
            <StarRating rating={day.overall_evaluation} maxRating={5} size={16} />
            <span className="rating-value">{day.overall_evaluation.toFixed(1)}</span>
          </div>
        )}

        <div className="health-meta">
          <div className="health-metric">
            <Activity size={16} />
            <span>{formatSteps(day.daily_steps)}</span>
          </div>

          <div className="health-metric">
            <Moon size={16} />
            <span>{formatSleepMinutes(day.sleep_minutes)}</span>
          </div>

          {formatHeartRate(day.avg_heart_rate) && (
            <div className="health-metric">
              <Heart size={16} />
              <span>{formatHeartRate(day.avg_heart_rate)}</span>
            </div>
          )}
        </div>

        {day.dominant_city && (
          <div className="health-location-tag">
            <span>{day.dominant_city}</span>
          </div>
        )}

        <div className="health-indicators-grid">
          {day.dreams && (
            <span className="health-indicator" title="Dream recorded">
              <Brain size={14} /> Dream
            </span>
          )}
          {day.notes_summary && (
            <span className="health-indicator" title="Notes available">
              <StickyNote size={14} /> Notes
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

HealthCard.propTypes = {
  day: PropTypes.shape({
    date: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]).isRequired,
    daily_steps: PropTypes.number,
    sleep_minutes: PropTypes.number,
    overall_evaluation: PropTypes.number,
    avg_heart_rate: PropTypes.number,
    avg_body_weight: PropTypes.number,
    dominant_city: PropTypes.string,
    dreams: PropTypes.string,
    notes_summary: PropTypes.string,
  }).isRequired,
  viewMode: PropTypes.oneOf(['grid', 'list']),
  onClick: PropTypes.func.isRequired,
};

export default HealthCard;

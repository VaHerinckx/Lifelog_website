import { useMemo } from 'react';
import { X, Activity, Moon, Heart, MapPin, Smartphone, Brain, StickyNote, Dumbbell, Home } from 'lucide-react';
import './HealthDetails.css';
import { StarRating } from '../../../components/ui';
import { formatDate } from '../../../utils';

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
 * Aggregate location data from hourly records
 * Groups by unique location (address/coordinates/city), sums minutes, counts unique visits
 */
const aggregateLocations = (hourlyData) => {
  if (!hourlyData || hourlyData.length === 0) return [];

  const locationMap = new Map(); // key -> { ...data, totalMinutes, visitIds }

  hourlyData.forEach(hour => {
    // Parse locations_json - handle both string and already-parsed object
    let locations = [];
    try {
      if (typeof hour.locations_json === 'string') {
        locations = JSON.parse(hour.locations_json);
      } else if (Array.isArray(hour.locations_json)) {
        locations = hour.locations_json;
      }
    } catch {
      return;
    }

    if (!Array.isArray(locations)) return;

    locations.forEach(loc => {
      // Generate unique key (prefer address > coordinates > city)
      const key = loc.address || loc.coordinates || loc.city;
      if (!key) return;

      if (!locationMap.has(key)) {
        locationMap.set(key, {
          city: loc.city,
          country: loc.country,
          address: loc.address,
          place_name: loc.place_name,
          coordinates: loc.coordinates,
          is_home: loc.is_home,
          location_type: loc.location_type,
          totalMinutes: 0,
          visitIds: new Set()
        });
      }

      const entry = locationMap.get(key);
      entry.totalMinutes += loc.minutes || 0;
      if (loc.visit_id) {
        entry.visitIds.add(loc.visit_id);
      }
    });
  });

  // Convert to array, calculate visit counts, and sort by time (most to least)
  return Array.from(locationMap.values())
    .map(loc => ({
      ...loc,
      visitCount: loc.visitIds.size || 1
    }))
    .sort((a, b) => b.totalMinutes - a.totalMinutes);
};

/**
 * Aggregate activity data from hourly records
 * Groups by activity type, sums minutes and distance
 */
const aggregateActivities = (hourlyData) => {
  if (!hourlyData || hourlyData.length === 0) return [];

  const activityMap = new Map(); // activity_type -> { minutes, distance_m }

  hourlyData.forEach(hour => {
    // Parse activities_json - handle both string and already-parsed object
    let activities = {};
    try {
      if (typeof hour.activities_json === 'string') {
        activities = JSON.parse(hour.activities_json);
      } else if (typeof hour.activities_json === 'object' && hour.activities_json !== null) {
        activities = hour.activities_json;
      }
    } catch {
      return;
    }

    if (typeof activities !== 'object' || activities === null) return;

    Object.entries(activities).forEach(([activityType, data]) => {
      if (!activityMap.has(activityType)) {
        activityMap.set(activityType, { minutes: 0, distance_m: 0 });
      }

      const entry = activityMap.get(activityType);
      entry.minutes += data.minutes || 0;
      entry.distance_m += data.distance_m || 0;
    });
  });

  // Convert to array and sort by time (most to least)
  return Array.from(activityMap.entries())
    .map(([type, data]) => ({
      type,
      displayName: type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' '),
      minutes: data.minutes,
      distance_m: data.distance_m
    }))
    .sort((a, b) => b.minutes - a.minutes);
};

const HealthDetails = ({ day, hourlyData = [], onClose }) => {
  // Aggregate location and activity data from hourly records
  // These must be called before any conditional returns (React hooks rules)
  const aggregatedLocations = useMemo(() => aggregateLocations(hourlyData), [hourlyData]);
  const aggregatedActivities = useMemo(() => aggregateActivities(hourlyData), [hourlyData]);

  if (!day) return null;

  const healthEmoji = getEvaluationEmoji(day.overall_evaluation);

  // Format helper functions
  const formatSteps = (steps) => {
    if (!steps || steps === 0) return 'No data';
    return `${Math.round(steps).toLocaleString()} steps`;
  };

  const formatDistance = (km) => {
    if (!km || km === 0) return 'No data';
    return `${km.toFixed(2)} km`;
  };

  const formatEnergy = (kcal) => {
    if (!kcal || kcal === 0) return 'No data';
    return `${Math.round(kcal)} kcal`;
  };

  const formatMinutes = (minutes) => {
    if (!minutes || minutes === 0) return 'No data';
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h 0m`;
    return `${hours}h ${mins}m`;
  };

  const formatHeartRate = (hr) => {
    if (!hr || hr === 0) return 'No data';
    return `${Math.round(hr)} bpm`;
  };

  const formatWeight = (weight) => {
    if (!weight || weight === 0) return 'No data';
    return `${weight.toFixed(1)} kg`;
  };

  const formatBodyFat = (fat) => {
    if (!fat || fat === 0) return 'No data';
    return `${(fat * 100).toFixed(1)}%`;
  };

  const formatAudio = (db) => {
    if (!db || db === 0) return 'No data';
    return `${Math.round(db)} dB`;
  };

  const formatScreenTime = (minutes) => {
    if (!minutes || minutes === 0) return 'No data';
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="health-details-overlay" onClick={onClose}>
      <div className="health-details-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>
          <X size={24} />
        </button>

        <div className="health-details-content">
          <div className="health-details-header">
            <div className="health-icon-large">
              <span className="health-emoji-large">{healthEmoji}</span>
            </div>
            <div className="health-header-info">
              <h2>{formatDate(day.date)}</h2>
              {day.dominant_city && (
                <p className="health-location">{day.dominant_city}</p>
              )}
            </div>
          </div>

          <div className="health-details-body">

            {/* Subjective Evaluations Section */}
            <div className="health-section">
              <h3 className="section-title">
                <Dumbbell size={20} />
                Evaluations
              </h3>
              <div className="section-content">
                {day.overall_evaluation && day.overall_evaluation > 0 && (
                  <div className="rating-item">
                    <label>Overall Feeling:</label>
                    <div className="rating-display">
                      <StarRating rating={day.overall_evaluation} maxRating={5} size={18} />
                      <span>{day.overall_evaluation.toFixed(1)}</span>
                    </div>
                  </div>
                )}
                {day.sleep_quality && day.sleep_quality > 0 && (
                  <div className="rating-item">
                    <label>Sleep Quality:</label>
                    <div className="rating-display">
                      <StarRating rating={day.sleep_quality} maxRating={5} size={18} />
                      <span>{day.sleep_quality.toFixed(1)} ({day.sleep_quality_text || 'N/A'})</span>
                    </div>
                  </div>
                )}
                {day.fitness_feeling && day.fitness_feeling > 0 && (
                  <div className="rating-item">
                    <label>Fitness Feeling:</label>
                    <div className="rating-display">
                      <StarRating rating={day.fitness_feeling} maxRating={5} size={18} />
                      <span>{day.fitness_feeling.toFixed(1)}</span>
                    </div>
                  </div>
                )}
                {day.sleep_rest_feeling && day.sleep_rest_feeling > 0 && (
                  <div className="rating-item">
                    <label>Rest Feeling:</label>
                    <div className="rating-display">
                      <StarRating rating={day.sleep_rest_feeling} maxRating={5} size={18} />
                      <span>{day.sleep_rest_feeling.toFixed(1)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Subjective Notes Section */}
            {(day.notes_summary || day.dream_description) && (
              <div className="health-section health-notes-section">
                <h3 className="section-title">
                  <StickyNote size={20} />
                  Notes & Reflections
                </h3>
                <div className="section-content">
                  {day.dream_description && (
                    <div className="note-item">
                      <div className="note-header">
                        <Brain size={16} />
                        <label>Dream:</label>
                      </div>
                      <p className="note-text">{day.dream_description}</p>
                    </div>
                  )}
                  {day.notes_summary && (
                    <div className="note-item">
                      <div className="note-header">
                        <StickyNote size={16} />
                        <label>Daily Notes:</label>
                      </div>
                      <p className="note-text">{day.notes_summary}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Activity Metrics Section */}
            <div className="health-section">
              <h3 className="section-title">
                <Activity size={20} />
                Activity Metrics
              </h3>
              <div className="section-content">
                <div className="detail-item">
                  <label>Steps:</label>
                  <span>{formatSteps(day.daily_steps)}</span>
                </div>
                <div className="detail-item">
                  <label>Walking Distance:</label>
                  <span>{formatDistance(day.daily_walking_dist)}</span>
                </div>
                <div className="detail-item">
                  <label>Flights Climbed:</label>
                  <span>{day.daily_flights_climbed || 'No data'}</span>
                </div>
                <div className="detail-item">
                  <label>Resting Energy:</label>
                  <span>{formatEnergy(day.daily_resting_energy)}</span>
                </div>
                <div className="detail-item">
                  <label>Active Energy:</label>
                  <span>{formatEnergy(day.daily_active_energy)}</span>
                </div>
                {day.avg_step_length && day.avg_step_length > 0 && (
                  <div className="detail-item">
                    <label>Avg Step Length:</label>
                    <span>{day.avg_step_length.toFixed(1)} cm</span>
                  </div>
                )}
                {day.avg_walking_speed && day.avg_walking_speed > 0 && (
                  <div className="detail-item">
                    <label>Avg Walking Speed:</label>
                    <span>{day.avg_walking_speed.toFixed(2)} km/h</span>
                  </div>
                )}
              </div>
            </div>

            {/* Sleep Metrics Section */}
            <div className="health-section">
              <h3 className="section-title">
                <Moon size={20} />
                Sleep Metrics
              </h3>
              <div className="section-content">
                <div className="detail-item">
                  <label>Total Sleep:</label>
                  <span>{formatMinutes(day.sleep_minutes)}</span>
                </div>
                <div className="detail-item">
                  <label>Core Sleep:</label>
                  <span>{formatMinutes(day.sleep_core_sleep_minutes)}</span>
                </div>
                <div className="detail-item">
                  <label>Deep Sleep:</label>
                  <span>{formatMinutes(day.sleep_deep_sleep_minutes)}</span>
                </div>
                <div className="detail-item">
                  <label>REM Sleep:</label>
                  <span>{formatMinutes(day.sleep_rem_sleep_minutes)}</span>
                </div>
                <div className="detail-item">
                  <label>Time Awake:</label>
                  <span>{formatMinutes(day.sleep_awake_minutes)}</span>
                </div>
                <div className="detail-item">
                  <label>Time in Bed:</label>
                  <span>{formatMinutes(day.sleep_in_bed_minutes)}</span>
                </div>
              </div>
            </div>

            {/* Body Metrics Section */}
            <div className="health-section">
              <h3 className="section-title">
                <Heart size={20} />
                Body Metrics
              </h3>
              <div className="section-content">
                <div className="detail-item">
                  <label>Avg Heart Rate:</label>
                  <span>{formatHeartRate(day.avg_heart_rate)}</span>
                </div>
                <div className="detail-item">
                  <label>Body Weight:</label>
                  <span>{formatWeight(day.avg_body_weight)}</span>
                </div>
                <div className="detail-item">
                  <label>Body Fat:</label>
                  <span>{formatBodyFat(day.avg_body_fat_percent)}</span>
                </div>
                <div className="detail-item">
                  <label>Audio Exposure:</label>
                  <span>{formatAudio(day.avg_audio_exposure)}</span>
                </div>
              </div>
            </div>

            {/* Location Breakdown Section */}
            <div className="health-section">
              <h3 className="section-title">
                <MapPin size={20} />
                Location Breakdown
              </h3>
              <div className="section-content">
                {aggregatedLocations.length > 0 ? (
                  <div className="breakdown-list">
                    {aggregatedLocations.map((loc, index) => (
                      <div key={index} className="breakdown-item">
                        <div className="breakdown-item-main">
                          <span className="breakdown-name">
                            {loc.place_name || loc.city || 'Unknown Location'}
                            {loc.is_home && (
                              <span className="home-badge">
                                <Home size={12} />
                                Home
                              </span>
                            )}
                          </span>
                          <span className="breakdown-value">{formatMinutes(loc.totalMinutes)}</span>
                        </div>
                        <div className="breakdown-item-sub">
                          {loc.city && loc.place_name && <span className="breakdown-city">{loc.city}</span>}
                          {loc.visitCount > 1 && (
                            <span className="breakdown-visits">{loc.visitCount} visits</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="detail-item">
                    <label>Dominant City:</label>
                    <span>{day.dominant_city || 'Unknown'}</span>
                  </div>
                )}
                {/* Summary stats */}
                <div className="breakdown-summary">
                  <div className="detail-item">
                    <label>Cities Visited:</label>
                    <span>{day.cities_visited || 0}</span>
                  </div>
                  {day.percent_time_home != null && (
                    <div className="detail-item">
                      <label>Time at Home:</label>
                      <span>{day.percent_time_home.toFixed(0)}%</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Activity Breakdown Section */}
            {aggregatedActivities.length > 0 && (
              <div className="health-section">
                <h3 className="section-title">
                  <Activity size={20} />
                  Activity Breakdown
                </h3>
                <div className="section-content">
                  <div className="breakdown-list">
                    {aggregatedActivities.map((activity, index) => (
                      <div key={index} className="breakdown-item">
                        <div className="breakdown-item-main">
                          <span className="breakdown-name">{activity.displayName}</span>
                          <span className="breakdown-value">
                            {formatMinutes(activity.minutes)}
                            {activity.distance_m > 0 && (
                              <span className="breakdown-distance">
                                ({(activity.distance_m / 1000).toFixed(1)} km)
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Screen Time Section */}
            <div className="health-section">
              <h3 className="section-title">
                <Smartphone size={20} />
                Screen Time
              </h3>
              <div className="section-content">
                <div className="detail-item">
                  <label>Total Screen Time:</label>
                  <span>{formatScreenTime(day.total_screen_minutes)}</span>
                </div>
                <div className="detail-item">
                  <label>Pickups:</label>
                  <span>{day.total_pickups || 'No data'}</span>
                </div>
                <div className="detail-item">
                  <label>Before Sleep:</label>
                  <span>{formatScreenTime(day.screen_before_sleep_minutes)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthDetails;

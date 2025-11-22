import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { BookOpen, Film, Music, UtensilsCrossed, Mic, Tv, DollarSign, Activity, Dumbbell, Briefcase, Clock } from 'lucide-react';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useData } from '../../context/DataContext';
import './Homepage.css';

const Homepage = () => {
  usePageTitle('Dashboard');
  const { data, fetchData } = useData();
  const [categoryStatuses, setCategoryStatuses] = useState({});
  const hasCalculated = useRef(false);

  // Fetch all data sources and tracking data on mount
  useEffect(() => {
    if (typeof fetchData === 'function') {
      // Fetch all data sources
      fetchData('readingBooks');
      fetchData('movies');
      fetchData('music');
      fetchData('podcasts');
      fetchData('nutrition');
      fetchData('health');
      fetchData('shows');
      fetchData('finance');
      fetchData('tracking');
    }
  }, [fetchData]);

  // Calculate statuses once when tracking data is loaded
  useEffect(() => {
    // Only calculate once - check if we have tracking data loaded
    if (!data?.tracking || hasCalculated.current) return;

    const formatDate = (dateString) => {
      if (!dateString) return null;
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return null;
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };

    const formatDateTime = (dateString) => {
      if (!dateString) return null;
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return null;
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    };

    const getTrackingInfo = (sourceName) => {
      if (!data.tracking?.length) return { latestData: null, lastRefresh: null };
      const record = data.tracking.find(r => r.source_name === sourceName);
      if (!record) return { latestData: null, lastRefresh: null };

      return {
        latestData: formatDate(record.latest_data_date),
        lastRefresh: formatDateTime(record.last_successful_run)
      };
    };

    const statuses = {
      reading: {
        ...getTrackingInfo('topic_reading'),
        message: 'Last book finished'
      },
      movies: {
        ...getTrackingInfo('topic_movies'),
        message: 'Last watched'
      },
      music: {
        ...getTrackingInfo('topic_music'),
        message: 'Last listened'
      },
      podcasts: {
        ...getTrackingInfo('topic_podcasts'),
        message: 'Last episode'
      },
      nutrition: {
        ...getTrackingInfo('topic_nutrition'),
        message: 'Last meal logged'
      },
      health: {
        ...getTrackingInfo('topic_health'),
        message: 'Last activity'
      },
      shows: {
        ...getTrackingInfo('topic_shows'),
        message: 'Last watched'
      },
      finance: {
        ...getTrackingInfo('topic_finance'),
        message: 'Last transaction'
      }
    };

    setCategoryStatuses(statuses);
    hasCalculated.current = true;
  }, [data?.tracking]);

  const categories = [
    {
      id: 'reading',
      title: 'Reading',
      icon: BookOpen,
      description: 'Keep track of your reading journey',
      path: '/reading'
    },
    {
      id: 'movies',
      title: 'Movies',
      icon: Film,
      description: 'Track your viewing habits and movie preferences',
      path: '/movies'
    },
    {
      id: 'music',
      title: 'Music',
      icon: Music,
      description: 'Explore your listening history and music preferences',
      path: '/music'
    },
    {
      id: 'nutrition',
      title: 'Nutrition',
      icon: UtensilsCrossed,
      description: 'Track meals, food choices, and nutritional patterns',
      path: '/nutrition'
    },
    {
      id: 'podcasts',
      title: 'Podcasts',
      icon: Mic,
      description: 'Track your podcast listening habits and discover insights',
      path: '/podcasts'
    },
    {
      id: 'shows',
      title: 'TV Shows',
      icon: Tv,
      description: 'Track your TV show watching history and viewing patterns',
      path: '/shows'
    },
    {
      id: 'finance',
      title: 'Finance',
      icon: DollarSign,
      description: 'Track your income, expenses, and financial patterns over time',
      path: '/finance'
    },
    {
      id: 'health',
      title: 'Health',
      icon: Activity,
      description: 'Track daily activity, sleep patterns, and overall wellness',
      path: '/health'
    },
    {
      id: 'sport',
      title: 'Sport',
      icon: Dumbbell,
      description: 'Record your workouts and athletic progress',
      path: '/sport'
    },
    {
      id: 'work',
      title: 'Work',
      icon: Briefcase,
      description: 'Monitor your productivity and tasks',
      path: '/work'
    }
  ];

  return (
    <div className="homepage">
      {/* Fixed Hero Header */}
      <header className="hero-header">
        <div className="hero-container">
          <h1 className="hero-title">LifeLog</h1>
          <p className="hero-subtitle">Your Personal Life Dashboard</p>
        </div>
      </header>

      {/* Scrollable Content */}
      <main className="homepage-main">
        <div className="homepage-container">
          {/* Category List */}
          <section className="categories-section">
            <div className="category-list">
              {categories.map((category) => {
                const IconComponent = category.icon;
                const status = categoryStatuses[category.id];

                return (
                  <Link
                    key={category.id}
                    to={category.path}
                    className="category-item"
                  >
                    <div className="category-icon-container">
                      <IconComponent className="category-icon" />
                    </div>

                    <div className="category-content">
                      <h3 className="category-title">{category.title}</h3>
                      <p className="category-description">{category.description}</p>
                    </div>

                    <div className="category-status">
                      {status?.latestData ? (
                        <>
                          <div className="status-primary">
                            <Clock size={16} className="status-icon" />
                            <span>{status.message}: {status.latestData}</span>
                          </div>
                          {status.lastRefresh && (
                            <div className="status-secondary">
                              Data refreshed: {status.lastRefresh}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="status-placeholder">
                          Coming soon
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="homepage-footer">
        <p>Track, analyze, and improve your daily life with LifeLog</p>
      </footer>
    </div>
  );
};

export default Homepage;

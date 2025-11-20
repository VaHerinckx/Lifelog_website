import { Link } from 'react-router-dom';
import { BookOpen, Film, Music, UtensilsCrossed, Mic, Tv, DollarSign, Dumbbell, Briefcase } from 'lucide-react';
import { usePageTitle } from '../../hooks/usePageTitle';
import './Homepage.css';

const Homepage = () => {
  usePageTitle('Dashboard');
  const categories = [
    {
      title: 'Reading',
      icon: BookOpen,
      description: 'Keep track of your reading journey',
      path: '/reading'
    },
    {
      title: 'Movies',
      icon: Film,
      description: 'Track your viewing habits and movie preferences',
      path: '/movies'
    },
    {
      title: 'Music',
      icon: Music,
      description: 'Explore your listening history and music preferences',
      path: '/music'
    },
    {
      title: 'Nutrition',
      icon: UtensilsCrossed,
      description: 'Track meals, food choices, and nutritional patterns',
      path: '/nutrition'
    },
    {
      title: 'Podcasts',
      icon: Mic,
      description: 'Track your podcast listening habits and discover insights',
      path: '/podcasts'
    },
    {
      title: 'TV Shows',
      icon: Tv,
      description: 'Track your TV show watching history and viewing patterns',
      path: '/shows'
    },
    {
      title: 'Finance',
      icon: DollarSign,
      description: 'Track your income, expenses, and financial patterns over time',
      path: '/finance'
    },
    {
      title: 'Sport',
      icon: Dumbbell,
      description: 'Record your workouts and athletic progress',
      path: '/sport'
    },
    {
      title: 'Work',
      icon: Briefcase,
      description: 'Monitor your productivity and tasks',
      path: '/work'
    }
  ];

  return (
    <div className="page">
      <header className="top-header">
        <div className="header-container">
          <div className="logo-container">
            <img
              src="/logo.png"
              alt="Life Dashboard Logo"
              className="logo"
            />
            <h1 className="site-name">LifeLog</h1>
          </div>
        </div>
      </header>
      <section className="welcome-banner">
        <div className="welcome-content">
          <h2 className="welcome-title">
            Welcome to your life dashboard, Valentin
          </h2>
          <p className="welcome-text">
            LifeLog is your personal life tracking companion. Monitor and analyze various aspects
            of your daily life, from health and productivity to entertainment and finances.
            Get insights into your habits and make data-driven decisions to improve your lifestyle.
          </p>
        </div>
      </section>
      <main className="main-section">
        <div className="category-grid">
          {categories.map((category) => {
            const IconComponent = category.icon;
            return (
              <div key={category.title} className="category-card">
                <div className="card-body">
                  <div className="card-header">
                    <IconComponent className="card-icon" size={40} />
                    <h3 className="card-title">
                      {category.title}
                    </h3>
                  </div>
                  <p className="card-description">
                    {category.description}
                  </p>
                  <div className="card-action">
                    <Link to={category.path} className="explore-link">
                      Explore →
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
      <footer className="bottom-footer">
        <div className="footer-content">
          Track, analyze, and improve your daily life with LifeLog
        </div>
      </footer>
    </div>
  );
};

export default Homepage;

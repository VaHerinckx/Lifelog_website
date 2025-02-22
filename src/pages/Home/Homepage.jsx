import { Link } from 'react-router-dom';
import './Homepage.css';

const Homepage = () => {
  const categories = [
    {
      title: 'Podcast',
      icon: '/icons/podcast_w.png',
      description: 'Track your listening habits and favorite shows',
      path: '/podcast'
    },
    {
      title: 'Music',
      icon: '/icons/music_w.png',
      description: 'Monitor your music preferences and discoveries',
      path: '/music'
    },
    {
      title: 'Nutrition',
      icon: '/icons/food_w.png',
      description: 'Log your meals and track nutritional intake',
      path: '/nutrition'
    },
    {
      title: 'Sport',
      icon: '/icons/sport_w.png',
      description: 'Record your workouts and athletic progress',
      path: '/sport'
    },
    {
      title: 'Health',
      icon: '/icons/health_w.png',
      description: 'Monitor sleep, stress, and vital metrics',
      path: '/health'
    },
    {
      title: 'Reading',
      icon: '/icons/book_w.png',
      description: 'Keep track of your reading journey',
      path: '/reading'
    },
    {
      title: 'Movies & TV',
      icon: '/icons/movie_w.png',
      description: 'Log your watching history and ratings',
      path: '/movies'
    },
    {
      title: 'Finances',
      icon: '/icons/finance_w.png',
      description: 'Track your spending and savings',
      path: '/finances'
    },
    {
      title: 'Work',
      icon: '/icons/work_w.png',
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
          {categories.map((category) => (
            <div key={category.title} className="category-card">
              <div className="card-body">
                <div className="card-header">
                  <img
                    src={category.icon}
                    alt={`${category.title} icon`}
                    className="card-icon"
                  />
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
          ))}
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

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './NavigationBar.css';

const NavigationBar = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home', icon: '/icons/home_w.png' },
    { path: '/podcast', label: 'Podcast', icon: '/icons/podcast_w.png' },
    { path: '/music', label: 'Music', icon: '/icons/music_w.png' },
    { path: '/nutrition', label: 'Nutrition', icon: '/icons/food_w.png' },
    { path: '/sport', label: 'Sport', icon: '/icons/sport_w.png' },
    { path: '/health', label: 'Health', icon: '/icons/health_w.png' },
    { path: '/reading', label: 'Reading', icon: '/icons/book_w.png' },
    { path: '/movies', label: 'Movies & TV', icon: '/icons/movie_w.png' },
    { path: '/finances', label: 'Finances', icon: '/icons/finance_w.png' },
    { path: '/work', label: 'Work', icon: '/icons/work_w.png' }
  ];

  return (
    <nav className="navigation-bar">
      <div className="nav-container">
        <div className="nav-logo">
          <Link to="/" className="logo-link">
            <img src="/logo.png" alt="LifeLog Logo" className="nav-logo-img" />
            <span className="nav-logo-text">LifeLog</span>
          </Link>
        </div>
        <div className="nav-items">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <img src={item.icon} alt={`${item.label} icon`} className="nav-icon" />
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default NavigationBar;

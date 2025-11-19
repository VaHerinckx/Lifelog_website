import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './NavigationBar.css';

const NavigationBar = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home', icon: '/icons/home_w.png', implemented: true },
    { path: '/reading', label: 'Reading', icon: '/icons/book_w.png', implemented: true },
    { path: '/movies', label: 'Movies', icon: '/icons/movie_w.png', implemented: true },
    { path: '/nutrition', label: 'Nutrition', icon: '/icons/nutrition_w.png', implemented: true },
    { path: '/sport', label: 'Sport', icon: '/icons/sport_w.png', implemented: false },
    { path: '/work', label: 'Work', icon: '/icons/work_w.png', implemented: false }
  ];

  const handleNavClick = (item) => {
    console.log('🔍 Navigation item clicked:', {
      label: item.label,
      path: item.path,
      currentLocation: location.pathname,
      timestamp: new Date().toISOString()
    });
  };

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
              onClick={() => handleNavClick(item)}
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

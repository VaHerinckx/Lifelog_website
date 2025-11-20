import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, Film, Music, UtensilsCrossed, Mic, Tv, DollarSign, Dumbbell, Briefcase } from 'lucide-react';
import './NavigationBar.css';

const NavigationBar = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home', icon: Home, implemented: true },
    { path: '/reading', label: 'Reading', icon: BookOpen, implemented: true },
    { path: '/movies', label: 'Movies', icon: Film, implemented: true },
    { path: '/music', label: 'Music', icon: Music, implemented: true },
    { path: '/nutrition', label: 'Nutrition', icon: UtensilsCrossed, implemented: true },
    { path: '/podcasts', label: 'Podcasts', icon: Mic, implemented: true },
    { path: '/shows', label: 'TV Shows', icon: Tv, implemented: true },
    { path: '/finance', label: 'Finance', icon: DollarSign, implemented: true },
    { path: '/sport', label: 'Sport', icon: Dumbbell, implemented: false },
    { path: '/work', label: 'Work', icon: Briefcase, implemented: false }
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
          {navItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                onClick={() => handleNavClick(item)}
              >
                <IconComponent className="nav-icon" size={24} />
                <span className="nav-label">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default NavigationBar;

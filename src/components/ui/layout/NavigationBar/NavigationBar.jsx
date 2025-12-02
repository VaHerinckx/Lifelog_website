import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, Film, Music, UtensilsCrossed, Mic, Tv, DollarSign, Activity, Dumbbell, Briefcase, Menu, X } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import './NavigationBar.css';

const NavigationBar = () => {
  const location = useLocation();
  const { isPageAllowed } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const allNavItems = [
    { path: '/', label: 'Home', icon: Home, implemented: true },
    { path: '/reading', label: 'Reading', icon: BookOpen, implemented: true },
    { path: '/movies', label: 'Movies', icon: Film, implemented: true },
    { path: '/music', label: 'Music', icon: Music, implemented: true },
    { path: '/nutrition', label: 'Nutrition', icon: UtensilsCrossed, implemented: true },
    { path: '/podcasts', label: 'Podcasts', icon: Mic, implemented: true },
    { path: '/shows', label: 'TV Shows', icon: Tv, implemented: true },
    { path: '/finance', label: 'Finance', icon: DollarSign, implemented: true },
    { path: '/health', label: 'Health', icon: Activity, implemented: true },
    { path: '/sport', label: 'Sport', icon: Dumbbell, implemented: false },
    { path: '/work', label: 'Work', icon: Briefcase, implemented: false }
  ];

  // Filter nav items based on user role
  const navItems = allNavItems.filter(item => isPageAllowed(item.path));

  const handleNavClick = (item) => {
    console.log('🔍 Navigation item clicked:', {
      label: item.label,
      path: item.path,
      currentLocation: location.pathname,
      timestamp: new Date().toISOString()
    });
    setIsMenuOpen(false); // Close mobile menu on navigation
  };

  const renderNavItems = (isMobile = false) => (
    navItems.map((item) => {
      const IconComponent = item.icon;
      return (
        <Link
          key={item.path}
          to={item.path}
          className={`nav-item ${isMobile ? 'mobile-nav-item' : ''} ${location.pathname === item.path ? 'active' : ''}`}
          onClick={() => handleNavClick(item)}
        >
          <IconComponent className="nav-icon" size={24} />
          <span className="nav-label">{item.label}</span>
        </Link>
      );
    })
  );

  return (
    <nav className="navigation-bar">
      <div className="nav-container">
        <div className="nav-logo">
          <Link to="/" className="logo-link" onClick={() => setIsMenuOpen(false)}>
            <img src="/logo.png" alt="LifeLog Logo" className="nav-logo-img" />
            <span className="nav-logo-text">LifeLog</span>
          </Link>
        </div>

        {/* Desktop/tablet navigation */}
        <div className="nav-items">
          {renderNavItems()}
        </div>

        {/* Hamburger button for mobile */}
        <button
          className="hamburger-btn"
          onClick={() => setIsMenuOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile slide-out menu */}
      <div className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-header">
          <Link to="/" className="logo-link" onClick={() => setIsMenuOpen(false)}>
            <img src="/logo.png" alt="LifeLog Logo" className="nav-logo-img" />
            <span className="nav-logo-text">LifeLog</span>
          </Link>
          <button
            className="close-menu-btn"
            onClick={() => setIsMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>
        <div className="mobile-nav-items">
          {renderNavItems(true)}
        </div>
      </div>

      {/* Overlay backdrop */}
      {isMenuOpen && (
        <div
          className="menu-overlay"
          onClick={() => setIsMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </nav>
  );
};

export default NavigationBar;

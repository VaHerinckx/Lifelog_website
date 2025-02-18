// LoadingSpinner.jsx
import React from 'react';
import { Activity, Music, Podcast, Book, Film, DollarSign, Brain, Utensils, Briefcase } from 'lucide-react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ centerIcon: CenterIcon = Podcast, containerClass = "" }) => {
  return (
    <div className={`loading-container ${containerClass}`}>
      <div className="solar-system">
        {/* Center "sun" icon */}
        <div className="center-icon">
          <CenterIcon size={48} />
        </div>

        {/* Inner orbit */}
        <div className="orbit orbit-inner">
          <div className="icon-container">
            <Activity size={32} className="orbit-icon" />
          </div>
          <div className="icon-container">
            <Film size={32} className="orbit-icon" />
          </div>
          <div className="icon-container">
            <DollarSign size={32} className="orbit-icon" />
          </div>
          <div className="icon-container">
            <Briefcase size={32} className="orbit-icon" />
          </div>
        </div>

        {/* Outer orbit */}
        <div className="orbit orbit-outer">
          <div className="icon-container">
            <Music size={32} className="orbit-icon" />
          </div>
          <div className="icon-container">
            <Brain size={32} className="orbit-icon" />
          </div>
          <div className="icon-container">
            <Book size={32} className="orbit-icon" />
          </div>
          <div className="icon-container">
            <Utensils size={32} className="orbit-icon" />
          </div>
        </div>
      </div>
      <p className="loading-text">Collecting your life data...</p>
    </div>
  );
};

export default LoadingSpinner;

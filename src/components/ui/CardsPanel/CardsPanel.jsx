// src/components/ui/CardsPanel/CardsPanel.jsx
import React from 'react';
import KpiCard from '../../charts/KpiCard';
import './CardsPanel.css';

/**
 * A reusable component for displaying a grid of KPI cards with consistent layout and styling
 *
 * @param {Object} props
 * @param {Array} props.cards - Array of card objects with { value, label, icon } properties
 * @param {string} [props.title] - Optional title to display above the cards
 * @param {string} [props.description] - Optional description to display below the title
 * @param {boolean} [props.loading] - Whether the cards are in a loading state
 * @param {string} [props.className] - Additional CSS classes to apply to the container
 */
const CardsPanel = ({
  cards = [],
  title,
  description,
  loading = false,
  className = ''
}) => {
  // Show loading state if requested
  if (loading) {
    return (
      <div className={`cards-panel ${className}`}>
        {title && <h2 className="cards-panel-title">{title}</h2>}
        {description && <p className="cards-panel-description">{description}</p>}
        <div className="cards-panel-grid">
          {/* Show placeholder cards while loading */}
          {[1, 2, 3, 4].map((index) => (
            <div key={index} className="cards-panel-skeleton">
              <div className="skeleton-icon"></div>
              <div className="skeleton-value"></div>
              <div className="skeleton-label"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Show empty state if no cards provided
  if (!cards || cards.length === 0) {
    return (
      <div className={`cards-panel ${className}`}>
        {title && <h2 className="cards-panel-title">{title}</h2>}
        {description && <p className="cards-panel-description">{description}</p>}
        <div className="cards-panel-empty">
          <p>No statistics available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`cards-panel ${className}`}>
      {title && <h2 className="cards-panel-title">{title}</h2>}
      {description && <p className="cards-panel-description">{description}</p>}

      <div className="cards-panel-grid">
        {cards.map((card, index) => (
          <KpiCard
            key={`${card.label}-${index}`}
            value={card.value}
            label={card.label}
            icon={card.icon}
          />
        ))}
      </div>
    </div>
  );
};

export default CardsPanel;

// src/components/ui/CardsPanel/CardsPanel.jsx
import React from 'react';
import KpiCard from '../../charts/KpiCard';
import './CardsPanel.css';

/**
 * A reusable component for displaying a grid of KPI cards with consistent layout and styling
 *
 * Supports two modes:
 * 1. Legacy mode: Cards array with pre-computed values
 * 2. Smart mode: Cards array with data source configs + dataSources object
 *
 * @param {Object} props
 * @param {Array} props.cards - Array of card configuration objects
 * @param {Object} [props.dataSources] - Object mapping data source names to data arrays (for smart mode)
 * @param {boolean} [props.loading] - Whether the cards are in a loading state
 * @param {string} [props.className] - Additional CSS classes to apply to the container
 */
const CardsPanel = ({
  cards = [],
  dataSources = {},
  loading = false,
  className = ''
}) => {
  // Show loading state if requested
  if (loading) {
    return (
      <div className={`cards-panel ${className}`}>
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
        <div className="cards-panel-empty">
          <p>No statistics available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`cards-panel ${className}`}>
      <div className="cards-panel-grid">
        {cards.map((card, index) => {
          // Determine if this card is in smart mode or legacy mode
          const isSmartMode = card.dataSource && card.computation;

          if (isSmartMode) {
            // Smart mode: pass data from dataSources
            const cardData = dataSources[card.dataSource];

            return (
              <KpiCard
                key={`${card.label}-${index}`}
                data={cardData}
                dataSource={card.dataSource}
                field={card.field}
                computation={card.computation}
                computationOptions={card.computationOptions}
                formatOptions={card.formatOptions}
                label={card.label}
                icon={card.icon}
              />
            );
          } else {
            // Legacy mode: use pre-computed value
            return (
              <KpiCard
                key={`${card.label}-${index}`}
                value={card.value}
                label={card.label}
                icon={card.icon}
              />
            );
          }
        })}
      </div>
    </div>
  );
};

export default CardsPanel;

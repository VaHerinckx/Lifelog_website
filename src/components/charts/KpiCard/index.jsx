// src/components/charts/KpiCard/index.jsx
import React from 'react';
import './KpiCard.css';

/**
 * A reusable KPI card component for displaying key metrics
 *
 * @param {Object} props
 * @param {string|number} props.value - The main value to display
 * @param {string} props.label - The descriptive label for the KPI
 * @param {React.ReactNode} [props.icon] - Optional icon to display
 */
const KpiCard = ({ value, label, icon }) => {
  return (
    <div className="kpi-card">
      {icon && <div className="kpi-card-icon">{icon}</div>}
      <div className="kpi-card-value">{value}</div>
      <div className="kpi-card-label">{label}</div>
    </div>
  );
};

export default KpiCard;

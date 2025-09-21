import React, { useState } from 'react';
import { Grid, List, Utensils, Star, Clock, Scale, Tag } from 'lucide-react';
import './MealList.css';

// Component to display star ratings for meal scores
const MealRating = ({ score, size = 16 }) => {
  const normalizedScore = Math.max(0, Math.min(10, score || 0)) / 2; // Convert 0-10 to 0-5 scale
  const fullStars = Math.floor(normalizedScore);
  const hasHalfStar = normalizedScore % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="meal-rating">
      <div className="stars">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} className="star filled" size={size} fill="#EAC435" />
        ))}
        {hasHalfStar && <Star className="star half" size={size} fill="#EAC435" />}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} className="star empty" size={size} />
        ))}
      </div>
      <span className="score-text">{score ? score.toFixed(1) : '0.0'}</span>
    </div>
  );
};

// Component to display food category pills
const FoodCategoryPills = ({ foodCategories }) => {
  if (!foodCategories) return null;

  const categories = [
    { key: 'vegetables', label: 'Vegetables', color: '#22c55e' },
    { key: 'fruits', label: 'Fruits', color: '#f59e0b' },
    { key: 'meat', label: 'Meat', color: '#dc2626' },
    { key: 'fish', label: 'Fish', color: '#0ea5e9' },
    { key: 'dairy', label: 'Dairy', color: '#8b5cf6' },
    { key: 'carbs', label: 'Carbs', color: '#eab308' },
    { key: 'veggieAlternative', label: 'Veggie Alt', color: '#10b981' },
    { key: 'sauces', label: 'Sauces', color: '#f97316' },
    { key: 'sweets', label: 'Sweets', color: '#ec4899' }
  ];

  const activeCategoriesCount = categories.filter(cat => foodCategories[cat.key] === 1).length;

  return (
    <div className="food-category-pills">
      {categories
        .filter(cat => foodCategories[cat.key] === 1)
        .slice(0, 4) // Show max 4 pills to avoid clutter
        .map(cat => (
          <span 
            key={cat.key} 
            className="category-pill" 
            style={{ backgroundColor: cat.color }}
          >
            {cat.label}
          </span>
        ))}
      {activeCategoriesCount > 4 && (
        <span className="category-pill more-count">
          +{activeCategoriesCount - 4}
        </span>
      )}
    </div>
  );
};

// Component to display a meal card
const MealCard = ({ meal, onClick, viewMode }) => {
  const formatDate = (date) => {
    if (!date || !(date instanceof Date) && typeof date !== 'string') return 'Unknown date';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return 'Unknown date';
    return dateObj.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (date) => {
    if (!date || !(date instanceof Date) && typeof date !== 'string') return '';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return '';
    return dateObj.toLocaleTimeString(undefined, { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getMealTypeIcon = (mealType) => {
    switch (mealType?.toLowerCase()) {
      case 'breakfast':
        return '🌅';
      case 'lunch':
        return '☀️';
      case 'dinner':
        return '🌙';
      case 'morning snack':
        return '🥨';
      case 'afternoon snack':
        return '🍎';
      default:
        return '🍽️';
    }
  };

  const isListView = viewMode === 'list';

  return (
    <div 
      className={`meal-card ${isListView ? 'list-view' : 'grid-view'}`} 
      onClick={() => onClick && onClick(meal)}
    >
      <div className="meal-header">
        <div className="meal-type">
          <span className="meal-icon">{getMealTypeIcon(meal.mealType)}</span>
          <span className="meal-type-text">{meal.mealType || 'Unknown'}</span>
        </div>
        <div className="meal-time">
          <Clock size={14} />
          <span>{formatTime(meal.timestamp)}</span>
        </div>
      </div>

      <div className="meal-info">
        <div className="meal-date">
          {formatDate(meal.timestamp)}
        </div>

        {meal.foodList && meal.foodList.length > 0 && (
          <div className="food-items">
            <div className="food-list">
              {meal.foodList.slice(0, isListView ? 10 : 5).map((food, index) => (
                <span key={index} className="food-item">
                  {food}
                </span>
              ))}
              {meal.foodList.length > (isListView ? 10 : 5) && (
                <span className="food-item more">
                  +{meal.foodList.length - (isListView ? 10 : 5)} more
                </span>
              )}
            </div>
          </div>
        )}

        <div className="meal-details">
          <div className="meal-score-section">
            <MealRating score={meal.mealScore} size={14} />
          </div>

          {meal.amountText && meal.amountText.trim() && (
            <div className="portion-size">
              <Scale size={14} />
              <span>{meal.amountText}</span>
            </div>
          )}
        </div>

        <FoodCategoryPills foodCategories={meal.foodCategories} />
      </div>
    </div>
  );
};

const MealList = ({ meals, onMealClick }) => {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  if (!meals || meals.length === 0) {
    return (
      <div className="meal-list-empty">
        <Utensils size={48} className="empty-icon" />
        <p className="empty-message">
          No meals found with current filters. Try adjusting your filter criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="meal-list-container">
      {/* View Mode Toggle */}
      <div className="meal-list-header">
        <div className="meal-count">
          <span className="count-text">
            {meals.length} meal{meals.length !== 1 ? 's' : ''} found
          </span>
        </div>
        
        <div className="view-controls">
          <button
            className={`view-button ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Grid view"
          >
            <Grid size={18} />
          </button>
          <button
            className={`view-button ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title="List view"
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {/* Meals Grid/List */}
      <div className={`meal-list ${viewMode}-view`}>
        {meals.map((meal, index) => (
          <MealCard
            key={`${meal.timestamp}-${index}`}
            meal={meal}
            onClick={onMealClick}
            viewMode={viewMode}
          />
        ))}
      </div>
    </div>
  );
};

export default MealList;
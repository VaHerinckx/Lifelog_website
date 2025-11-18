import React, { useMemo } from 'react';
import _ from 'lodash';
import './NutritionAnalysisTab.css';

// Import existing chart components
import TimeSeriesBarChart from '../../../components/charts/TimeSeriesBarChart';
import TopChart from '../../../components/charts/TopChart';
import TreemapGenre from '../../../components/charts/TreemapGenre';

const NutritionAnalysisTab = ({ data }) => {
  // Process data for meal score timeline
  const mealScoreTimelineData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Group by date and calculate daily average meal score
    const groupedByDate = _.groupBy(data, (item) => {
      const date = new Date(item.timestamp);
      return date.toISOString().split('T')[0]; // YYYY-MM-DD format
    });

    return Object.entries(groupedByDate)
      .map(([date, meals]) => {
        const validScores = meals.filter(meal => meal.mealScore && !isNaN(meal.mealScore));
        const avgScore = validScores.length > 0 
          ? validScores.reduce((sum, meal) => sum + meal.mealScore, 0) / validScores.length
          : 0;
        
        return {
          date: new Date(date),
          value: Math.round(avgScore * 10) / 10, // Round to 1 decimal
          count: meals.length
        };
      })
      .sort((a, b) => a.date - b.date);
  }, [data]);

  // Process data for top ingredients
  const topIngredientsData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const allIngredients = [];
    data.forEach(meal => {
      if (meal.foodList && Array.isArray(meal.foodList)) {
        allIngredients.push(...meal.foodList);
      }
    });

    const ingredientCounts = _.countBy(allIngredients);
    
    return Object.entries(ingredientCounts)
      .map(([ingredient, count]) => ({
        name: ingredient,
        value: count
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 15); // Top 15 ingredients
  }, [data]);

  // Process data for food category distribution
  const foodCategoryData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const categoryNames = {
      vegetables: 'Vegetables',
      fruits: 'Fruits',
      meat: 'Meat',
      fish: 'Fish',
      dairy: 'Dairy',
      carbs: 'Carbs',
      veggieAlternative: 'Veggie Alternatives',
      sauces: 'Sauces & Spices',
      sweets: 'Sweets'
    };

    const categoryCounts = {};
    
    data.forEach(meal => {
      if (meal.foodCategories) {
        Object.entries(meal.foodCategories).forEach(([category, value]) => {
          if (value === 1) { // Category is present in this meal
            const categoryName = categoryNames[category] || category;
            categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + 1;
          }
        });
      }
    });

    return Object.entries(categoryCounts)
      .map(([name, count]) => ({
        name,
        value: count,
        // Assign colors for better visualization
        color: getColorForCategory(name)
      }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  // Process data for meal score distribution
  const mealScoreDistributionData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const scoreRanges = [
      { range: '0-1', min: 0, max: 1 },
      { range: '1-2', min: 1, max: 2 },
      { range: '2-3', min: 2, max: 3 },
      { range: '3-4', min: 3, max: 4 },
      { range: '4-5', min: 4, max: 5 },
      { range: '5-6', min: 5, max: 6 },
      { range: '6-7', min: 6, max: 7 },
      { range: '7-8', min: 7, max: 8 },
      { range: '8-9', min: 8, max: 9 },
      { range: '9-10', min: 9, max: 10 }
    ];

    return scoreRanges.map(({ range, min, max }) => {
      const count = data.filter(meal => {
        const score = meal.mealScore || 0;
        return score >= min && score < max + 0.1; // Small epsilon for inclusive upper bound
      }).length;

      return {
        name: range,
        value: count
      };
    }).filter(item => item.value > 0); // Only show ranges with data
  }, [data]);

  // Process data for portion size distribution
  const portionSizeData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const validPortions = data
      .filter(meal => meal.amountText && meal.amountText.trim() !== '')
      .map(meal => meal.amountText);

    const portionCounts = _.countBy(validPortions);
    
    return Object.entries(portionCounts)
      .map(([portion, count]) => ({
        name: portion,
        value: count
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10 portion sizes
  }, [data]);

  // Process data for weekly nutrition balance
  const weeklyNutritionData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Group by week
    const groupedByWeek = _.groupBy(data, (item) => {
      const date = new Date(item.timestamp);
      const startOfWeek = new Date(date);
      startOfWeek.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
      return startOfWeek.toISOString().split('T')[0];
    });

    return Object.entries(groupedByWeek)
      .map(([weekStart, meals]) => {
        const weekData = { week: weekStart };
        
        // Count each food category for this week
        const categoryCounts = {
          vegetables: 0,
          fruits: 0,
          meat: 0,
          fish: 0,
          dairy: 0,
          carbs: 0,
          veggieAlternative: 0,
          sauces: 0,
          sweets: 0
        };

        meals.forEach(meal => {
          if (meal.foodCategories) {
            Object.entries(meal.foodCategories).forEach(([category, value]) => {
              if (value === 1 && categoryCounts.hasOwnProperty(category)) {
                categoryCounts[category]++;
              }
            });
          }
        });

        // Add category counts to week data
        Object.entries(categoryCounts).forEach(([category, count]) => {
          weekData[category] = count;
        });

        return weekData;
      })
      .sort((a, b) => new Date(a.week) - new Date(b.week))
      .slice(-12); // Last 12 weeks
  }, [data]);

  // Helper function to get colors for food categories
  function getColorForCategory(categoryName) {
    const colorMap = {
      'Vegetables': '#22c55e',
      'Fruits': '#f59e0b',
      'Meat': '#dc2626',
      'Fish': '#0ea5e9',
      'Dairy': '#8b5cf6',
      'Carbs': '#eab308',
      'Veggie Alternatives': '#10b981',
      'Sauces & Spices': '#f97316',
      'Sweets': '#ec4899'
    };
    return colorMap[categoryName] || '#6b7280';
  }

  if (!data || data.length === 0) {
    return (
      <div className="analysis-tab-container">
        <div className="analysis-empty-state">
          <p>No data available with current filters. Try adjusting your filter criteria.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analysis-tab-container">
      <div className="analysis-charts-grid">
        {/* Daily Meal Score Trend */}
        <div className="analysis-chart-section">
          <TimeSeriesBarChart
            data={mealScoreTimelineData}
            title="Daily Average Meal Score"
            xAxisDataKey="date"
            yAxisDataKey="value"
            color="#3423A6"
            valueFormatter={(value) => `${value}/10`}
          />
        </div>

        {/* Top Ingredients */}
        <div className="analysis-chart-section">
          <TopChart
            data={topIngredientsData}
            title="Most Frequent Ingredients"
            color="#FB4B4E"
          />
        </div>

        {/* Food Category Distribution */}
        <div className="analysis-chart-section">
          <TreemapGenre
            data={foodCategoryData}
            title="Food Category Distribution"
          />
        </div>

        {/* Meal Score Distribution */}
        <div className="analysis-chart-section">
          <TopChart
            data={mealScoreDistributionData}
            title="Meal Score Distribution"
            color="#8b5cf6"
            layout="horizontal"
          />
        </div>

        {/* Portion Size Distribution */}
        <div className="analysis-chart-section">
          <TopChart
            data={portionSizeData}
            title="Portion Size Distribution"
            color="#10b981"
            layout="horizontal"
          />
        </div>

        {/* Weekly Nutrition Balance - placeholder for now */}
        <div className="analysis-chart-section">
          <div className="chart-container-base">
            <h3 className="chart-title">Weekly Nutrition Balance</h3>
            <div className="chart-placeholder">
              <p>Weekly nutrition balance chart coming soon</p>
              <p>{weeklyNutritionData.length} weeks of data available</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NutritionAnalysisTab;
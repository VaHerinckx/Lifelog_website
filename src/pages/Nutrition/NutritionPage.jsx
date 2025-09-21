import React, { useState, useEffect } from 'react';
import { Utensils, BarChart, Calendar, Tag, User, Scale, Clock, TrendingUp } from 'lucide-react';
import _ from 'lodash';
import './NutritionPage.css';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useData } from '../../context/DataContext';

// Import components
import NutritionAnalysisTab from './components/NutritionAnalysisTab';
import MealList from './components/MealList';
import CardsPanel from '../../components/ui/CardsPanel/CardsPanel';
import FilteringPanel from '../../components/ui/Filters/FilteringPanel/FilteringPanel';

const NutritionPage = () => {
  const { data, loading, error, fetchData } = useData();
  
  // State for filters
  const [filters, setFilters] = useState({});
  const [filteredData, setFilteredData] = useState([]);
  const [selectedMeal, setSelectedMeal] = useState(null);
  
  // State for tab management
  const [activeTab, setActiveTab] = useState('meals');
  
  // State for nutrition stats
  const [nutritionStats, setNutritionStats] = useState({
    totalMeals: 0,
    averageMealScore: 0,
    favoriteIngredient: 'N/A',
    mostCommonPortionSize: 'N/A'
  });

  // Generate unique ingredients list from all meals
  const getUniqueIngredients = (nutritionData) => {
    if (!nutritionData || nutritionData.length === 0) return [];
    
    const allIngredients = new Set();
    nutritionData.forEach(meal => {
      if (meal.foodList && Array.isArray(meal.foodList)) {
        meal.foodList.forEach(ingredient => {
          if (ingredient && ingredient.trim()) {
            allIngredients.add(ingredient.trim());
          }
        });
      }
    });
    
    return Array.from(allIngredients).sort();
  };

  // Define filter configurations for FilteringPanel
  const filterConfigs = [
    {
      key: 'dateRange',
      type: 'daterange',
      label: 'Date Range',
      dataField: 'timestamp',
      icon: <Calendar size={16} />,
      placeholder: 'Select date range'
    },
    {
      key: 'mealTypes',
      type: 'multiselect',
      label: 'Meal Types',
      optionsSource: 'mealType',
      dataField: 'mealType',
      icon: <Utensils size={16} />,
      placeholder: 'Select meal types',
      searchPlaceholder: 'Search meal types...'
    },
    {
      key: 'mealScoreRange',
      type: 'range',
      label: 'Meal Score',
      dataField: 'mealScore',
      icon: <TrendingUp size={16} />,
      placeholder: 'Select score range',
      min: 0,
      max: 10,
      step: 0.1
    },
    {
      key: 'portionSizes',
      type: 'multiselect',
      label: 'Portion Sizes',
      optionsSource: 'amountText',
      dataField: 'amountText',
      icon: <Scale size={16} />,
      placeholder: 'Select portion sizes',
      searchPlaceholder: 'Search portion sizes...'
    },
    {
      key: 'ingredients',
      type: 'multiselect',
      label: 'Ingredients',
      optionsSource: 'static',
      options: data.nutrition ? getUniqueIngredients(data.nutrition) : [],
      dataField: 'foodList',
      icon: <Tag size={16} />,
      placeholder: 'Select ingredients',
      searchPlaceholder: 'Search ingredients...',
      isArrayField: true
    }
  ];

  // Fetch nutrition data when component mounts
  useEffect(() => {
    fetchData('nutrition');
  }, [fetchData]);

  // Apply filters whenever filters or data change
  useEffect(() => {
    if (!data.nutrition || data.nutrition.length === 0) {
      setFilteredData([]);
      return;
    }

    let filtered = [...data.nutrition];

    // Apply date range filter
    if (filters.dateRange) {
      const { startDate, endDate } = filters.dateRange;
      filtered = filtered.filter(item => {
        if (!item.timestamp) return false;
        const itemDate = new Date(item.timestamp);
        
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          if (itemDate < start) return false;
        }
        
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (itemDate > end) return false;
        }
        
        return true;
      });
    }

    // Apply meal type filter
    if (filters.mealTypes && Array.isArray(filters.mealTypes) && filters.mealTypes.length > 0) {
      filtered = filtered.filter(item => filters.mealTypes.includes(item.mealType));
    }

    // Apply meal score range filter
    if (filters.mealScoreRange) {
      const { min, max } = filters.mealScoreRange;
      filtered = filtered.filter(item => {
        const score = item.mealScore || 0;
        return score >= min && score <= max;
      });
    }

    // Apply portion size filter
    if (filters.portionSizes && Array.isArray(filters.portionSizes) && filters.portionSizes.length > 0) {
      filtered = filtered.filter(item => filters.portionSizes.includes(item.amountText));
    }

    // Apply ingredients filter
    if (filters.ingredients && Array.isArray(filters.ingredients) && filters.ingredients.length > 0) {
      filtered = filtered.filter(item => {
        if (!item.foodList || !Array.isArray(item.foodList)) return false;
        return filters.ingredients.some(ingredient => item.foodList.includes(ingredient));
      });
    }

    // Sort by timestamp in descending order (newest first)
    filtered.sort((a, b) => {
      const dateA = new Date(a.timestamp);
      const dateB = new Date(b.timestamp);
      return dateB - dateA; // Descending order
    });

    setFilteredData(filtered);
  }, [data.nutrition, filters]);

  // Calculate nutrition stats whenever filtered data changes
  useEffect(() => {
    if (!filteredData.length) {
      setNutritionStats({
        totalMeals: 0,
        averageMealScore: 0,
        favoriteIngredient: 'N/A',
        mostCommonPortionSize: 'N/A'
      });
      return;
    }

    const totalMeals = filteredData.length;
    
    // Calculate average meal score
    const validScores = filteredData.filter(item => item.mealScore && !isNaN(item.mealScore));
    const averageMealScore = validScores.length > 0 
      ? validScores.reduce((sum, item) => sum + item.mealScore, 0) / validScores.length 
      : 0;

    // Find favorite ingredient
    const allIngredients = [];
    filteredData.forEach(item => {
      if (item.foodList && Array.isArray(item.foodList)) {
        allIngredients.push(...item.foodList);
      }
    });
    const ingredientCounts = _.countBy(allIngredients);
    const favoriteIngredient = Object.keys(ingredientCounts).length > 0 
      ? Object.keys(ingredientCounts).reduce((a, b) => ingredientCounts[a] > ingredientCounts[b] ? a : b)
      : 'N/A';

    // Find most common portion size
    const portionSizes = filteredData
      .filter(item => item.amountText && item.amountText.trim() !== '')
      .map(item => item.amountText);
    const portionCounts = _.countBy(portionSizes);
    const mostCommonPortionSize = Object.keys(portionCounts).length > 0
      ? Object.keys(portionCounts).reduce((a, b) => portionCounts[a] > portionCounts[b] ? a : b)
      : 'N/A';

    setNutritionStats({
      totalMeals,
      averageMealScore: Math.round(averageMealScore * 10) / 10,
      favoriteIngredient,
      mostCommonPortionSize
    });
  }, [filteredData]);

  // Handle filter changes from FilteringPanel
  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  // Generate summary cards data
  const generateCardsData = () => {
    return [
      {
        value: nutritionStats.totalMeals.toLocaleString(),
        label: "Total Meals Logged",
        icon: <Utensils size={24} />
      },
      {
        value: nutritionStats.averageMealScore > 0 ? nutritionStats.averageMealScore.toFixed(1) : 'N/A',
        label: "Average Meal Score",
        icon: <TrendingUp size={24} />
      },
      {
        value: nutritionStats.favoriteIngredient,
        label: "Favorite Ingredient",
        icon: <Tag size={24} />
      },
      {
        value: nutritionStats.mostCommonPortionSize,
        label: "Most Common Portion",
        icon: <Scale size={24} />
      }
    ];
  };

  const cardsData = generateCardsData();

  // Loading state
  if (loading.nutrition) {
    return <LoadingSpinner centerIcon={Utensils} />;
  }

  // Error state
  if (error.nutrition) {
    return (
      <div className="page-container">
        <div className="page-content">
          <h1>Nutrition Dashboard</h1>
          <div className="error">
            Error loading nutrition data: {error.nutrition}
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (!data.nutrition || data.nutrition.length === 0) {
    return (
      <div className="page-container">
        <div className="page-content">
          <h1>Nutrition Dashboard</h1>
          <div className="empty-state">
            <Utensils size={48} className="empty-state-icon" />
            <p className="empty-state-message">
              No nutrition data available. Nutrition data will appear here once it's processed and uploaded.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-content">
        <h1>Nutrition Dashboard</h1>
        <p className="page-description">Track your meals, ingredients, and eating patterns over time</p>

        {/* Tab Navigation - matching Reading page structure */}
        <div className="page-tabs">
          <button
            className={`page-tab ${activeTab === 'meals' ? 'active' : ''}`}
            onClick={() => setActiveTab('meals')}
          >
            <Utensils size={18} style={{ marginRight: '8px' }} />
            Meals
          </button>
          <button
            className={`page-tab ${activeTab === 'analysis' ? 'active' : ''}`}
            onClick={() => setActiveTab('analysis')}
          >
            <BarChart size={18} style={{ marginRight: '8px' }} />
            Analysis
          </button>
        </div>

        {/* Filters - positioned after tabs like Reading page */}
        <FilteringPanel
          data={data.nutrition}
          filterConfigs={filterConfigs}
          onFiltersChange={handleFiltersChange}
          title="Nutrition Filters"
          description="Filter your nutrition data by date, meal type, score, and ingredients"
        />

        {/* Meals Tab Content */}
        {activeTab === 'meals' && (
          <>
            <div className="meal-count">
              {filteredData.length} {filteredData.length === 1 ? 'meal' : 'meals'} found
            </div>

            <CardsPanel
              title="Nutrition Statistics"
              description="Your nutrition metrics at a glance"
              cards={cardsData}
              loading={loading.nutrition}
            />

            <MealList
              meals={filteredData}
              onMealClick={setSelectedMeal}
            />
          </>
        )}

        {/* Analysis Tab Content */}
        {activeTab === 'analysis' && (
          <NutritionAnalysisTab data={filteredData} />
        )}
      </div>
    </div>
  );
};

export default NutritionPage;
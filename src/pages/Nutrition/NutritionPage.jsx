import { useState, useEffect, useMemo } from 'react';
import { Utensils, List, Grid, Clock, Calendar, MapPin, Tag } from 'lucide-react';
import { useData } from '../../context/DataContext';

// Import components
import MealDetails from './components/MealDetails';
import MealCard from './components/MealCard';
import FilteringPanel from '../../components/ui/Filters/FilteringPanel/FilteringPanel';
import Filter from '../../components/ui/Filters/Filter/Filter';

// Import standardized components
import PageWrapper from '../../components/ui/PageWrapper/PageWrapper';
import PageHeader from '../../components/ui/PageHeader';
import TabNavigation from '../../components/ui/TabNavigation';
import ContentTab from '../../components/ui/ContentTab/ContentTab';
import AnalysisTab from '../../components/ui/AnalysisTab/AnalysisTab';
import KPICardsPanel from '../../components/ui/KPICardsPanel/KPICardsPanel';
import ContentCardsGroup from '../../components/ui/ContentCardsGroup';
import KpiCard from '../../components/charts/KpiCard/index';

// Import chart components for analysis tab
import TimeSeriesBarChart from '../../components/charts/TimeSeriesBarChart';

// Import utilities
import { sortByDateSafely } from '../../utils/sortingUtils';

const NutritionPage = () => {
  console.log('🥗 NutritionPage component mounting/rendering');

  const { data, loading, error, fetchData } = useData();
  const [nutritionItems, setNutritionItems] = useState([]); // Item-level data
  const [meals, setMeals] = useState([]); // Meal-level data (grouped by meal_id)
  const [filteredMeals, setFilteredMeals] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]); // For ingredient-level KPIs

  const [viewMode, setViewMode] = useState('grid');
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [activeTab, setActiveTab] = useState('content');

  // Fetch nutrition data when component mounts
  useEffect(() => {
    console.log('🥗 NutritionPage useEffect - fetching data');

    if (typeof fetchData === 'function') {
      fetchData('nutrition');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Process nutrition data when it's loaded
  useEffect(() => {
    if (data?.nutrition) {
      console.log('🥗 Raw nutrition data:', data.nutrition.slice(0, 3));

      // Process items: convert date strings to Date objects
      const processedItems = data.nutrition.map(item => ({
        ...item,
        date: item.date ? new Date(item.date) : null,
        meal_id: String(item.meal_id), // Ensure meal_id is string for grouping
        food_quantity: parseFloat(item.food_quantity) || 0,
        drink_quantity: parseFloat(item.drink_quantity) || 0,
        usda_meal_score: parseFloat(item.usda_meal_score) || 0,
        meal_assessment: parseFloat(item.meal_assessment) || 0,
        amount: parseFloat(item.amount) || 0,
      }));

      console.log('🥗 Processed items:', processedItems.slice(0, 3));

      // Group items by meal_id to create meal-level data
      const mealMap = new Map();

      processedItems.forEach(item => {
        const mealId = item.meal_id;

        if (!mealMap.has(mealId)) {
          // First occurrence of this meal_id - use this item's meal-level data
          mealMap.set(mealId, {
            meal_id: mealId,
            date: item.date,
            weekday: item.weekday,
            time: item.time,
            meal: item.meal,
            food_list: item.food_list,
            drinks_list: item.drinks_list,
            usda_meal_score: item.usda_meal_score,
            places: item.places,
            origin: item.origin,
            amount: item.amount,
            amount_text: item.amount_text,
            meal_assessment: item.meal_assessment,
            meal_assessment_text: item.meal_assessment_text,
          });
        }
      });

      const groupedMeals = Array.from(mealMap.values());

      // Sort meals by date and time (most recent first)
      groupedMeals.sort((a, b) => {
        // First compare dates
        const dateCompare = b.date - a.date;
        if (dateCompare !== 0) return dateCompare;

        // If dates are the same, compare times
        // Parse time strings (HH:MM format) for comparison
        const timeA = a.time ? a.time.split(':').map(Number) : [0, 0];
        const timeB = b.time ? b.time.split(':').map(Number) : [0, 0];
        const minutesA = timeA[0] * 60 + timeA[1];
        const minutesB = timeB[0] * 60 + timeB[1];

        return minutesB - minutesA; // Most recent time first
      });

      console.log('🥗 Grouped meals:', groupedMeals.length, 'meals from', processedItems.length, 'items');
      console.log('🥗 First 3 meals (sorted):', groupedMeals.slice(0, 3));

      setNutritionItems(processedItems);
      setMeals(groupedMeals);
      setFilteredMeals(groupedMeals);
      setFilteredItems(processedItems);
    }
  }, [data?.nutrition]);

  // Apply filters when FilteringPanel filters change
  const handleFiltersChange = (filteredDataSources) => {
    console.log('🥗 Filters changed:', filteredDataSources);

    const filteredNutritionItems = filteredDataSources.nutrition || [];

    // Group filtered items by meal_id
    const mealMap = new Map();

    filteredNutritionItems.forEach(item => {
      const mealId = String(item.meal_id);

      if (!mealMap.has(mealId)) {
        mealMap.set(mealId, {
          meal_id: mealId,
          date: item.date,
          weekday: item.weekday,
          time: item.time,
          meal: item.meal,
          food_list: item.food_list,
          drinks_list: item.drinks_list,
          usda_meal_score: item.usda_meal_score,
          places: item.places,
          origin: item.origin,
          amount: item.amount,
          amount_text: item.amount_text,
          meal_assessment: item.meal_assessment,
          meal_assessment_text: item.meal_assessment_text,
        });
      }
    });

    const groupedFilteredMeals = Array.from(mealMap.values());

    // Sort filtered meals by date (most recent first)
    const sortedMeals = sortByDateSafely(groupedFilteredMeals, 'date');

    console.log('🥗 Filtered meals:', sortedMeals.length);

    setFilteredMeals(sortedMeals);
    setFilteredItems(filteredNutritionItems); // Store filtered items for KPI calculations
  };

  const handleMealClick = (meal) => {
    setSelectedMeal(meal);
  };

  const handleCloseDetails = () => {
    setSelectedMeal(null);
  };

  // Memoize data object to prevent FilteringPanel re-renders
  const filterPanelData = useMemo(() => ({
    nutrition: nutritionItems // Pass item-level data for filtering
  }), [nutritionItems]);

  return (
    <PageWrapper
      error={error?.nutrition}
      errorTitle="Nutrition Tracker"
    >
      {/* Page Header */}
      <PageHeader
        title="Nutrition Tracker"
        description="Track meals, food choices, and nutritional patterns across breakfast, lunch, dinner, and snacks"
      />

        {!loading?.nutrition && (
          <>
            {/* FilteringPanel with Filter children */}
            <FilteringPanel
              data={filterPanelData}
              onFiltersChange={handleFiltersChange}
            >
              <Filter
                type="multiselect"
                label="Meal Type"
                field="meal"
                icon={<Utensils />}
                placeholder="Select meal types"
                dataSources={['nutrition']}
              />
              <Filter
                type="daterange"
                label="Date Range"
                field="date"
                icon={<Calendar />}
                dataSources={['nutrition']}
              />
              <Filter
                type="multiselect"
                label="Location"
                field="places"
                icon={<MapPin />}
                placeholder="Select locations"
                dataSources={['nutrition']}
              />
              <Filter
                type="multiselect"
                label="Origin"
                field="origin"
                icon={<Tag />}
                placeholder="Select meal origins"
                dataSources={['nutrition']}
              />
              <Filter
                type="multiselect"
                label="Foods"
                field="food"
                icon={<Utensils />}
                placeholder="Select individual foods"
                dataSources={['nutrition']}
              />
              <Filter
                type="multiselect"
                label="Drinks"
                field="drink"
                icon={<Utensils />}
                placeholder="Select individual drinks"
                dataSources={['nutrition']}
              />
            </FilteringPanel>

            {/* Statistics Cards with KpiCard children */}
            <KPICardsPanel
              dataSources={{
                nutrition: filteredMeals, // Use meal-level data for meal-based KPIs
                nutritionItems: filteredItems // Use item-level data for ingredient KPIs
              }}
              loading={loading?.nutrition}
            >
              <KpiCard
                dataSource="nutrition"
                computation="count"
                label="Total Meals"
                icon={<Utensils />}
              />
              <KpiCard
                dataSource="nutrition"
                field="usda_meal_score"
                computation="average"
                computationOptions={{ decimals: 2, filterZeros: false }}
                label="Avg USDA Score"
                icon={<Tag />}
              />
              <KpiCard
                dataSource="nutritionItems"
                field="food_quantity"
                computation="sum"
                computationOptions={{ decimals: 0 }}
                label="Total Food Items"
                icon={<Utensils />}
              />
              <KpiCard
                dataSource="nutritionItems"
                field="drink_quantity"
                computation="sum"
                computationOptions={{ decimals: 0 }}
                label="Total Drink Items"
                icon={<Utensils />}
              />
            </KPICardsPanel>

            {/* Tab Navigation */}
            <TabNavigation
              contentLabel="Meals"
              contentIcon={Utensils}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </>
        )}

        {/* Meals Tab Content */}
        {activeTab === 'content' && (
          <ContentTab
            loading={loading?.nutrition}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            viewModes={[
              { mode: 'grid', icon: Grid },
              { mode: 'list', icon: List }
            ]}
            items={filteredMeals}
            loadingIcon={Utensils}
            emptyState={{
              icon: Utensils,
              title: "No meals found",
              message: "No meals match your current filters. Try adjusting your criteria."
            }}
            renderGrid={(meals) => (
              <ContentCardsGroup
                items={meals}
                viewMode="grid"
                renderItem={(meal) => (
                  <MealCard
                    key={meal.meal_id}
                    meal={meal}
                    viewMode="grid"
                    onClick={handleMealClick}
                  />
                )}
              />
            )}
            renderList={(meals) => (
              <ContentCardsGroup
                items={meals}
                viewMode="list"
                renderItem={(meal) => (
                  <MealCard
                    key={`list-${meal.meal_id}`}
                    meal={meal}
                    viewMode="list"
                    onClick={handleMealClick}
                  />
                )}
              />
            )}
          />
        )}

        {/* Analysis Tab Content */}
        {activeTab === 'analysis' && (
          <AnalysisTab
            data={filteredItems}
            emptyState={{
              message: "No nutrition data available with current filters. Try adjusting your criteria."
            }}
            renderCharts={(items) => (
              <>
                <TimeSeriesBarChart
                  data={items}
                  dateColumnName="date"
                  metricOptions={[
                    { value: 'meals', label: 'Number of Meals', aggregation: 'countUnique', field: 'meal_id', decimals: 0 }
                  ]}
                  defaultMetric="meals"
                  title="Meals Over Time"
                />
              </>
            )}
          />
        )}

      {/* Meal Details Modal */}
      {selectedMeal && (
        <MealDetails meal={selectedMeal} onClose={handleCloseDetails} />
      )}
    </PageWrapper>
  );
};

export default NutritionPage;

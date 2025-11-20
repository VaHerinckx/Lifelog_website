import { useState, useEffect, useMemo, useCallback } from 'react';
import { Utensils, List, Grid, Calendar, MapPin, Tag } from 'lucide-react';
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

// Helper function to parse time string to minutes for efficient sorting
const parseTimeToMinutes = (timeString) => {
  if (!timeString) return 0;
  const [hours, minutes] = timeString.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
};

const NutritionPage = () => {
  console.log('🥗 NutritionPage component mounting/rendering');

  const { data, loading, error, fetchData } = useData();
  const [meals, setMeals] = useState([]); // Meal-level data (pre-grouped from CSV)
  const [nutritionItems, setNutritionItems] = useState([]); // Item-level data (for ingredient filtering)
  const [filteredMeals, setFilteredMeals] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]); // For ingredient-level KPIs

  const [viewMode, setViewMode] = useState('grid');
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [activeTab, setActiveTab] = useState('content');

  // Fetch nutrition data when component mounts (dual-file strategy like Reading page)
  useEffect(() => {
    console.log('🥗 NutritionPage useEffect - fetching dual data sources');

    if (typeof fetchData === 'function') {
      Promise.all([
        fetchData('nutritionMeals'),
        fetchData('nutritionItems')
      ]);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Process meals data when loaded (pre-grouped from CSV)
  useEffect(() => {
    if (data?.nutritionMeals && data?.nutritionItems) {
      console.log('🥗 Raw nutrition meals:', data.nutritionMeals.slice(0, 3));
      console.log('🥗 Raw nutrition items:', data.nutritionItems.slice(0, 3));

      // Process meals: convert dates and parse numbers
      const processedMeals = data.nutritionMeals.map(meal => ({
        ...meal,
        date: meal.date ? new Date(meal.date) : null,
        meal_id: String(meal.meal_id),
        usda_meal_score: parseFloat(meal.usda_meal_score) || 0,
        meal_assessment: parseFloat(meal.meal_assessment) || 0,
        amount: parseFloat(meal.amount) || 0,
        timeInMinutes: parseTimeToMinutes(meal.time), // Pre-compute for efficient sorting
      }));

      // Process items: convert dates and parse numbers
      const processedItems = data.nutritionItems.map(item => ({
        ...item,
        date: item.date ? new Date(item.date) : null,
        meal_id: String(item.meal_id),
        food_quantity: parseFloat(item.food_quantity) || 0,
        drink_quantity: parseFloat(item.drink_quantity) || 0,
        usda_meal_score: parseFloat(item.usda_meal_score) || 0,
        meal_assessment: parseFloat(item.meal_assessment) || 0,
        amount: parseFloat(item.amount) || 0,
        timeInMinutes: parseTimeToMinutes(item.time),
      }));

      console.log('🥗 Processed meals:', processedMeals.length);
      console.log('🥗 Processed items:', processedItems.length);

      // Data already sorted by Python, just set in state
      setMeals(processedMeals);
      setFilteredMeals(processedMeals);
      setNutritionItems(processedItems);
      setFilteredItems(processedItems);
    }
  }, [data?.nutritionMeals, data?.nutritionItems]);

  // Apply filters when FilteringPanel filters change (dual-file strategy)
  // Wrapped in useCallback to prevent unnecessary re-renders
  const handleFiltersChange = useCallback((filteredDataSources) => {
    console.log('🥗 Filters changed:', filteredDataSources);

    const filteredMealsData = filteredDataSources.nutritionMeals || [];
    const filteredItemsData = filteredDataSources.nutritionItems || [];

    // Sort filtered meals by date and time (most recent first)
    const sortedMeals = filteredMealsData.sort((a, b) => {
      const dateCompare = b.date - a.date;
      if (dateCompare !== 0) return dateCompare;
      return b.timeInMinutes - a.timeInMinutes;
    });

    console.log('🥗 Filtered meals:', sortedMeals.length);
    console.log('🥗 Filtered items:', filteredItemsData.length);

    setFilteredMeals(sortedMeals);
    setFilteredItems(filteredItemsData); // Store filtered items for KPI calculations
  }, []);

  const handleMealClick = useCallback((meal) => {
    setSelectedMeal(meal);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setSelectedMeal(null);
  }, []);

  // Memoize data object to prevent FilteringPanel re-renders (dual-file strategy)
  const filterPanelData = useMemo(() => ({
    nutritionMeals: meals,        // Pass meal-level data for meal filters (4,604 rows)
    nutritionItems: nutritionItems // Pass item-level data for ingredient filters (14,693 rows)
  }), [meals, nutritionItems]);

  return (
    <PageWrapper
      error={error?.nutritionMeals || error?.nutritionItems}
      errorTitle="Nutrition Tracker"
    >
      {/* Page Header */}
      <PageHeader
        title="Nutrition Tracker"
        description="Track meals, food choices, and nutritional patterns across breakfast, lunch, dinner, and snacks"
      />

        {!(loading?.nutritionMeals || loading?.nutritionItems) && (
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
                dataSources={['nutritionMeals', 'nutritionItems']}
              />
              <Filter
                type="daterange"
                label="Date Range"
                field="date"
                icon={<Calendar />}
                dataSources={['nutritionMeals', 'nutritionItems']}
              />
              <Filter
                type="multiselect"
                label="Location"
                field="places"
                icon={<MapPin />}
                placeholder="Select locations"
                dataSources={['nutritionMeals', 'nutritionItems']}
              />
              <Filter
                type="multiselect"
                label="Origin"
                field="origin"
                icon={<Tag />}
                placeholder="Select meal origins"
                dataSources={['nutritionMeals', 'nutritionItems']}
              />
              <Filter
                type="multiselect"
                label="Foods"
                field="food"
                icon={<Utensils />}
                placeholder="Select individual foods"
                dataSources={['nutritionItems']}
              />
              <Filter
                type="multiselect"
                label="Drinks"
                field="drink"
                icon={<Utensils />}
                placeholder="Select individual drinks"
                dataSources={['nutritionItems']}
              />
            </FilteringPanel>

            {/* Statistics Cards with KpiCard children */}
            <KPICardsPanel
              dataSources={{
                nutrition: filteredMeals, // Use meal-level data for meal-based KPIs
                nutritionItems: filteredItems // Use item-level data for ingredient KPIs
              }}
              loading={loading?.nutritionMeals || loading?.nutritionItems}
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
            loading={loading?.nutritionMeals || loading?.nutritionItems}
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

import { useState, useEffect, useMemo } from 'react';
import { Activity, List, Grid, Calendar, Moon, Heart, MapPin } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { usePageTitle } from '../../hooks/usePageTitle';

// Import components
import HealthDetails from './components/HealthDetails';
import HealthCard from './components/HealthCard';

// Import standardized UI components
import {
  FilteringPanel,
  Filter,
  PageWrapper,
  PageHeader,
  TabNavigation,
  ContentTab,
  AnalysisTab,
  KPICardsPanel,
  ContentCardsGroup
} from '../../components/ui';
import KpiCard from '../../components/charts/KpiCard';

// Import chart components for analysis tab
import TimeSeriesBarChart from '../../components/charts/TimeSeriesBarChart';
import IntensityHeatmap from '../../components/charts/IntensityHeatmap';

const HealthPage = () => {
  usePageTitle('Health');
  const { data, loading, error, fetchData } = useData();
  const [healthDays, setHealthDays] = useState([]);
  const [filteredHealthDays, setFilteredHealthDays] = useState([]);
  const [healthHourly, setHealthHourly] = useState([]);
  const [filteredHealthHourly, setFilteredHealthHourly] = useState([]);
  const [healthLocations, setHealthLocations] = useState([]);
  const [filteredHealthLocations, setFilteredHealthLocations] = useState([]);
  const [isProcessing, setIsProcessing] = useState(true);

  const [viewMode, setViewMode] = useState('grid');
  const [selectedDay, setSelectedDay] = useState(null);
  const [activeTab, setActiveTab] = useState('content');

  // Fetch health data when component mounts
  useEffect(() => {
    if (typeof fetchData === 'function') {
      fetchData('health');
      fetchData('healthHourly');
      fetchData('healthLocations');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Process health data when it's loaded
  useEffect(() => {
    if (data?.health) {
      setIsProcessing(true);

      // Convert date strings to Date objects for JavaScript date operations
      // Filter out entries with invalid dates
      const processedDays = data.health
        .map(day => ({
          ...day,
          date: day.date ? new Date(day.date) : null
        }))
        .filter(day => day.date !== null && !isNaN(day.date.getTime()));

      // ContentTab now handles sorting internally
      setHealthDays(processedDays);
      setFilteredHealthDays(processedDays);
      setIsProcessing(false);
      }
  }, [data?.health]);

  // Process hourly health data when it's loaded
  useEffect(() => {
    if (data?.healthHourly) {
      // Convert datetime strings to Date objects
      const processedHours = data.healthHourly
        .map(hour => ({
          ...hour,
          datetime: hour.datetime ? new Date(hour.datetime) : null
        }))
        .filter(hour => hour.datetime !== null && !isNaN(hour.datetime.getTime()));

      setHealthHourly(processedHours);
    }
  }, [data?.healthHourly]);

  // Process locations data when it's loaded
  useEffect(() => {
    if (data?.healthLocations) {
      // Convert datetime strings to Date objects
      const processedLocations = data.healthLocations
        .map(loc => ({
          ...loc,
          datetime: loc.datetime ? new Date(loc.datetime) : null,
          date: loc.date ? new Date(loc.date) : null
        }))
        .filter(loc => loc.datetime !== null && !isNaN(loc.datetime.getTime()));

      setHealthLocations(processedLocations);
    }
  }, [data?.healthLocations]);

  // Apply filters when FilteringPanel filters change
  const handleFiltersChange = (filteredDataSources) => {
    // ContentTab now handles sorting internally
    setFilteredHealthDays(filteredDataSources.health || []);
    setFilteredHealthHourly(filteredDataSources.healthHourly || []);
    setFilteredHealthLocations(filteredDataSources.healthLocations || []);
  };

  const handleCardClick = (day) => {
    setSelectedDay(day);
  };

  const handleCloseDetails = () => {
    setSelectedDay(null);
  };

  // Memoize data object to prevent FilteringPanel re-renders
  // Include all data sources so they can all be filtered consistently
  const filterPanelData = useMemo(() => ({
    health: healthDays,
    healthHourly: healthHourly,
    healthLocations: healthLocations
  }), [healthDays, healthHourly, healthLocations]);

  return (
    <PageWrapper
      error={error?.health}
      errorTitle="Health Tracker"
    >
      {/* Page Header */}
      <PageHeader
        title="Health"
        description="Track your daily activity, sleep patterns, and overall wellness"
      />

        {!loading?.health && !isProcessing && (
          <>
            {/* FilteringPanel with Filter children */}
            <FilteringPanel
              data={filterPanelData}
              onFiltersChange={handleFiltersChange}
            >
              <Filter
                type="daterange"
                label="Date"
                field="date"
                fieldMap={{
                  health: 'date',
                  healthHourly: 'datetime',
                  healthLocations: 'datetime'
                }}
                icon={<Calendar />}
                dataSources={['health', 'healthHourly', 'healthLocations']}
              />
              <Filter
                type="multiselect"
                label="Sleep Quality"
                field="sleep_quality_text"
                icon={<Moon />}
                placeholder="Select quality"
                dataSources={['health']}
              />
              <Filter
                type="multiselect"
                label="Overall Evaluation"
                field="overall_evaluation"
                icon={<Heart />}
                placeholder="Select rating"
                dataSources={['health']}
              />
              <Filter
                type="multiselect"
                label="Location"
                field="dominant_city"
                icon={<MapPin />}
                placeholder="Select location"
                dataSources={['health']}
              />
            </FilteringPanel>

            {/* Statistics Cards with KpiCard children */}
            <KPICardsPanel
              dataSources={{
                health: filteredHealthDays
              }}
              loading={loading?.health}
            >
              <KpiCard
                dataSource="health"
                metricOptions={{
                  label: 'Days Tracked',
                  aggregation: 'count'
                }}
                icon={<Calendar />}
              />
              <KpiCard
                dataSource="health"
                metricOptions={{
                  label: 'Avg. Daily Steps',
                  aggregation: 'average',
                  field: 'daily_steps',
                  decimals: 0,
                  filterConditions: [{ field: 'daily_steps', operator: '>', value: 0 }]
                }}
                icon={<Activity />}
              />
              <KpiCard
                dataSource="health"
                metricOptions={{
                  label: 'Avg. Active Energy (kcal)',
                  aggregation: 'average',
                  field: 'daily_active_energy',
                  decimals: 0,
                  filterConditions: [{ field: 'daily_active_energy', operator: '>', value: 0 }]
                }}
                icon={<Heart />}
              />
              <KpiCard
                dataSource="health"
                metricOptions={{
                  label: 'Avg. Sleep (min)',
                  aggregation: 'average',
                  field: 'sleep_minutes',
                  decimals: 0,
                  filterConditions: [{ field: 'sleep_minutes', operator: '>', value: 0 }]
                }}
                icon={<Moon />}
              />
              <KpiCard
                dataSource="health"
                metricOptions={{
                  label: 'Avg. Overall Feeling',
                  aggregation: 'average',
                  field: 'overall_evaluation',
                  decimals: 1,
                  filterConditions: [{ field: 'overall_evaluation', operator: '>', value: 0 }]
                }}
                icon={<Heart />}
              />
              <KpiCard
                dataSource="health"
                metricOptions={{
                  label: 'Avg. Sleep Quality',
                  aggregation: 'average',
                  field: 'sleep_quality',
                  decimals: 1,
                  filterConditions: [{ field: 'sleep_quality', operator: '>', value: 0 }]
                }}
                icon={<Moon />}
              />
              <KpiCard
                dataSource="health"
                metricOptions={{
                  label: 'Avg. Fitness Feeling',
                  aggregation: 'average',
                  field: 'fitness_feeling',
                  decimals: 1,
                  filterConditions: [{ field: 'fitness_feeling', operator: '>', value: 0 }]
                }}
                icon={<Activity />}
              />
            </KPICardsPanel>

            {/* Tab Navigation */}
            <TabNavigation
              contentLabel="Daily Logs"
              contentIcon={Activity}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </>
        )}

        {/* Daily Logs Tab Content */}
        {activeTab === 'content' && (
          <ContentTab
            loading={loading?.health || isProcessing}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            viewModes={[
              { mode: 'grid', icon: Grid },
              { mode: 'list', icon: List }
            ]}
            items={filteredHealthDays}
            loadingIcon={Activity}
            emptyState={{
              icon: Activity,
              title: "No health data found",
              message: "No health data matches your current filters. Try adjusting your criteria."
            }}
            sortOptions={[
              { value: 'date', label: 'Date', type: 'date' },
              { value: 'daily_steps', label: 'Steps', type: 'number' },
              { value: 'sleep_quality', label: 'Sleep Quality', type: 'number' },
              { value: 'sleep_minutes', label: 'Sleep Duration', type: 'number' },
              { value: 'fitness_feeling', label: 'Fitness Feeling', type: 'number' }
            ]}
            defaultSortField="date"
            defaultSortDirection="desc"
            renderGrid={(days) => (
              <ContentCardsGroup
                items={days}
                viewMode="grid"
                renderItem={(day) => (
                  <HealthCard
                    key={day.date.toISOString()}
                    day={day}
                    viewMode="grid"
                    onClick={handleCardClick}
                  />
                )}
              />
            )}
            renderList={(days) => (
              <ContentCardsGroup
                items={days}
                viewMode="list"
                renderItem={(day) => (
                  <HealthCard
                    key={`list-${day.date.toISOString()}`}
                    day={day}
                    viewMode="list"
                    onClick={handleCardClick}
                  />
                )}
              />
            )}
          />
        )}

        {/* Analysis Tab Content */}
        {activeTab === 'analysis' && (
          <AnalysisTab
            data={filteredHealthDays}
            emptyState={{
              message: "No health data available with current filters. Try adjusting your criteria."
            }}
            renderCharts={(healthData) => (
              <>
                <TimeSeriesBarChart
                  data={healthData}
                  dateColumnName="date"
                  metricOptions={[
                    { value: 'steps', label: 'Daily Steps', aggregation: 'average', field: 'daily_steps', decimals: 0 },
                    { value: 'sleep', label: 'Sleep Duration (min)', aggregation: 'average', field: 'sleep_minutes', decimals: 0 },
                    { value: 'sleep quality', label: 'Sleep Quality (1-5)', aggregation: 'average', field: 'sleep_quality', decimals: 1 },
                    { value: 'sleep rest feeling', label: 'Rest Feeling (1-5)', aggregation: 'average', field: 'sleep_rest_feeling', decimals: 1 },
                    { value: 'screentime', label: 'Avg Screen Time (h)', aggregation: 'average', field: 'total_screen_hours', decimals: 1 },
                    { value: 'screentime_before_sleep', label: 'Avg Screen Time before sleep (min)', aggregation: 'average', field: 'screen_before_sleep_minutes', decimals: 1 },
                    { value: 'energy', label: 'Active Energy (kcal)', aggregation: 'average', field: 'daily_active_energy', decimals: 0 },
                    { value: 'heart', label: 'Heart Rate (bpm)', aggregation: 'average', field: 'avg_heart_rate', decimals: 0 },
                    { value: 'weight', label: 'Body Weight (kg)', aggregation: 'average', field: 'avg_body_weight', decimals: 1 },
                    { value: 'fitness', label: 'Fitness Feeling (1-5)', aggregation: 'average', field: 'fitness_feeling', decimals: 1 },
                    { value: 'evaluation', label: 'Day Score (1-5)', aggregation: 'average', field: 'overall_evaluation', decimals: 1 },
                    { value: 'visits', label: 'Unique Visits', aggregation: 'count_distinct', field: 'visit_id', decimals: 1, data: filteredHealthLocations, dateColumnName: 'datetime' },
                  ]}
                  defaultMetric="steps"
                  title="Health Metrics by Period"
                />
                <IntensityHeatmap
                  data={filteredHealthHourly}
                  dateColumnName="datetime"
                  treatMidnightAsUnknown={false}
                  metricOptions={[
                    { value: 'steps', label: 'Steps', field: 'total_steps', aggregation: 'sum', decimals: 0, compactNumbers: false },
                    { value: 'active_energy', label: 'Active Energy (kcal)', field: 'total_active_energy', aggregation: 'sum', decimals: 0, compactNumbers: true },
                    { value: 'screen_time', label: 'Screen Time (min)', field: 'total_screen_minutes', aggregation: 'sum', decimals: 0 },
                    { value: 'heart_rate', label: 'Avg Heart Rate (bpm)', field: 'avg_heart_rate', aggregation: 'average', decimals: 0 },
                    { value: 'sleep', label: 'Sleep (min)', field: 'total_sleep_minutes', aggregation: 'sum', decimals: 0, compactNumbers: true },
                    { value: 'distance', label: 'Distance (m)', field: 'total_distance_m', aggregation: 'sum', decimals: 0, compactNumbers: true },
                    { value: 'pickups', label: 'Phone Pickups', field: 'total_pickups', aggregation: 'sum', decimals: 0 }
                  ]}
                  defaultMetric="steps"
                  rowAxis="time_period"
                  columnAxis="weekday"
                  showAxisSwap={true}
                  title="Health Activity by Time of Day"
                />
              </>
            )}
          />
        )}

      {/* Health Details Modal */}
      {selectedDay && (
        <HealthDetails
          day={selectedDay}
          hourlyData={healthHourly.filter(h => {
            if (!h.date || !selectedDay.date) return false;
            // Compare dates - handle both Date objects and strings
            const hDate = h.date instanceof Date ? h.date : new Date(h.date);
            const sDate = selectedDay.date instanceof Date ? selectedDay.date : new Date(selectedDay.date);
            return hDate.toDateString() === sDate.toDateString();
          })}
          onClose={handleCloseDetails}
        />
      )}
    </PageWrapper>
  );
};

export default HealthPage;

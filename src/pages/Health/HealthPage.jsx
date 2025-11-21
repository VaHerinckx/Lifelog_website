import { useState, useEffect, useMemo } from 'react';
import { Activity, List, Grid, Calendar, Moon, Heart } from 'lucide-react';
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

// Import utilities
import { sortByDateSafely } from '../../utils/sortingUtils';

const HealthPage = () => {
  usePageTitle('Health');
  const { data, loading, error, fetchData } = useData();
  const [healthDays, setHealthDays] = useState([]);
  const [filteredHealthDays, setFilteredHealthDays] = useState([]);

  const [viewMode, setViewMode] = useState('grid');
  const [selectedDay, setSelectedDay] = useState(null);
  const [activeTab, setActiveTab] = useState('content');
  const [isContentReady, setIsContentReady] = useState(false);

  // Fetch health data when component mounts
  useEffect(() => {
    if (typeof fetchData === 'function') {
      fetchData('health');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Process health data when it's loaded
  useEffect(() => {
    if (data?.health) {
      // Convert date strings to Date objects for JavaScript date operations
      // Filter out entries with invalid dates
      const processedDays = data.health
        .map(day => ({
          ...day,
          date: day.date ? new Date(day.date) : null
        }))
        .filter(day => day.date !== null && !isNaN(day.date.getTime()));

      // Sort by most recent first
      const sortedDays = sortByDateSafely(processedDays, 'date');

      setHealthDays(sortedDays);
      setFilteredHealthDays(sortedDays);
      // Reset content ready state when new data arrives
      setIsContentReady(false);
    }
  }, [data?.health]);

  // Apply filters when FilteringPanel filters change
  const handleFiltersChange = (filteredDataSources) => {
    // Re-sort filtered data (most recent first)
    const sortedDays = sortByDateSafely(filteredDataSources.health || [], 'date');
    setFilteredHealthDays(sortedDays);
  };

  const handleCardClick = (day) => {
    setSelectedDay(day);
  };

  const handleCloseDetails = () => {
    setSelectedDay(null);
  };

  const handleContentReady = () => {
    setIsContentReady(true);
  };

  // Memoize data object to prevent FilteringPanel re-renders
  const filterPanelData = useMemo(() => ({
    health: healthDays
  }), [healthDays]);

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

        {!loading?.health && isContentReady && (
          <>
            {/* FilteringPanel with Filter children */}
            <FilteringPanel
              data={filterPanelData}
              onFiltersChange={handleFiltersChange}
            >
              <Filter
                type="daterange"
                label="Date Range"
                field="date"
                icon={<Calendar />}
                dataSources={['health']}
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
                computation="count"
                label="Days Tracked"
                icon={<Calendar />}
              />
              <KpiCard
                dataSource="health"
                field="daily_steps"
                computation="average"
                computationOptions={{ decimals: 0, filterZeros: true }}
                label="Avg. Daily Steps"
                icon={<Activity />}
              />
              <KpiCard
                dataSource="health"
                field="daily_active_energy"
                computation="average"
                computationOptions={{ decimals: 0, filterZeros: true }}
                label="Avg. Active Energy (kcal)"
                icon={<Heart />}
              />
              <KpiCard
                dataSource="health"
                field="sleep_minutes"
                computation="average"
                computationOptions={{ decimals: 0, filterZeros: true }}
                label="Avg. Sleep (min)"
                icon={<Moon />}
              />
              <KpiCard
                dataSource="health"
                field="overall_evaluation"
                computation="average"
                computationOptions={{ decimals: 1, filterZeros: true }}
                label="Avg. Overall Feeling"
                icon={<Heart />}
              />
              <KpiCard
                dataSource="health"
                field="sleep_quality"
                computation="average"
                computationOptions={{ decimals: 1, filterZeros: true }}
                label="Avg. Sleep Quality"
                icon={<Moon />}
              />
              <KpiCard
                dataSource="health"
                field="fitness_feeling"
                computation="average"
                computationOptions={{ decimals: 1, filterZeros: true }}
                label="Avg. Fitness Feeling"
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
            loading={loading?.health}
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
            onContentReady={handleContentReady}
            enablePagination={true}
            itemsPerPage={50}
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
                    { value: 'energy', label: 'Active Energy (kcal)', aggregation: 'average', field: 'daily_active_energy', decimals: 0 },
                    { value: 'heart', label: 'Heart Rate (bpm)', aggregation: 'average', field: 'avg_heart_rate', decimals: 0 },
                    { value: 'weight', label: 'Body Weight (kg)', aggregation: 'average', field: 'avg_body_weight', decimals: 1 }
                  ]}
                  defaultMetric="steps"
                  title="Health Metrics by Period"
                />
              </>
            )}
          />
        )}

      {/* Health Details Modal */}
      {selectedDay && (
        <HealthDetails day={selectedDay} onClose={handleCloseDetails} />
      )}
    </PageWrapper>
  );
};

export default HealthPage;

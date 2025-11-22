import { useState, useEffect, useMemo } from 'react';
import { Music, Music as MusicIcon, List, Grid, Calendar, Tag, User, Disc } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { usePageTitle } from '../../hooks/usePageTitle';

// Import components
import MusicDetails from './MusicDetails';
import MusicCard from './MusicCard';

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

const MusicPage = () => {
  usePageTitle('Music');
  const { data, loading, error, fetchData } = useData();
  const [musicToggles, setMusicToggles] = useState([]);
  const [filteredToggles, setFilteredToggles] = useState([]);

  const [viewMode, setViewMode] = useState('grid');
  const [selectedToggle, setSelectedToggle] = useState(null);
  const [activeTab, setActiveTab] = useState('content');

  // Fetch music data when component mounts
  useEffect(() => {
    if (typeof fetchData === 'function') {
      fetchData('music');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Process music data when it's loaded
  useEffect(() => {
    if (data?.music) {
      // Convert timestamp strings to Date objects for JavaScript date operations
      const processedToggles = data.music.map(toggle => ({
        ...toggle,
        timestamp: toggle.timestamp ? new Date(toggle.timestamp) : null,
        album_release_date: toggle.album_release_date ? new Date(toggle.album_release_date) : null
      }));

      // Sort by most recent first
      const sortedToggles = sortByDateSafely(processedToggles);

      setMusicToggles(sortedToggles);
      setFilteredToggles(sortedToggles);
      // Reset content ready state when new data arrives
      }
  }, [data?.music]);

  // Apply filters when FilteringPanel filters change
  const handleFiltersChange = (filteredDataSources) => {
    // Re-sort filtered data (most recent first)
    const sortedToggles = sortByDateSafely(filteredDataSources.music || []);
    setFilteredToggles(sortedToggles);
  };

  const handleToggleClick = (toggle) => {
    setSelectedToggle(toggle);
  };

  const handleCloseDetails = () => {
    setSelectedToggle(null);
  };

  // Memoize data object to prevent FilteringPanel re-renders
  const filterPanelData = useMemo(() => ({
    music: musicToggles
  }), [musicToggles]);

  return (
    <PageWrapper
      error={error?.music}
      errorTitle="Music Tracker"
    >
      {/* Page Header */}
      <PageHeader
        title="Music Tracker"
        description="Explore your listening history and music preferences across 9+ years"
      />

        {!loading?.music && (
          <>
            {/* FilteringPanel with Filter children */}
            <FilteringPanel
              data={filterPanelData}
              onFiltersChange={handleFiltersChange}
            >
              <Filter
                type="multiselect"
                label="Genres"
                field="simplified_genre"
                icon={<Tag />}
                placeholder="Select genres"
                dataSources={['music']}
              />
              <Filter
                type="multiselect"
                label="Artists"
                field="artist_name"
                icon={<User />}
                placeholder="Select artists"
                dataSources={['music']}
              />
              <Filter
                type="multiselect"
                label="Tracks"
                field="track_name"
                icon={<MusicIcon />}
                placeholder="Select tracks"
                dataSources={['music']}
              />
              <Filter
                type="multiselect"
                label="Albums"
                field="album_name"
                icon={<Disc />}
                placeholder="Select albums"
                dataSources={['music']}
              />
              <Filter
                type="daterange"
                label="Date Range"
                field="timestamp"
                icon={<Calendar />}
                dataSources={['music']}
              />
            </FilteringPanel>

            {/* Statistics Cards with KpiCard children */}
            <KPICardsPanel
              dataSources={{
                music: filteredToggles
              }}
              loading={loading?.music}
            >
              <KpiCard
                dataSource="music"
                computation="count"
                label="Total Toggles"
                icon={<Music />}
              />
              <KpiCard
                dataSource="music"
                field="artist_name"
                computation="count_distinct"
                label="Unique Artists"
                icon={<User />}
              />
              <KpiCard
                dataSource="music"
                field="track_name"
                computation="count_distinct"
                label="Unique Tracks"
                icon={<MusicIcon />}
              />
              <KpiCard
                dataSource="music"
                field="listening_seconds"
                computation="sum"
                computationOptions={{ decimals: 0, convertToHours: true }}
                label="Total Hours"
                icon={<Music />}
              />
              <KpiCard
                dataSource="music"
                field="completion"
                computation="average"
                computationOptions={{ decimals: 2, asPercentage: true }}
                label="Avg Completion"
                icon={<Music />}
              />
              <KpiCard
                dataSource="music"
                field="simplified_genre"
                computation="count_distinct"
                label="Unique Genres"
                icon={<Tag />}
              />
            </KPICardsPanel>

            {/* Tab Navigation */}
            <TabNavigation
              contentLabel="Toggles"
              contentIcon={MusicIcon}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </>
        )}

        {/* Toggles Tab Content */}
        {activeTab === 'content' && (
          <ContentTab
            loading={loading?.music}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            viewModes={[
              { mode: 'grid', icon: Grid },
              { mode: 'list', icon: List }
            ]}
            items={filteredToggles}
            loadingIcon={Music}
            emptyState={{
              icon: MusicIcon,
              title: "No toggles found",
              message: "No listening events match your current filters. Try adjusting your criteria."
            }}
            renderGrid={(toggles) => (
              <ContentCardsGroup
                items={toggles}
                viewMode="grid"
                renderItem={(toggle) => (
                  <MusicCard
                    key={toggle.toggle_id}
                    toggle={toggle}
                    viewMode="grid"
                    onClick={handleToggleClick}
                  />
                )}
              />
            )}
            renderList={(toggles) => (
              <ContentCardsGroup
                items={toggles}
                viewMode="list"
                renderItem={(toggle) => (
                  <MusicCard
                    key={`list-${toggle.toggle_id}`}
                    toggle={toggle}
                    viewMode="list"
                    onClick={handleToggleClick}
                  />
                )}
              />
            )}
          />
        )}

        {/* Analysis Tab Content */}
        {activeTab === 'analysis' && (
          <AnalysisTab
            data={filteredToggles}
            chartLayout="single"
            emptyState={{
              message: "No music data available with current filters. Try adjusting your criteria."
            }}
            renderCharts={(toggles) => (
              <TimeSeriesBarChart
                data={toggles}
                dateColumnName="timestamp"
                metricOptions={[
                  { value: 'count', label: 'Toggles', aggregation: 'count', decimals: 0 }
                ]}
                defaultMetric="count"
                title="Listening Activity Over Time"
              />
            )}
          />
        )}

      {/* Toggle Details Modal */}
      {selectedToggle && (
        <MusicDetails toggle={selectedToggle} onClose={handleCloseDetails} />
      )}
    </PageWrapper>
  );
};

export default MusicPage;

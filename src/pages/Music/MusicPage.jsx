import { useState, useEffect, useMemo, useCallback } from 'react';
import { Music, Music as MusicIcon, List, Grid, Calendar, Tag, User, Disc, Star, Repeat } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { usePageTitle } from '../../hooks/usePageTitle';

// Import components
import MusicDetails from './components/MusicDetails';
import MusicCard from './components/MusicCard';

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
import TopChart from '../../components/charts/TopChart';
import ProportionChart from '../../components/charts/ProportionChart';

// Import utilities
import { sortByDateSafely } from '../../utils/sortingUtils';

const MusicPage = () => {
  usePageTitle('Music');
  const { data, loading, error, fetchData } = useData();
  const [musicToggles, setMusicToggles] = useState([]);
  const [filteredToggles, setFilteredToggles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(true);

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
      setIsProcessing(true);

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

      setIsProcessing(false);
      }
  }, [data?.music]);

  // Apply filters when FilteringPanel filters change
  const handleFiltersChange = useCallback((filteredDataSources) => {
    // Re-sort filtered data (most recent first)
    const sortedToggles = sortByDateSafely(filteredDataSources.music || []);
    setFilteredToggles(sortedToggles);
  }, []);

  // Memoized handlers to prevent child re-renders
  const handleToggleClick = useCallback((toggle) => {
    setSelectedToggle(toggle);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setSelectedToggle(null);
  }, []);

  // Memoized render functions for ContentCardsGroup
  const renderGridItem = useCallback((toggle) => (
    <MusicCard
      key={toggle.toggle_id}
      toggle={toggle}
      viewMode="grid"
      onClick={handleToggleClick}
    />
  ), [handleToggleClick]);

  const renderListItem = useCallback((toggle) => (
    <MusicCard
      key={`list-${toggle.toggle_id}`}
      toggle={toggle}
      viewMode="list"
      onClick={handleToggleClick}
    />
  ), [handleToggleClick]);

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

        {!loading?.music && !isProcessing && (
          <>
            {/* FilteringPanel with Filter children */}
            <FilteringPanel
              data={filterPanelData}
              onFiltersChange={handleFiltersChange}
            >
              <Filter
                type="daterange"
                label="Listening Date"
                field="timestamp"
                icon={<Calendar />}
                dataSources={['music']}
              />
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
                type="multiselect"
                label="First Artist Listen"
                field="is_new_artist"
                icon={<Star />}
                placeholder="Select"
                dataSources={['music']}
              />
              <Filter
                type="multiselect"
                label="First Track Listen"
                field="is_new_track"
                icon={<Star />}
                placeholder="Select"
                dataSources={['music']}
              />
              <Filter
                type="multiselect"
                label="New Recurring Artist"
                field="is_new_recurring_artist"
                icon={<Repeat />}
                placeholder="Select"
                dataSources={['music']}
              />
              <Filter
                type="multiselect"
                label="New Recurring Track"
                field="is_new_recurring_track"
                icon={<Repeat />}
                placeholder="Select"
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
                metricOptions={{
                  label: 'Total Toggles',
                  aggregation: 'count'
                }}
                icon={<Music />}
              />
              <KpiCard
                dataSource="music"
                metricOptions={{
                  label: 'Unique Artists',
                  aggregation: 'count_distinct',
                  field: 'artist_name'
                }}
                icon={<User />}
              />
              <KpiCard
                dataSource="music"
                metricOptions={{
                  label: 'Unique Tracks',
                  aggregation: 'count_distinct',
                  field: 'track_name'
                }}
                icon={<MusicIcon />}
              />
              <KpiCard
                dataSource="music"
                metricOptions={{
                  label: 'Total Hours',
                  aggregation: 'sum',
                  field: 'listening_hours',
                  decimals: 0
                }}
                icon={<Music />}
              />
              <KpiCard
                dataSource="music"
                metricOptions={{
                  label: 'Avg Completion',
                  aggregation: 'average',
                  field: 'completion',
                  decimals: 0,
                  suffix: '%'
                }}
                icon={<Music />}
              />
              <KpiCard
                dataSource="music"
                metricOptions={{
                  label: 'Unique Genres',
                  aggregation: 'count_distinct',
                  field: 'simplified_genre'
                }}
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
            loading={loading?.music || isProcessing}
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
            sortOptions={[
              { value: 'timestamp', label: 'Listening Date', type: 'date' },
            ]}
            defaultSortField="timestamp"
            defaultSortDirection="desc"
            renderGrid={(toggles) => (
              <ContentCardsGroup
                items={toggles}
                viewMode="grid"
                itemsPerPage={50}
                renderItem={renderGridItem}
              />
            )}
            renderList={(toggles) => (
              <ContentCardsGroup
                items={toggles}
                viewMode="list"
                itemsPerPage={50}
                renderItem={renderListItem}
              />
            )}
          />
        )}

        {/* Analysis Tab Content */}
        {activeTab === 'analysis' && (
          <AnalysisTab
            renderCharts={() => (
            <>
              <TimeSeriesBarChart
                data={filteredToggles}
                dateColumnName="timestamp"
                metricOptions={[
                  { value: 'toggle', label: 'Toggles', aggregation: 'count_distinct', field: 'toggle_id', decimals: 0 },
                  { value: 'artists', label: 'Artists', aggregation: 'count_distinct', field: 'artist_name', decimals: 0 },
                  { value: 'listening time', label: 'Listening time', aggregation: 'sum', field: 'listening_seconds', decimals: 0 },
                ]}
                defaultMetric="count"
                title="Listening Activity Over Time"
              />
              <IntensityHeatmap
                  data={filteredToggles}
                  dateColumnName="timestamp"
                  valueColumnName="listening_seconds"
                  title="Listening Activity by Day and Time"
                  treatMidnightAsUnknown={true}
              />
              <TopChart
               data={filteredToggles}
               dimensionOptions={[
                 { value: 'track', label: 'Track', field: 'track_name', labelFields: ['track_name'] },
                 { value: 'artist', label: 'Artist', field: 'artist_name', labelFields: ['artist_name'] },
                 { value: 'album', label: 'Album', field: 'album_name', labelFields: ['album_name'] },
                 { value: 'genre', label: 'Genre', field: 'simplified_genre', labelFields: ['genre'] },
               ]}
               metricOptions={[
                 { value: 'listening time', label: 'Listening Time', aggregation: 'sum', field: 'listening_seconds', suffix: ' seconds', decimals: 0 },
                 { value: 'toggles', label: 'Toggles', aggregation: 'count_distinct', field: 'toggle_id', suffix: ' toggles', decimals: 0 },
               ]}
               defaultDimension="genre"
               defaultMetric="listening time"
               title="Top Music Analysis"
               topN={10}
               imageField="poster_url"
               enableTopNControl={true}
               topNOptions={[5, 10, 15, 20, 25, 30]}
               enableSortToggle={true}
               scrollable={true}
               barHeight={50}
               />
              <ProportionChart
                data={filteredToggles}
                dimensionOptions={[
                  { value: 'simplified_genre', label: 'Genre', field: 'simplified_genre' },
                  { value: 'artist_name', label: 'Artist', field: 'artist_name' },
                  { value: 'album_name', label: 'Album', field: 'album_name' },
                  { value: 'is_new_artist', label: 'New Artist', field: 'is_new_artist' },
                  { value: 'is_new_recurring_artist', label: 'New Recurring Artist', field: 'is_new_recurring_artist' }
                ]}
                metricOptions={[
                  { value: 'listening_hours', label: 'Listening Hours', aggregation: 'sum', field: 'listening_hours', suffix: ' hrs', decimals: 1 },
                  { value: 'toggles', label: 'Toggles', aggregation: 'count', field: 'toggle_id' }
                ]}
                defaultDimension="simplified_genre"
                defaultMetric="listening_hours"
                title="Listening Distribution"
                maxCategories={8}
                showPercentages={true}
              />
              </>
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

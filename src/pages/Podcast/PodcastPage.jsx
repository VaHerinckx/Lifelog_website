import { useState, useEffect, useMemo, useCallback } from 'react';
import { Mic, Headphones, List, Grid, Clock, Calendar, Tag, Globe, Sparkles, Repeat, TrendingUp } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { usePageTitle } from '../../hooks/usePageTitle';

// Import components
import EpisodeDetails from './components/EpisodeDetails';
import EpisodeCard from './components/EpisodeCard';

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

const PodcastPage = () => {
  usePageTitle('Podcasts');
  const { data, loading, error, fetchData } = useData();
  const [podcasts, setPodcasts] = useState([]);
  const [filteredPodcasts, setFilteredPodcasts] = useState([]);
  const [isProcessing, setIsProcessing] = useState(true);

  const [viewMode, setViewMode] = useState('grid');
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [activeTab, setActiveTab] = useState('content');

  // Fetch podcast data when component mounts
  useEffect(() => {
    console.log('🎙️ PodcastPage useEffect - fetching data');

    if (typeof fetchData === 'function') {
      fetchData('podcasts');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Process podcast data when it's loaded
  useEffect(() => {
    if (data?.podcasts) {
      setIsProcessing(true);

      // Convert timestamp strings to Date objects for JavaScript date operations
      const processedPodcasts = data.podcasts.map(episode => ({
        ...episode,
        listened_date: episode.listened_date ? new Date(episode.listened_date) : null,
        published_date: episode.published_date ? new Date(episode.published_date) : null
      }));

      // Data already sorted by Python, but set in state
      setPodcasts(processedPodcasts);
      setFilteredPodcasts(processedPodcasts);
      setIsProcessing(false);
      }
  }, [data?.podcasts]);

  // Apply filters when FilteringPanel filters change
  // FilteringPanel now returns pre-filtered data per source!
  const handleFiltersChange = (filteredDataSources) => {
    // ContentTab now handles sorting internally
    setFilteredPodcasts(filteredDataSources.podcasts || []);
  };

  const handleEpisodeClick = useCallback((episode) => {
    setSelectedEpisode(episode);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setSelectedEpisode(null);
  }, []);

  // Memoize data object to prevent FilteringPanel re-renders
  const filterPanelData = useMemo(() => ({
    podcasts: podcasts
  }), [podcasts]);

  return (
    <PageWrapper
      error={error?.podcasts}
      errorTitle="Podcast Tracker"
    >
      {/* Page Header */}
      <PageHeader
        title="Podcast Tracker"
        description="Track your podcast listening habits and discover insights about your episodes"
      />

        {!loading?.podcasts && !isProcessing && (
          <>
            {/* FilteringPanel with Filter children */}
            <FilteringPanel
              data={filterPanelData}
              onFiltersChange={handleFiltersChange}
            >
              <Filter
                type="daterange"
                label="Listened Date"
                field="listened_date"
                icon={<Calendar />}
                dataSources={['podcasts']}
              />
              <Filter
                type="multiselect"
                label="Podcast"
                field="podcast_name"
                icon={<Tag />}
                placeholder="Select podcast"
                dataSources={['podcasts']}
              />
              <Filter
                type="multiselect"
                label="Host"
                field="artist"
                icon={<Tag />}
                placeholder="Select host"
                dataSources={['podcasts']}
              />
              <Filter
                type="multiselect"
                label="Genres"
                field="genre"
                icon={<Tag />}
                placeholder="Select genres"
                dataSources={['podcasts']}
              />
              <Filter
                type="multiselect"
                label="Languages"
                field="language"
                icon={<Globe />}
                placeholder="Select languages"
                dataSources={['podcasts']}
              />
              <Filter
                type="singleselect"
                label="Podcast Type"
                field="podcast_type"
                icon={<Mic />}
                defaultValue="all"
                dataSources={['podcasts']}
                options={['all', 'New Podcasts', 'Recurring Podcasts']}
              />
            </FilteringPanel>

            {/* Statistics Cards with KpiCard children */}
            <KPICardsPanel
              dataSources={{
                podcasts: filteredPodcasts
              }}
              loading={loading?.podcasts}
            >
              <KpiCard
                dataSource="podcasts"
                field="podcast_id"
                computation="count_distinct"
                label="Podcasts"
                icon={<Mic />}
              />
              <KpiCard
                dataSource="podcasts"
                computation="count"
                label="Episodes"
                icon={<Headphones />}
              />
              <KpiCard
                dataSource="podcasts"
                field="listened_seconds"
                computation="sum"
                computationOptions={{ convertToHours: true, decimals: 0 }}
                label="Hours Listened"
                icon={<Clock />}
              />
              <KpiCard
                dataSource="podcasts"
                field="completion_percent"
                computation="average"
                computationOptions={{ decimals: 0, filterZeros: false }}
                label="Avg Completion"
                icon={<TrendingUp />}
                suffix="%"
              />
              <KpiCard
                dataSource="podcasts"
                field="podcast_id"
                computation="count_distinct"
                filterCondition={(item) => item.is_new_podcast === 1}
                label="New Podcasts"
                icon={<Sparkles />}
              />
              <KpiCard
                dataSource="podcasts"
                field="podcast_id"
                computation="count_distinct"
                filterCondition={(item) => item.is_recurring_podcast === 1}
                label="Recurring"
                icon={<Repeat />}
              />
            </KPICardsPanel>

            {/* Tab Navigation */}
            <TabNavigation
              contentLabel="Episodes"
              contentIcon={Headphones}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </>
        )}

        {/* Episodes Tab Content */}
        {activeTab === 'content' && (
          <ContentTab
            loading={loading?.podcasts || isProcessing}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            viewModes={[
              { mode: 'grid', icon: Grid },
              { mode: 'list', icon: List }
            ]}
            items={filteredPodcasts}
            loadingIcon={Mic}
            emptyState={{
              icon: Headphones,
              title: "No episodes found",
              message: "No episodes match your current filters. Try adjusting your criteria."
            }}
            sortOptions={[
              { value: 'listened_date', label: 'Listen Date', type: 'date' },
              { value: 'published_date', label: 'Publish Date', type: 'date' },
              { value: 'episode_title', label: 'Episode Title', type: 'string' },
              { value: 'podcast_title', label: 'Podcast Title', type: 'string' },
              { value: 'duration', label: 'Duration', type: 'number' }
            ]}
            defaultSortField="listened_date"
            defaultSortDirection="desc"
            renderGrid={(episodes) => (
              <ContentCardsGroup
                items={episodes}
                viewMode="grid"
                renderItem={(episode) => (
                  <EpisodeCard
                    key={episode.episode_uuid}
                    episode={episode}
                    viewMode="grid"
                    onClick={handleEpisodeClick}
                  />
                )}
              />
            )}
            renderList={(episodes) => (
              <ContentCardsGroup
                items={episodes}
                viewMode="list"
                renderItem={(episode) => (
                  <EpisodeCard
                    key={`list-${episode.episode_uuid}`}
                    episode={episode}
                    viewMode="list"
                    onClick={handleEpisodeClick}
                  />
                )}
              />
            )}
          />
        )}

        {/* Analysis Tab Content */}
        {activeTab === 'analysis' && (
          <AnalysisTab
            data={filteredPodcasts}
            emptyState={{
              message: "No podcast data available with current filters. Try adjusting your criteria."
            }}
            renderCharts={(episodes) => (
              <>
                <TimeSeriesBarChart
                  data={episodes}
                  dateColumnName="listened_date"
                  metricOptions={[
                    {
                      value: 'podcast_count',
                      label: 'Podcasts Listened',
                      aggregation: 'countDistinct',
                      field: 'podcast_id',
                      decimals: 0
                    },
                    {
                      value: 'episode_count',
                      label: 'Episodes Listened',
                      aggregation: 'count',
                      decimals: 0
                    },
                    {
                      value: 'listening_time',
                      label: 'Hours Listened',
                      aggregation: 'sum',
                      field: 'listened_seconds',
                      decimals: 1,
                      convertToHours: true
                    }
                  ]}
                  defaultMetric="episode_count"
                  title="Podcast Listening Activity"
                />
              </>
            )}
          />
        )}

      {/* Episode Details Modal */}
      {selectedEpisode && (
        <EpisodeDetails episode={selectedEpisode} onClose={handleCloseDetails} />
      )}
    </PageWrapper>
  );
};

export default PodcastPage;

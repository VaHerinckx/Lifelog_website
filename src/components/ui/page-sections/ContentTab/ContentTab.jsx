import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import ViewControls from '../../content/ViewControls';
import ContentContainer from '../../content/ContentContainer';

/**
 * ContentTab - Standardized content tab component for pages
 *
 * Handles the common pattern of:
 * - Hiding ViewControls during loading
 * - Showing ContentContainer with loading/empty states
 * - Supporting multiple view modes (grid, list, timeline, etc.)
 * - Tracking when content is ready to render
 *
 * This component eliminates boilerplate across all pages and ensures
 * consistent loading behavior.
 *
 * Parent component should conditionally render this based on activeTab:
 * {activeTab === 'content' && <ContentTab ... />}
 *
 * @param {boolean} loading - Loading state from data fetching
 * @param {string} viewMode - Current view mode ('grid', 'list', 'timeline')
 * @param {function} onViewModeChange - Callback for view mode changes
 * @param {array} viewModes - Available view modes [{mode: 'grid', icon: Grid}, ...]
 * @param {array} items - Filtered data items to display
 * @param {React.Component} loadingIcon - Icon for loading spinner
 * @param {object} emptyState - Empty state config {icon, title, message}
 * @param {function} renderGrid - Render function for grid view (items) => JSX
 * @param {function} renderList - Render function for list view (items) => JSX
 * @param {function} renderTimeline - Optional render function for timeline view (items) => JSX
 * @param {function} onContentReady - Callback when content is ready to display
 */
const ContentTab = ({
  loading = false,
  viewMode,
  onViewModeChange,
  viewModes,
  items,
  loadingIcon,
  emptyState,
  renderGrid = null,
  renderList = null,
  renderTimeline = null,
  onContentReady = null
}) => {
  const [isContentReady, setIsContentReady] = useState(false);

  // Track when content is ready to render
  useEffect(() => {
    if (!loading && items.length > 0) {
      // Wait one render cycle to ensure cards start rendering
      setIsContentReady(false);
      const timer = setTimeout(() => {
        setIsContentReady(true);
        if (onContentReady) {
          onContentReady();
        }
      }, 0);
      return () => clearTimeout(timer);
    } else if (loading) {
      // Reset when new loading cycle starts
      setIsContentReady(false);
    } else if (!loading && items.length === 0) {
      // Empty state is ready immediately
      setIsContentReady(true);
      if (onContentReady) {
        onContentReady();
      }
    }
  }, [loading, items.length, onContentReady]);

  // Show loading state until content is actually ready
  const isLoading = loading || !isContentReady;
  return (
    <>
      {/* View Controls - Hidden during loading */}
      {!isLoading && (
        <ViewControls
          viewModes={viewModes}
          activeMode={viewMode}
          onModeChange={onViewModeChange}
        />
      )}

      {/* Content Display with Loading/Empty States */}
      <ContentContainer
        isEmpty={items.length === 0}
        loading={isLoading}
        loadingIcon={loadingIcon}
        emptyState={emptyState}
      >
        {/* Grid View */}
        {viewMode === 'grid' && renderGrid && renderGrid(items)}

        {/* List View */}
        {viewMode === 'list' && renderList && renderList(items)}

        {/* Timeline View */}
        {viewMode === 'timeline' && renderTimeline && renderTimeline(items)}
      </ContentContainer>
    </>
  );
};

ContentTab.propTypes = {
  loading: PropTypes.bool,
  viewMode: PropTypes.string.isRequired,
  onViewModeChange: PropTypes.func.isRequired,
  viewModes: PropTypes.arrayOf(
    PropTypes.shape({
      mode: PropTypes.string.isRequired,
      icon: PropTypes.elementType.isRequired,
    })
  ).isRequired,
  items: PropTypes.array.isRequired,
  loadingIcon: PropTypes.elementType.isRequired,
  emptyState: PropTypes.shape({
    icon: PropTypes.elementType.isRequired,
    title: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
  }).isRequired,
  renderGrid: PropTypes.func,
  renderList: PropTypes.func,
  renderTimeline: PropTypes.func,
  onContentReady: PropTypes.func,
};

export default ContentTab;

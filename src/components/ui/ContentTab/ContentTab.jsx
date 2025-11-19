import PropTypes from 'prop-types';
import ViewControls from '../ViewControls';
import ContentContainer from '../ContentContainer';

/**
 * ContentTab - Standardized content tab component for pages
 *
 * Handles the common pattern of:
 * - Hiding ViewControls during loading
 * - Showing ContentContainer with loading/empty states
 * - Supporting multiple view modes (grid, list, timeline, etc.)
 *
 * This component eliminates boilerplate across all pages and ensures
 * consistent loading behavior.
 *
 * Parent component should conditionally render this based on activeTab:
 * {activeTab === 'content' && <ContentTab ... />}
 *
 * @param {boolean} loading - Loading state
 * @param {string} viewMode - Current view mode ('grid', 'list', 'timeline')
 * @param {function} onViewModeChange - Callback for view mode changes
 * @param {array} viewModes - Available view modes [{mode: 'grid', icon: Grid}, ...]
 * @param {array} items - Filtered data items to display
 * @param {React.Component} loadingIcon - Icon for loading spinner
 * @param {object} emptyState - Empty state config {icon, title, message}
 * @param {function} renderGrid - Render function for grid view (items) => JSX
 * @param {function} renderList - Render function for list view (items) => JSX
 * @param {function} renderTimeline - Optional render function for timeline view (items) => JSX
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
  renderTimeline = null
}) => {
  return (
    <>
      {/* View Controls - Hidden during loading */}
      {!loading && (
        <ViewControls
          viewModes={viewModes}
          activeMode={viewMode}
          onModeChange={onViewModeChange}
        />
      )}

      {/* Content Display with Loading/Empty States */}
      <ContentContainer
        isEmpty={items.length === 0}
        loading={loading}
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
};

export default ContentTab;

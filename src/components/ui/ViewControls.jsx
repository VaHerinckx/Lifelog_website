import PropTypes from 'prop-types';

/**
 * ViewControls - Standardized view mode toggle and item counter
 *
 * Used for switching between different view modes (grid, list, timeline) and displaying item count.
 * Uses CSS classes from components.css: .view-controls, .view-control-btn, .view-control-btn.active, .item-count
 *
 * @param {Array} viewModes - Array of view mode objects: [{mode: 'grid', icon: GridIcon}, ...]
 * @param {string} activeMode - Currently active view mode
 * @param {function} onModeChange - Callback function when view mode button is clicked
 * @param {number} itemCount - Number of items to display
 * @param {object} itemLabel - Labels for items: {singular: 'book', plural: 'books'}
 */
const ViewControls = ({ viewModes, activeMode, onModeChange, itemCount, itemLabel }) => {
  // Determine correct label (singular or plural)
  const label = itemCount === 1 ? itemLabel.singular : itemLabel.plural;

  return (
    <div className="view-controls">
      {viewModes.map(({ mode, icon: Icon }) => (
        <button
          key={mode}
          className={`view-control-btn ${activeMode === mode ? 'active' : ''}`}
          onClick={() => onModeChange(mode)}
          aria-label={`${mode} view`}
        >
          <Icon size={20} />
        </button>
      ))}
      <div className="item-count">
        {itemCount} {label} found
      </div>
    </div>
  );
};

ViewControls.propTypes = {
  viewModes: PropTypes.arrayOf(
    PropTypes.shape({
      mode: PropTypes.string.isRequired,
      icon: PropTypes.elementType.isRequired,
    })
  ).isRequired,
  activeMode: PropTypes.string.isRequired,
  onModeChange: PropTypes.func.isRequired,
  itemCount: PropTypes.number.isRequired,
  itemLabel: PropTypes.shape({
    singular: PropTypes.string.isRequired,
    plural: PropTypes.string.isRequired,
  }).isRequired,
};

export default ViewControls;

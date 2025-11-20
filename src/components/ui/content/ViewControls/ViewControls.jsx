import PropTypes from 'prop-types';

/**
 * ViewControls - Standardized view mode toggle
 *
 * Used for switching between different view modes (grid, list, timeline).
 * Uses CSS classes from components.css: .view-controls, .view-control-btn, .view-control-btn.active
 *
 * @param {Array} viewModes - Array of view mode objects: [{mode: 'grid', icon: GridIcon}, ...]
 * @param {string} activeMode - Currently active view mode
 * @param {function} onModeChange - Callback function when view mode button is clicked
 */
const ViewControls = ({ viewModes, activeMode, onModeChange }) => {
  return (
    <div className="view-controls">
      <div className="view-mode-buttons">
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
};

export default ViewControls;

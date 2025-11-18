import PropTypes from 'prop-types';
import './ContentCardsGroup.css';

/**
 * CardGroup - Generic container component for displaying items in different view modes
 *
 * A standardized, reusable container that handles layout switching between grid, list,
 * and timeline views. Works across all content types (books, movies, podcasts, etc.)
 *
 * The component handles:
 * - Container layout styling based on viewMode
 * - Mapping items to rendered components
 * - Responsive grid/list layouts
 *
 * Item-specific rendering is delegated to the parent via renderItem prop.
 *
 * @param {Array} items - Array of items to display
 * @param {string} viewMode - Current view mode ('grid' | 'list' | 'timeline')
 * @param {Function} renderItem - Function to render individual item: (item, index) => JSX
 * @param {string} className - Additional CSS class for customization
 */
const CardGroup = ({ items, viewMode, renderItem, className = '' }) => {
  const containerClass = `card-group card-group--${viewMode} ${className}`.trim();

  return (
    <div className={containerClass}>
      {items.map((item, index) => renderItem(item, index))}
    </div>
  );
};

CardGroup.propTypes = {
  items: PropTypes.array.isRequired,
  viewMode: PropTypes.oneOf(['grid', 'list', 'timeline']).isRequired,
  renderItem: PropTypes.func.isRequired,
  className: PropTypes.string,
};

export default CardGroup;

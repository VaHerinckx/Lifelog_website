import PropTypes from 'prop-types';
import StarRating from '../../../components/ui/StarRating';
import { formatDate } from '../../../utils';

/**
 * BookCard - Grid view card component for displaying book information
 *
 * Displays book cover, title, author, rating, and metadata in a card format.
 * Uses CSS classes from ReadingPage.css
 *
 * @param {Object} book - Book data object
 * @param {Function} onClick - Callback when card is clicked
 */
const BookCard = ({ book, onClick }) => {
  return (
    <div className="book-card" onClick={() => onClick(book)}>
      <div className="book-cover-container">
        <img
          src={book.coverUrl || "/api/placeholder/220/320"}
          alt={`${book.title} cover`}
          className="book-cover"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "/api/placeholder/220/320";
          }}
        />
      </div>
      <div className="book-info">
        <h3 className="book-title" title={book.title}>{book.title}</h3>
        <p className="book-author" title={book.author}>by {book.author}</p>

        <div className="rating-container">
          <StarRating rating={book.myRating} size={16} />
          <span>{book.myRating.toFixed(1)}</span>
        </div>

        <div className="book-meta">
          {book.publicationYear && <span>{book.publicationYear}</span>}
          <div className="book-genre-tags">
            <span className={`book-genre ${book.fiction ? 'fiction-tag' : 'non-fiction-tag'}`}>
              {book.fiction ? 'Fiction' : 'Non-Fiction'}
            </span>
          </div>
        </div>

        <div className="reading-dates">
          <span className="date-label">Read on:</span>
          <span className="date-value">{formatDate(book.timestamp)}</span>
        </div>

        {book.readingDuration && book.timestamp && (
          <div className="reading-duration">
            <span className="duration-value">
              {book.readingDuration} days to read
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

BookCard.propTypes = {
  book: PropTypes.shape({
    title: PropTypes.string.isRequired,
    author: PropTypes.string.isRequired,
    coverUrl: PropTypes.string,
    myRating: PropTypes.number.isRequired,
    publicationYear: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    fiction: PropTypes.bool,
    timestamp: PropTypes.string,
    readingDuration: PropTypes.number,
  }).isRequired,
  onClick: PropTypes.func.isRequired,
};

export default BookCard;

import React from 'react';
import { X, BookOpen, Calendar, Star, StarHalf, Clock } from 'lucide-react';
import './BookDetails.css';

// Component to display star ratings
const StarRating = ({ rating, size = 18 }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="stars">
      {[...Array(fullStars)].map((_, i) => (
        <Star key={`full-${i}`} className="star" size={size} fill="#EAC435" />
      ))}
      {hasHalfStar && <StarHalf className="star" size={size} />}
      {[...Array(emptyStars)].map((_, i) => (
        <Star key={`empty-${i}`} className="empty-star" size={size} />
      ))}
    </div>
  );
};

const BookDetails = ({ book, onClose }) => {
  if (!book) return null;

  return (
    <div className="book-details-overlay">
      <div className="book-details-modal">
        <button className="close-button" onClick={onClose}>
          <X size={24} />
        </button>

        <div className="book-details-content">
          <div className="book-details-cover">
            <img
              src={book.coverUrl || "/api/placeholder/300/450"}
              alt={`${book.title} cover`}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/api/placeholder/300/450";
              }}
            />
          </div>

          <div className="book-details-info">
            <h2>{book.title}</h2>
            <h3>by {book.author}</h3>

            <div className="book-details-meta">
              {book.publicationYear && (
                <div className="meta-item">
                  <Calendar size={18} />
                  <span>Published: {book.publicationYear}</span>
                </div>
              )}

              <div className="meta-item">
                <BookOpen size={18} />
                <span>{book.pages.toLocaleString()} pages</span>
              </div>

              {book.readingDuration && (
                <div className="meta-item">
                  <Clock size={18} />
                  <span>Read in {book.readingDuration} days</span>
                </div>
              )}
            </div>

            <div className="book-ratings">
              <div className="rating-item">
                <label>My Rating:</label>
                <div className="rating-display">
                  <StarRating rating={book.myRating} />
                  <span>{book.myRating.toFixed(1)}</span>
                </div>
              </div>

              <div className="rating-item">
                <label>Community Rating:</label>
                <div className="rating-display">
                  <StarRating rating={book.averageRating} />
                  <span>{book.averageRating.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="book-categories">
              <span className={`book-category ${book.fiction ? 'fiction-tag' : 'non-fiction-tag'}`}>
                {book.fiction ? 'Fiction' : 'Non-Fiction'}
              </span>

              {book.genre && book.genre !== 'Unknown' && (
                <span className="book-category">
                  {book.genre}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetails;

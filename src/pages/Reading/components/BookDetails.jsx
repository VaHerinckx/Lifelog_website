import React from 'react';
import { X, BookOpen, Calendar, Clock } from 'lucide-react';
import './BookDetails.css';
import StarRating from '../../../components/ui/StarRating';

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
                  <StarRating rating={book.myRating} size={18} />
                  <span>{book.myRating.toFixed(1)}</span>
                </div>
              </div>

              <div className="rating-item">
                <label>Community Rating:</label>
                <div className="rating-display">
                  <StarRating rating={book.averageRating} size={18} />
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

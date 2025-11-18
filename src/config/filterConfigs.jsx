/**
 * Centralized Filter Configurations
 *
 * This file provides reusable filter configuration builders and
 * page-specific filter configurations for consistent filtering
 * across the LifeLog website.
 */

import React from 'react';
import { Calendar, User, Tag, Clock, Film, Book, Album, Headphones, Utensils, DollarSign } from 'lucide-react';

/**
 * Common filter configuration builders
 * These functions create standardized filter configurations
 */

export const filterBuilders = {
  /**
   * Creates a date range filter configuration
   */
  dateRange: (key, label, dataField, icon = <Calendar size={16} />, dataSources = []) => ({
    key,
    type: 'daterange',
    label,
    dataField,
    dataSources, // Array of data sources this filter applies to (e.g., ['readingBooks', 'readingSessions'])
    icon,
    placeholder: 'Select date range'
  }),

  /**
   * Creates a multi-select filter configuration
   */
  multiSelect: (key, label, dataField, icon, optionsSource = null, dataSources = []) => ({
    key,
    type: 'multiselect',
    label,
    optionsSource: optionsSource || dataField,
    dataField,
    dataSources, // Array of data sources this filter applies to
    icon,
    placeholder: `Select ${label.toLowerCase()}`,
    searchPlaceholder: `Search ${label.toLowerCase()}...`
  }),

  /**
   * Creates a year filter configuration (common pattern)
   */
  yearFilter: (key, label, dataField, dataSources = []) => ({
    key,
    type: 'multiselect',
    label,
    optionsSource: dataField,
    dataField,
    dataSources, // Array of data sources this filter applies to
    icon: <Clock size={16} />,
    placeholder: 'Select years',
    searchPlaceholder: 'Search years...'
  }),

  /**
   * Creates a genre filter configuration (common pattern)
   */
  genreFilter: (key = 'genres', dataField = 'genre', dataSources = []) => ({
    key,
    type: 'multiselect',
    label: 'Genres',
    optionsSource: dataField,
    dataField,
    dataSources, // Array of data sources this filter applies to
    icon: <Tag size={16} />,
    placeholder: 'Select genres',
    searchPlaceholder: 'Search genres...'
  })
};

/**
 * Page-specific filter configurations
 */

export const musicFilterConfigs = [
  filterBuilders.yearFilter('listeningYear', 'Listening Year', 'listening_year'),
  filterBuilders.dateRange('dateRange', 'Listening Date', 'timestamp'),
  filterBuilders.multiSelect('artists', 'Artists', 'artist_name', <User size={16} />),
  filterBuilders.multiSelect('albums', 'Albums', 'album_name', <Album size={16} />),
  filterBuilders.multiSelect('genres', 'Genres', 'genre_1', <Tag size={16} />)
];

export const readingFilterConfigs = [
  filterBuilders.yearFilter('readingYears', 'Reading Years', 'reading_year', ['readingBooks', 'readingSessions']),
  filterBuilders.dateRange('dateRange', 'Reading Date', 'timestamp', <Calendar size={16} />, ['readingBooks', 'readingSessions']),
  filterBuilders.genreFilter('genres', 'genre', ['readingBooks']),
  filterBuilders.multiSelect('authors', 'Authors', 'author', <User size={16} />, null, ['readingBooks']),
  filterBuilders.multiSelect('books', 'Books', 'title', <Book size={16} />, null, ['readingBooks', 'readingSessions'])
];

export const moviesFilterConfigs = [
  filterBuilders.dateRange('dateRange', 'Watch Date', 'date'),
  {
    key: 'genres',
    type: 'multiselect',
    label: 'Genres',
    optionsSource: 'custom', // Special handling for comma-separated genres
    dataField: 'genre',
    icon: <Tag size={16} />,
    placeholder: 'Select genres',
    searchPlaceholder: 'Search genres...'
  },
  filterBuilders.yearFilter('years', 'Release Year', 'originalEntry.year'),
  {
    key: 'ratings',
    type: 'multiselect',
    label: 'Rating',
    optionsSource: 'originalEntry.rating',
    dataField: 'originalEntry.rating',
    icon: <Film size={16} />,
    placeholder: 'Select ratings',
    searchPlaceholder: 'Search ratings...'
  }
];

export const podcastFilterConfigs = [
  filterBuilders.yearFilter('listeningYear', 'Listening Year', 'listening_year'),
  filterBuilders.dateRange('dateRange', 'Listening Date', 'listened_date'),
  filterBuilders.multiSelect('podcasts', 'Podcasts', 'podcast_name', <Headphones size={16} />),
  {
    key: 'completionStatus',
    type: 'multiselect',
    label: 'Completion Status',
    optionsSource: 'completion_status',
    dataField: 'completion_status',
    icon: <Clock size={16} />,
    placeholder: 'Select status',
    searchPlaceholder: 'Search status...'
  }
];

export const nutritionFilterConfigs = [
  filterBuilders.dateRange('dateRange', 'Meal Date', 'timestamp'),
  {
    key: 'mealTypes',
    type: 'multiselect',
    label: 'Meal Types',
    optionsSource: 'meal_type',
    dataField: 'meal_type',
    icon: <Utensils size={16} />,
    placeholder: 'Select meal types',
    searchPlaceholder: 'Search meal types...'
  },
  {
    key: 'foodCategories',
    type: 'multiselect',
    label: 'Food Categories',
    optionsSource: 'food_categories',
    dataField: 'food_categories',
    icon: <Tag size={16} />,
    placeholder: 'Select categories',
    searchPlaceholder: 'Search categories...'
  }
];

export const financeFilterConfigs = [
  filterBuilders.dateRange('dateRange', 'Transaction Date', 'date'),
  {
    key: 'categories',
    type: 'multiselect',
    label: 'Categories',
    optionsSource: 'category',
    dataField: 'category',
    icon: <Tag size={16} />,
    placeholder: 'Select categories',
    searchPlaceholder: 'Search categories...'
  },
  {
    key: 'transactionTypes',
    type: 'multiselect',
    label: 'Transaction Type',
    optionsSource: 'type',
    dataField: 'type',
    icon: <DollarSign size={16} />,
    placeholder: 'Select types',
    searchPlaceholder: 'Search types...'
  },
  {
    key: 'accounts',
    type: 'multiselect',
    label: 'Accounts',
    optionsSource: 'account',
    dataField: 'account',
    icon: <DollarSign size={16} />,
    placeholder: 'Select accounts',
    searchPlaceholder: 'Search accounts...'
  }
];

/**
 * Helper function to get filter configuration by page name
 */
export const getFilterConfigsByPage = (pageName) => {
  const configs = {
    music: musicFilterConfigs,
    reading: readingFilterConfigs,
    movies: moviesFilterConfigs,
    podcast: podcastFilterConfigs,
    nutrition: nutritionFilterConfigs,
    finance: financeFilterConfigs
  };

  return configs[pageName] || [];
};

/**
 * Helper function to create a custom filter config
 * Use this when you need a one-off filter that doesn't fit standard patterns
 */
export const createCustomFilter = (config) => {
  const defaults = {
    placeholder: `Select ${config.label?.toLowerCase() || 'items'}`,
    searchPlaceholder: `Search ${config.label?.toLowerCase() || 'items'}...`,
    icon: <Tag size={16} />
  };

  return { ...defaults, ...config };
};

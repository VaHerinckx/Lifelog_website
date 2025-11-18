// src/config/config.js
export const DRIVE_FILES = {
  PODCAST: {
    FILE_ID: import.meta.env.VITE_PODCAST_FILE_ID
  },
  READING: {
    FILE_ID: import.meta.env.VITE_READING_FILE_ID
  },
  READING_BOOKS: {
    FILE_ID: import.meta.env.VITE_READING_BOOKS_FILE_ID
  },
  READING_SESSIONS: {
    FILE_ID: import.meta.env.VITE_READING_SESSIONS_FILE_ID
  },
  MUSIC: {
    FILE_ID: import.meta.env.VITE_MUSIC_FILE_ID
  },
  MOVIES: {
    FILE_ID: import.meta.env.VITE_MOVIES_FILE_ID || '1CRuCIYgpjFuGHnmi006ollOQrKO_4ewm'
  },
  TRAKT: {
    FILE_ID: import.meta.env.VITE_TRAKT_FILE_ID
  },
  HEALTH: {
    FILE_ID: import.meta.env.VITE_HEALTH_FILE_ID
  },
  NUTRITION: {
    FILE_ID: import.meta.env.VITE_NUTRITION_FILE_ID
  },
  FINANCES: {
    FILE_ID: import.meta.env.VITE_FINANCES_FILE_ID
  }
};

export const getDriveDownloadUrl = (fileId) => {
  return `http://localhost:3001/api/google-drive/${fileId}`;
};

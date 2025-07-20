// src/config/config.js
export const DRIVE_FILES = {
  PODCAST: {
    FILE_ID: import.meta.env.VITE_PODCAST_FILE_ID
  },
  READING: {
    FILE_ID: import.meta.env.VITE_READING_FILE_ID
  },
  MUSIC: {
    FILE_ID: import.meta.env.VITE_MUSIC_FILE_ID
  },
  MOVIES: {
    FILE_ID: import.meta.env.VITE_MOVIES_FILE_ID || '1CRuCIYgpjFuGHnmi006ollOQrKO_4ewm'
  },
  TRAKT: {
    FILE_ID: import.meta.env.VITE_TRAKT_FILE_ID
  }
};

// Add debugging after object declaration
console.log('🎵 DRIVE_FILES object:', DRIVE_FILES);
console.log('🎵 MUSIC config:', DRIVE_FILES.MUSIC);
console.log('🎵 MUSIC FILE_ID:', DRIVE_FILES.MUSIC?.FILE_ID);

console.log('🎬 MOVIES FILE_ID check:', {
  env_var: import.meta.env.VITE_MOVIES_FILE_ID,
  final_id: import.meta.env.VITE_MOVIES_FILE_ID || '1CRuCIYgpjFuGHnmi006ollOQrKO_4ewm'
});

// Add debugging
console.log('Environment variables:', {
  podcast_id: import.meta.env.VITE_PODCAST_FILE_ID,
  reading_id: import.meta.env.VITE_READING_FILE_ID,
  music_id: import.meta.env.VITE_MUSIC_FILE_ID,
  all_env: import.meta.env
});

export const getDriveDownloadUrl = (fileId) => {
  console.log('🔥 getDriveDownloadUrl called with fileId:', fileId);
  console.log('🔥 fileId type:', typeof fileId);
  console.log('🔥 Stack trace:', new Error().stack);
  const url = `http://localhost:3001/api/google-drive/${fileId}`;
  console.log('🔥 Generated URL:', url);
  return url;
};

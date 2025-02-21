// src/config/config.js
export const DRIVE_FILES = {
  PODCAST: {
    FILE_ID: import.meta.env.VITE_PODCAST_FILE_ID  // Changed from REACT_APP to VITE
  }
};

// Add debugging
console.log('Environment variables:', {
  podcast_id: import.meta.env.VITE_PODCAST_FILE_ID,
  all_env: import.meta.env
});

export const getDriveDownloadUrl = (fileId) => {
  console.log('Getting download URL for fileId:', fileId);
  const url = `http://localhost:3001/api/google-drive/${fileId}`;
  console.log('Generated URL:', url);
  return url;
};

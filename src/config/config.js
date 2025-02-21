// src/config/config.js

export const DRIVE_FILES = {
  PODCAST: {
      FILE_ID: process.env.REACT_APP_PODCAST_FILE_ID
  }
};

export const getDriveDownloadUrl = (fileId) => {
  return `http://localhost:3001/api/google-drive/${fileId}`;
};

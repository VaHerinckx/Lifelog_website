// src/config/config.js

export const DRIVE_FILES = {
  PODCAST: {
      FILE_ID: '1kcN66NQNymiIIyfsCaXSWZ5ALIQJxTmZ'
  }
};

export const getDriveDownloadUrl = (fileId) => {
  return `http://localhost:3001/api/google-drive/${fileId}`;
};

import express from 'express';
import cors from 'cors';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// CORS configuration - restrict to allowed origin in production
const corsOptions = {
  origin: process.env.ALLOWED_ORIGIN || 'http://localhost:5173',
  credentials: true
};
app.use(cors(corsOptions));

// Rate limiting for API endpoints
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.'
});
app.use('/api/', limiter);

// API endpoint for Google Drive files
app.get('/api/google-drive/:fileId', async (req, res) => {
    try {
        const fileId = req.params.fileId;

        // Only log in development
        if (process.env.NODE_ENV !== 'production') {
            console.log(`Fetching Google Drive file: ${fileId}`);
        }

        const response = await axios({
            url: `https://drive.google.com/uc?export=download&id=${fileId}`,
            method: 'GET',
            responseType: 'text',
            timeout: 60000, // 60 seconds timeout
            maxContentLength: 100 * 1024 * 1024, // 100MB max
            maxBodyLength: 100 * 1024 * 1024 // 100MB max
        });

        if (process.env.NODE_ENV !== 'production') {
            console.log(`Successfully fetched file ${fileId}, size: ${response.data.length} characters`);
        }
        res.send(response.data);
    } catch (error) {
        console.error(`Error fetching file:`, error.message);
        if (error.code === 'ECONNABORTED') {
            res.status(504).send('Request timeout - file too large or connection slow');
        } else if (error.response) {
            res.status(error.response.status).send(error.response.data);
        } else {
            res.status(500).send(error.message);
        }
    }
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));

    // Handle React Router - serve index.html for all non-API routes
    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api/')) {
            return next();
        }
        res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

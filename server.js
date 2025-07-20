import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
app.use(cors());

app.get('/api/google-drive/:fileId', async (req, res) => {
    try {
        const fileId = req.params.fileId;
        console.log(`Fetching Google Drive file: ${fileId}`);
        
        const response = await axios({
            url: `https://drive.google.com/uc?export=download&id=${fileId}`,
            method: 'GET',
            responseType: 'text',
            timeout: 60000, // 60 seconds timeout
            maxContentLength: 100 * 1024 * 1024, // 100MB max
            maxBodyLength: 100 * 1024 * 1024 // 100MB max
        });

        console.log(`Successfully fetched file ${fileId}, size: ${response.data.length} characters`);
        res.send(response.data);
    } catch (error) {
        console.error(`Error fetching file ${req.params.fileId}:`, error.message);
        if (error.code === 'ECONNABORTED') {
            res.status(504).send('Request timeout - file too large or connection slow');
        } else if (error.response) {
            res.status(error.response.status).send(error.response.data);
        } else {
            res.status(500).send(error.message);
        }
    }
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

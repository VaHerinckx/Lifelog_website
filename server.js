import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
app.use(cors());

app.get('/api/google-drive/:fileId', async (req, res) => {
    try {
        const fileId = req.params.fileId;
        const response = await axios({
            url: `https://drive.google.com/uc?export=download&id=${fileId}`,
            method: 'GET',
            responseType: 'text'
        });

        res.send(response.data);
    } catch (error) {
        console.error('Error fetching file:', error);
        res.status(500).send(error.message);
    }
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

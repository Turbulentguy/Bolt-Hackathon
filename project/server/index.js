import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { searchAndSummarize } from './arxivService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'AI Paper Summarizer API is running' });
});

// Main endpoint for processing papers
app.post('/api/process-paper', async (req, res) => {
  try {
    const { query, maxResults = 1 } = req.body;
    
    if (!query) {
      return res.status(400).json({ 
        error: 'Query parameter is required' 
      });
    }

    console.log(`Processing query: ${query}`);
    
    const result = await searchAndSummarize(query, maxResults);
    
    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error processing paper:', error);
    res.status(500).json({ 
      error: 'Failed to process paper',
      message: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
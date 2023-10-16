const express = require('express');
const multer = require('multer');  // For handling multipart/form-data (file uploads)
const { FileToEmbedding, getAnswer } = require('../../models/FileToEmbedding');
const router = express.Router();

// Middleware setup for file uploads
const storage = multer.memoryStorage(); // Store the file in memory
const upload = multer({ storage: storage });

// PDF processing endpoint
router.post('/process-pdf', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileBuffer = req.file.buffer;

    const embeddings = await FileToEmbedding(fileBuffer);  // Call the function from processfiles.js
    res.json({ embeddings: embeddings });
  } catch (error) {
    console.error('Error while processing file:', error);
    res.status(500).json({ error: 'Failed to process the file' });
  }
});

// Question and answer endpoint
router.post('/docchat-question', async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).send('Question is required.');
    }
    const answer = await getAnswer(question);
    res.json(answer);
  } catch (error) {
    console.error('Error getting the answer:', error);
    res.status(500).send(`Failed to get the answer: ${error.message}`);
  }
});

module.exports = router;
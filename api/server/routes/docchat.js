const express = require('express');
const multer = require('multer');
const { storePDF, docSummarization, processMessageForSummary } = require('../../models/FileToEmbedding'); // Assuming this is the correct path
const router = express.Router();
const path = require('path');

// Middleware setup for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
require('dotenv').config();
const storagePath = process.env.FILE_STORAGE_PATH;

router.post('/store-pdf', upload.single('file'), async (req, res) => {
  console.log('store-pdf route hit');
  try {
    if (!req.file) {
      console.log('No file provided in /store-pdf.');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileBuffer = req.file.buffer;
    const fileId = await storePDF(fileBuffer);
    console.log('File stored with ID:', fileId);
    res.json({ fileId: fileId });

  } catch (error) {
    console.error('Error while storing file:', error);
    res.status(500).json({ error: 'Failed to store the file' });
  }
});

// PDF processing endpoint
router.post('/process-pdf', async (req, res) => {
  try {
    const fileId = req.body.fileId;

    if (!fileId) {
      console.log('No fileId provided in /process-pdf.');
      return res.status(400).json({ error: 'No fileId provided' });
    }

    const filePath = path.join(storagePath, `${fileId}.pdf`);
    const summary = await docSummarization(filePath);

    console.log('Summary from /process-pdf:', summary);
    res.json({ summary: summary });

  } catch (error) {
    console.error('Error while processing file:', error);
    res.status(500).json({ error: 'Failed to process the file' });
  }
});

// New endpoint for message processing and summarization
router.post('/processMessageForSummary', async (req, res) => {
  console.log('Received request at /processMessageForSummary');

  try {
    const message = req.body.message; // Expecting the message in the request body

    console.log('Request body:', req.body); // Log the entire request body
    console.log('Received message:', message); // Log the extracted message

    if (!message) {
      console.log('No message provided in /processMessageForSummary.');
      return res.status(400).json({ error: 'No message provided' });
    }

    console.log('Attempting to process the message for summary...');
    const summary = await processMessageForSummary(message);
    console.log('Generated summary:', summary); // Log the generated summary

    res.status(200).json({ summary });

  } catch (error) {
    console.error('Error processing message:', error);
    res.status(500).json({ error: 'Failed to process the message' });
  }
});

module.exports = router;
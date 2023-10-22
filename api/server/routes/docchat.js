const express = require('express');
const multer = require('multer');
const { docSummarization } = require('../../models/FileToEmbedding'); // <-- Make sure to set the correct path
const router = express.Router();

// Middleware setup for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// PDF processing endpoint
router.post('/process-pdf', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      console.log('No file provided in /process-pdf.');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileBuffer = req.file.buffer;
    const summary = await docSummarization(fileBuffer);
    console.log('Summary from /process-pdf:', summary);
    res.json({ summary: summary });

  } catch (error) {
    console.error('Error while processing file:', error);
    res.status(500).json({ error: 'Failed to process the file' });
  }
});

module.exports = router;
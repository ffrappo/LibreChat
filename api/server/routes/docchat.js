const express = require('express');
const multer = require('multer');
const { storePDF, docSummarization } = require('../../models/FileToEmbedding'); // <-- Make sure to set the correct path
const router = express.Router();
const path = require('path');

// Middleware setup for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
require('dotenv').config();
const storagePath = process.env.FILE_STORAGE_PATH;

router.post('/store-pdf', upload.single('file'), async (req, res) => {
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

module.exports = router;
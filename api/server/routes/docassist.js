const express = require('express');
const multer = require('multer');
const docSummarization = require('../../models/docSummarization');
const router = express.Router();

// Middleware setup for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// PDF processing endpoint
router.post('/process-pdf', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileBuffer = req.file.buffer; // Access the uploaded file's buffer
    const summary = await docSummarization(fileBuffer); // Process the PDF and get a summary
    res.json({ summary });
  } catch (error) {
    console.error('Error processing the PDF:', error);
    res.status(500).json({ error: 'Error processing the PDF' });
  }
});

module.exports = router;
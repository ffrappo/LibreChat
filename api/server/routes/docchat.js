const express = require('express');
const multer = require('multer');  // For handling multipart/form-data (file uploads)
const File2Embedding = require('../../models/File2Embedding');  // Assuming processfiles.js is located in a 'scripts' directory

const router = express.Router();

const storage = multer.memoryStorage(); // Store the file in memory
const upload = multer({ storage: storage });

router.post('/process-pdf', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileBuffer = req.file.buffer;

    const embeddings = await File2Embedding(fileBuffer);  // Call the function from processfiles.js
    res.json({ embeddings: embeddings });
  } catch (error) {
    console.error('Error while processing file:', error);
    res.status(500).json({ error: 'Failed to process the file' });
  }
});

module.exports = router;

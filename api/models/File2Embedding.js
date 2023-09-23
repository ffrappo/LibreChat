const express = require('express');
const multer = require('multer');
const { PDFLoader } = require('langchain/document_loaders/fs/pdf');
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');
const { FaissStore } = require('langchain/vectorstores/faiss');
const { OpenAIEmbeddings } = require('langchain/embeddings/openai');

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/process-pdf', upload.single('file'), async (req, res) => {
  try {
    const fileBuffer = req.file.buffer;

    const loader = new PDFLoader(fileBuffer, { splitPages: false });
    const docs = await loader.load();

    const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000 });
    const chunkedDocs = await textSplitter.createDocuments([docs]);
    const newDocEmbeddings = await FaissStore.fromDocuments(chunkedDocs, new OpenAIEmbeddings());

    res.json({ embeddings: newDocEmbeddings });
  } catch (error) {
    console.error('Error processing the PDF:', error);
    res.status(500).json({ error: 'Failed to process the PDF.' });
  }
});

module.exports = router;

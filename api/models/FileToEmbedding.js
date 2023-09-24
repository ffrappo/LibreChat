const fs = require('fs').promises;  // Use promises API for file operations
const path = require('path');
const { PDFLoader } = require('langchain/document_loaders/fs/pdf');
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');
const { FaissStore } = require('langchain/vectorstores/faiss');
const { OpenAIEmbeddings } = require('langchain/embeddings/openai');

/**
 * Processes a file buffer and returns embeddings.
 * @param {Buffer} fileBuffer - The buffer of the uploaded file.
 * @returns {Promise<any>} A promise that resolves with the embeddings.
 */
async function FileToEmbedding(fileBuffer) {
  // Generate a temporary file name
  const tempFileName = path.join(__dirname, `${Date.now()}.pdf`);

  try {
    // Save the buffer to a temporary file
    await fs.writeFile(tempFileName, fileBuffer);

    // Load the PDF from the temporary file
    const loader = new PDFLoader(tempFileName, { splitPages: false });
    const docs = await loader.load();
    // const texts = docs.map(doc => doc.content);

    // Process the PDF content
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 10,
      chunkOverlap: 1,
    });

    const chunkedDocs = await textSplitter.splitDocuments([docs]);

    const embeddings = await FaissStore.fromDocuments(chunkedDocs, new OpenAIEmbeddings());

    return embeddings;
  } finally {
    // Always try to remove the temporary file, even if there was an error during processing
    await fs.unlink(tempFileName).catch(err => {
      console.error('Error removing temporary file:', err);
    });
  }
}

module.exports = FileToEmbedding;

const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { OpenAI } = require('langchain/llms/openai');
const { PDFLoader } = require('langchain/document_loaders/fs/pdf');
const { TokenTextSplitter } = require('langchain/text_splitter');
const { loadSummarizationChain } = require('langchain/chains');
require('dotenv').config();

const storagePath = process.env.FILE_STORAGE_PATH;

async function storePDF(fileBuffer) {
  let tempFileName;

  try {
    const fileId = uuidv4();
    tempFileName = path.join(storagePath, `${fileId}.pdf`);

    // Check if directory exists, if not create it
    const dirPath = path.dirname(tempFileName);
    if (!fs.existsSync(dirPath)) {
      await fsPromises.mkdir(dirPath, { recursive: true });
    }

    await fsPromises.writeFile(tempFileName, fileBuffer);
    return fileId;
  } catch (error) {
    console.error('An error occurred while storing the file:', error);
    throw error;
  }
}

function extractFileIdFromMessage(message) {
  console.log('Attempting to extract File ID from the message...');
  const match = message.match(/File ID: ([\w-]+)/);
  console.log('Extracted File ID:', match ? match[1] : null);
  return match ? match[1] : null;
}

async function docSummarization(fileId) {
  try {
    console.log(`Starting docSummarization for File ID: ${fileId}`);

    // Generate the filePath using the given fileId
    const filePath = path.join(storagePath, `${fileId}.pdf`);
    console.log(`Generated file path: ${filePath}`);

    // Ensure the file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File with ID ${fileId} not found.`);
    }

    // Continue with the existing logic
    const loader = new PDFLoader(filePath, { splitPages: false });
    const docs = await loader.load();
    console.log('PDF loaded successfully.');

    const textSplitter = new TokenTextSplitter({
      chunkOverlap: 10,
      chunkSize: 100,
    });
    const inputDocs = await textSplitter.splitDocuments(docs);
    console.log('Text split into documents successfully.');

    const model = new OpenAI({ temperature: 0 });
    console.log('OpenAI model initialized.');

    const chain = loadSummarizationChain(model, { type: 'map_reduce' });
    console.log('Summarization chain loaded.');

    const response = await chain.call({
      input_documents: inputDocs,
    });
    console.log('Summarization completed. Response:', response.text);

    return response.text;

  } catch (error) {
    console.error('An error occurred in docSummarization:', error);
    throw error;
  }
}

async function processMessageForSummary(message) {
  try {
    console.log('Starting processMessageForSummary...');

    const fileId = extractFileIdFromMessage(message);
    if (!fileId) {
      throw new Error('File ID not found in the message.');
    }

    console.log(`Processing summary for File ID: ${fileId}`);
    return await docSummarization(fileId);

  } catch (error) {
    console.error('An error occurred in processMessageForSummary:', error);
    throw error;
  }
}

module.exports = { storePDF, docSummarization, processMessageForSummary };

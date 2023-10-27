const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { OpenAI } = require('langchain/llms/openai');
const { PDFLoader } = require('langchain/document_loaders/fs/pdf');
const { TokenTextSplitter } = require('langchain/text_splitter');
const { loadSummarizationChain } = require('langchain/chains');
// const { PromptTemplate } = require('langchain/prompts');

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

async function docSummarization(filePath) {
  try {
    // There's no need for a temporary file anymore, so we'll directly load from the given filePath
    const loader = new PDFLoader(filePath, { splitPages: false });
    const docs = await loader.load();

    const textSplitter = new TokenTextSplitter({
      chunkOverlap: 10,
      chunkSize: 100,
    });

    const inputDocs = await textSplitter.splitDocuments(docs);

    const model = new OpenAI({ temperature: 0 });
    const chain = loadSummarizationChain(model, { type: 'map_reduce' });

    const response = await chain.call({
      input_documents: inputDocs,
    });

    console.log(response.text);
    return response.text;

  } catch (error) {
    console.error('An error occurred:', error);
    throw error;
  }
  // The "finally" block is removed since we're not dealing with temp files here anymore
}

module.exports = { storePDF, docSummarization };

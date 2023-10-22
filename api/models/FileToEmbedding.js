const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { OpenAI } = require('langchain/llms/openai');
const { PDFLoader } = require('langchain/document_loaders/fs/pdf');
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');
const { loadSummarizationChain } = require('langchain/chains');
// const { PromptTemplate } = require('langchain/prompts');

async function docSummarization(fileBuffer) {
  let tempFileName;  // <-- Declare tempFileName here, outside the try block

  try {
    tempFileName = path.join(__dirname, `${uuidv4()}.pdf`);

    await fs.writeFile(tempFileName, fileBuffer);

    const loader = new PDFLoader(tempFileName, { splitPages: false });
    const docs = await loader.load();

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkOverlap: 10,
      chunkSize: 100,
    });

    const inputDocs = await textSplitter.createDocuments(docs);

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
  } finally {
    if (tempFileName) {
      try {
        await fs.unlink(tempFileName);
        console.log('Temporary file deleted:', tempFileName);
      } catch (unlinkError) {
        console.error('Error deleting temporary file:', unlinkError);
      }
    }
  }
}

module.exports = { docSummarization };
const fs = require('fs').promises;
const path = require('path');
const { PDFLoader } = require('langchain/document_loaders/fs/pdf');
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');
const { FaissStore } = require('langchain/vectorstores/faiss');
const { OpenAIEmbeddings } = require('langchain/embeddings/openai');
const { OpenAI } = require('langchain/llms/openai');
const { v4: uuidv4 } = require('uuid');
const { PromptTemplate } = require('langchain/prompts');
const { RetrievalQAChain, loadQAStuffChain } = require('langchain/chains');

// Load environment variables from .env file
require('dotenv').config();
const storagePath = process.env.EMBEDDING_STORAGE_PATH;

async function FileToEmbedding(fileBuffer) {
  console.log('Starting FileToEmbedding function.');

  const tempFileName = path.join(__dirname, `${uuidv4()}.pdf`);
  try {
    await fs.writeFile(tempFileName, fileBuffer);
    const loader = new PDFLoader(tempFileName, { splitPages: false });
    const docs = await loader.load();
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkOverlap: 10,
      chunkSize: 100,
    });
    const chunkedDocs = await textSplitter.splitDocuments(docs);
    const embeddings = await FaissStore.fromDocuments(chunkedDocs, new OpenAIEmbeddings());
    await embeddings.save(storagePath)

    return embeddings;
  } catch (error) {
    console.error('Error during FileToEmbedding operation:', error);
    throw error;
  } finally {
    await fs.unlink(tempFileName).catch(err => {
      console.error('Error removing temporary file:', err);
    });
  }
}

async function getAnswer(query) {
  // load vectorstore
  const embeddings = await FaissStore.load(
    process.env.EMBEDDING_STORAGE_PATH,
    new OpenAIEmbeddings()
  );
  const retriever = embeddings.asRetriever();
  const model = new OpenAI({ temperature: 0 });
  const template = `Use the following pieces of context to answer the question at the end.
    If you don't know the answer, just say that you don't know, don't try to make up an answer.
    Use three sentences maximum and keep the answer as concise as possible.
    Always say "thanks for asking!" at the end of the answer.
    {context}
    Question: {question}
    Helpful Answer:`;

  const QA_CHAIN_PROMPT = new PromptTemplate({
    inputVariables: ['context', 'question'],
    template,
  });

  const chain = new RetrievalQAChain({
    combineDocumentsChain: loadQAStuffChain(model, { prompt: QA_CHAIN_PROMPT }),
    retriever,
    returnSourceDocuments: true,
    inputKey: 'question',
  });

  const response = await chain.call({
    question: query,
  });

  console.log(response.text);

  return response.text
}

module.exports = { FileToEmbedding, getAnswer };
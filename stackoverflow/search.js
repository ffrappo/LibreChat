const readline = require('readline');
const axios = require('axios');
const open = require('openurl').open;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function searchStackOverflow(question) {
  const url = `https://api.stackexchange.com/2.3/search/advanced?q=${encodeURIComponent(
    question
  )}&site=stackoverflow`;

  try {
    const response = await axios.get(url);
    const results = response.data.items;

    if (results.length > 0) {
      const answerId = results[0].accepted_answer_id;
      if (answerId !== undefined) {
        const answerUrl = `https://stackoverflow.com/a/${answerId}`;
        console.log('URL to the answer:', answerUrl);
        open(answerUrl);
      } else {
        console.log('No accepted answer found for the question.');
      }
    } else {
      console.log('No results found for the question.');
    }
  } catch (error) {
    console.error('Error occurred while searching Stack Overflow:', error);
  }
}

function askQuestion() {
  rl.question('Enter your question (or type "exit" to quit): ', (question) => {
    if (question.toLowerCase() === 'exit') {
      rl.close();
      return;
    }
    searchStackOverflow(question);
    askQuestion();
  });
}

askQuestion();

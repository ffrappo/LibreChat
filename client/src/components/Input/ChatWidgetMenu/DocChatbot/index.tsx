import React, { useState, useEffect } from 'react';
import axios from 'axios';
// import { Label } from '~/components/ui';
import { cn } from '~/utils';
import EndpointOptionsPopover from '~/components/Endpoints/EndpointOptionsPopover';
import { useRecoilState } from 'recoil';
import store from '~/store';

function DocChatbot() {
  const [file, setFile] = useState<File | null>(null);
  const [setDocEmbeddings] = useState<any>(null);  // Consider using a more specific type than any
  const [uploadPercentage, setUploadPercentage] = useState<number>(0);
  const [widget, setWidget] = useRecoilState(store.widget);
  const [userInput, setUserInput] = useState<string>('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
    };

    setIsDarkMode(mediaQuery.matches);

    mediaQuery.addEventListener('change', handler);

    return () => {
      mediaQuery.removeEventListener('change', handler);
    };
  }, []);

  // Function to call the backend
  const sendPDFToServer = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('/api/docchat/process-pdf', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadPercentage(percentCompleted);
        }
      });

      return response.data.embeddings;
    } catch (error) {
      console.error('Error processing the PDF:', error.response?.data?.error || error.message);
      throw error;
    }
  }

  const processPDF = async () => {
    if (!file) {
      alert('Please upload a PDF file first.');
      return;
    }

    try {
      const newDocEmbeddings = await sendPDFToServer(file);
      setDocEmbeddings(newDocEmbeddings);
      alert('PDF processed successfully!');
    } catch (error) {
      alert('There was an error processing the uploaded PDF. Please try again.');
    } finally {
      setUploadPercentage(0); // Reset the progress bar after upload completes (success or fail)
    }
  }

  const askQuestion = async () => {
    if (!userInput.trim()) {
      console.log('Input is empty or only spaces');
      return;
    }
    try {
      const response = await axios.post('/api/docchat/docchat-question', {
        question: userInput,
      });

      setAnswer(response.data.Answer);
      setReference(response.data.Reference);

    } catch (error) {
      console.error('Error fetching the answer:', error.response?.data?.error || error.message);
      alert('There was an error processing your question. Please try again.');
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    askQuestion();
    setUserInput('');
  };

  const content = () => (
    <div className="px-4 py-4 max-h-[450px] h-[60vh] overflow-y-auto md:h-[450px]">
      <div className="flex flex-col gap-4">
        <input
          type="file"
          id="fileUpload"
          accept=".pdf"
          onChange={(e) => setFile(e.target.files?.[0])}
          style={{ display: 'none' }} // This hides the default input
          className={cn(
            'border rounded-md px-3 py-2',
            'hover:border-gray-500',
            'focus:border-blue-500 focus:outline-none'
          )}
        />
        <label htmlFor="fileUpload" className="bg-blue-500 text-white rounded-md px-4 py-2 hover:bg-blue-600 transition-colors duration-200 cursor-pointer">
          Upload PDF File
        </label>
        {file && <p className="text-green-500">File uploaded: {file.name}</p>}
        <button
          onClick={processPDF}
          style={{ textAlign: 'left' }}
          className="bg-blue-500 text-white rounded-md px-4 py-2 hover:bg-blue-600 transition-colors duration-200"
        >
                    Process PDF
        </button>
        {uploadPercentage > 0 && (
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                                    Uploading...
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold inline-block text-blue-600">
                  {uploadPercentage}%
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
              <div style={{ width: `${uploadPercentage}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"></div>
            </div>
          </div>
        )}

        {/* User Input Submission */}
        <form onSubmit={handleSubmit} className="mt-4">
          <h3 className="text-xl font-bold">Ask a question</h3>
          <div className="flex">
            <input
              id="userInput"
              type="text"
              placeholder="Please enter your question..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              style={{
                backgroundColor: isDarkMode ? '#333' : 'white', // Dark background for dark mode, white for light
                color: isDarkMode ? 'white' : 'black'           // White text for dark mode, black for light
              }}
              className={cn(
                'flex-grow border rounded-md px-3 py-2',
                'hover:border-gray-500',
                'focus:border-blue-500 focus:outline-none'
              )}
            />
            <button type="submit" className="bg-green-500 text-white rounded-md px-4 py-2 ml-2 hover:bg-green-600 transition-colors duration-200">
            Submit
            </button>
          </div>
        </form>
        {/* Display Answer and Reference */}
        <div className="mt-4">
          <h3 className="text-xl font-bold">Answer:</h3>
          <p>{answer}</p>
        </div>
        <div className="mt-2">
          <h3 className="text-lg font-semibold">Reference:</h3>
          <p>{reference}</p>
        </div>
      </div>
    </div>
  );

  return (
    <EndpointOptionsPopover
      content={content()}
      widget={true}
      visible={widget === 'docbot'}
      switchToSimpleMode={() => setWidget('')}
    />
  );
}

export default DocChatbot;

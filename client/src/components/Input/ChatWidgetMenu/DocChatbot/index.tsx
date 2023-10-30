import React, { useState } from 'react';
import { cn } from '~/utils';
import { useRecoilState } from 'recoil';
import store from '~/store';
import axios from 'axios';
import EndpointOptionsPopover from '~/components/Endpoints/EndpointOptionsPopover';

function DocChatbot() {
  const [file, setFile] = useState<File | null>(null);
  const [fileId, setFileId] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [setText] = useRecoilState(store.text);
  // need to keep text to render the DocAssistant frontend?
  // const [text, setText] = useRecoilState(store.text);
  const [widget, setWidget] = useRecoilState(store.widget);
  const MAX_FILE_SIZE_MB = 10;

  const defaultTextProps = `
        rounded-md
        border border-gray-200
        focus:border-slate-400
        focus:bg-gray-50
        bg-transparent
        text-sm
        shadow-[0_0_10px_rgba(0,0,0,0.05)]
        outline-none
        placeholder:text-gray-400
        focus:outline-none
        focus:ring-gray-400
        focus:ring-opacity-20
        focus:ring-offset-2
        disabled:cursor-not-allowed
        disabled:opacity-50
        dark:border-gray-500
        dark:bg-gray-700
        focus:dark:bg-gray-600
        dark:text-gray-50
        dark:shadow-[0_0_15px_rgba(0,0,0,0.10)]
        dark:focus:border-gray-400
        dark:focus:outline-none
        dark:focus:ring-0
        dark:focus:ring-gray-400
        dark:focus:ring-offset-0
      `.trim().replace(/\s+/g, ' ');

  const storePDF = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    setIsLoading(true);
    try {
      const response = await axios.post('/api/docchat/store-pdf', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setFileId(response.data.fileId);
      if (response.data.fileId) {
        fetchSummary(response.data.fileId);
      }
    } catch (error) {
      setErrorMessage('Error storing the PDF. Please try again.');
      console.error('Error storing the PDF:', error.response?.data?.error || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSummary = async (fileId: string) => {
    setIsLoading(true);
    try {
      const response = await axios.get(`/api/docchat/process-pdf/${fileId}`);
      setSummary(response.data.summary);
    } catch (error) {
      setErrorMessage('Error fetching the summary. Please try again.');
      console.error('Error fetching the summary:', error.response?.data?.error || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        setErrorMessage('Only PDF files are allowed.');
        return;
      }
      if (selectedFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setErrorMessage(`File size exceeds ${MAX_FILE_SIZE_MB}MB limit.`);
        return;
      }

      setErrorMessage(null);
      setFile(selectedFile);
      storePDF(selectedFile);
    }
  };

  const setTextHandler = () => {
    if (fileId) {
      const commandMsg = `Type: DocAssistant\n\nFile ID: ${fileId}\n\nCommand: Process and return summary for File ID ${fileId}`;
      setText(commandMsg);
    }
  };

  const content = () => {
    return (
      <div className="pb-12 max-h-[450px] h-[60vh] overflow-y-auto md:h-[450px]">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="col-span-1 flex flex-col items-center justify-start gap-6">
            <input
              type="file"
              id="fileUpload"
              accept=".pdf"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              aria-label="Upload PDF file"
            />
            <label htmlFor="fileUpload" className="bg-gray-600 text-white rounded-md px-4 py-2 hover:bg-gray-700 focus:bg-gray-600 transition-colors duration-200 cursor-pointer">
              Upload PDF File
            </label>
            {file && <div className="border border-gray-300 p-3 rounded-md">
              <p>Selected File: {file.name}</p>
            </div>}
            {errorMessage && <p className="text-red-500">{errorMessage}</p>}
          </div>
          <div className="col-span-1 flex flex-col items-center justify-start gap-6">
            <p className={cn(defaultTextProps, 'flex max-h-[300px] min-h-[100px] w-full resize-none px-3 py-2')}>
              {isLoading ? 'Generating summary...' : summary}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <EndpointOptionsPopover
      content={<div className="px-4 py-4">{content()}</div>}
      widget={true}
      visible={widget === 'docbot'}
      saveAsPreset={setTextHandler}
      switchToSimpleMode={() => {
        setWidget('');
      }}
    />
  );
}

export default DocChatbot;

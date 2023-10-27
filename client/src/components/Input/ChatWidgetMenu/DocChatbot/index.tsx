import React, { useState } from 'react';
import { Label } from '~/components/ui';
// import { Label, SelectDropDown } from '~/components/ui';
import { cn } from '~/utils';
import EndpointOptionsPopover from '~/components/Endpoints/EndpointOptionsPopover';
import { useRecoilState } from 'recoil';
import store from '~/store';
import axios from 'axios';

const defaultTextProps = '...'; // As in CodingAssistant

function DocChatbot() {
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [widget, setWidget] = useRecoilState(store.widget);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const MAX_FILE_SIZE_MB = 10;

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
      return response.data.fileId;
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

  const handleFileChange = (e) => {
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

  const handleGenerateSummary = async () => {
    if (file) {
      const fileId = await storePDF(file);
      if (fileId) {
        fetchSummary(fileId);
      }
    }
  };

  const content = () => (
    <div className="flex flex-col gap-6 items-start justify-center">
      <input
        type="file"
        id="fileUpload"
        accept=".pdf"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        aria-label="Upload PDF file"
      />
      <label htmlFor="fileUpload" className="bg-gray-600 text-white rounded-md px-4 py-2 hover:bg-gray-700 focus:bg-gray-600 transition-colors duration-200 cursor-pointer">
        Submit PDF File
      </label>
      {file && <div className="border border-gray-300 p-3 rounded-md">
        <p>Selected File: {file.name}</p>
      </div>}
      {errorMessage && <p className="text-red-500">{errorMessage}</p>}
      <Label htmlFor="summary" className="text-left text-sm font-medium">
        Summary:
      </Label>
      <div className={cn(defaultTextProps, 'flex max-h-[300px] min-h-[100px] w-full resize-none px-3 py-2')}>
        {isLoading ? 'Generating summary...' : summary}
      </div>
      <button onClick={handleGenerateSummary} className="bg-blue-500 text-white rounded-md px-4 py-2 hover:bg-blue-600 focus:bg-blue-500 transition-colors duration-200 cursor-pointer">
        Generate Summary
      </button>
    </div>
  );

  return (
    <EndpointOptionsPopover
      content={<div className="px-4 py-4">{content()}</div>}
      widget={true}
      visible={widget === 'docbot'}
      switchToSimpleMode={() => setWidget('')}
    />
  );
}

export default DocChatbot;

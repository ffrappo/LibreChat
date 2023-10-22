
import React, { useState } from 'react';
import { Label, SelectDropDown } from '~/components/ui';
import { cn } from '~/utils';
import EndpointOptionsPopover from '~/components/Endpoints/EndpointOptionsPopover';
import { useRecoilState } from 'recoil';
import store from '~/store';
import axios from 'axios';

const defaultTextProps = '...'; // As you have it in your CodingAssistant

function DocChatbot() {
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [widget, setWidget] = useRecoilState(store.widget);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const MAX_FILE_SIZE_MB = 10; // Change according to your requirements.

  const processPDF = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    setIsLoading(true);
    try {
      const response = await axios.post('/api/docchat/process-pdf', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setSummary(response.data.summary);
    } catch (error) {
      setErrorMessage('Error processing the PDF. Please try again.');
      console.error('Error processing the PDF:', error.response?.data?.error || error.message);
    } finally {
      setIsLoading(false);
    }
  }

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
      processPDF(selectedFile);
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

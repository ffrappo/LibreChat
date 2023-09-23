import React, { useState } from 'react';
import axios from 'axios';
import { Label } from '~/components/ui';
import { cn } from '~/utils';
import EndpointOptionsPopover from '~/components/Endpoints/EndpointOptionsPopover';
import { useRecoilState } from 'recoil';
import store from '~/store';

function DocChatbot() {
  const [file, setFile] = useState<File | null>(null);
  const [docEmbeddings, setDocEmbeddings] = useState(null);
  const [uploadPercentage, setUploadPercentage] = useState(0);
  const [widget, setWidget] = useRecoilState(store.widget);

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

  const content = () => (
    <div className="px-4 py-4 max-h-[450px] h-[60vh] overflow-y-auto md:h-[450px]">
      <div className="flex flex-col gap-4">
        <Label htmlFor="fileUpload" className="text-left text-sm font-medium">Upload PDF</Label>
        <input
          type="file"
          id="fileUpload"
          accept=".pdf"
          onChange={(e) => setFile(e.target.files?.[0])}
          className={cn(
            'border rounded-md px-3 py-2',
            'hover:border-gray-500',
            'focus:border-blue-500 focus:outline-none'
          )}
        />
        {file && <p className="text-green-500">File uploaded: {file.name}</p>}
        <button
          onClick={processPDF}
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
      </div>
    </div>
  );

  return (
    <EndpointOptionsPopover
      content={content()}
      widget={true}
      visible={widget === 'docbot'}
      switchToSimpleMode={() => {
        setWidget('');
      }}
    />
  );
}

export default DocChatbot;

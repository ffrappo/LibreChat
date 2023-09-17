import React from 'react';
import { useState } from 'react';
import { Label } from '~/components/ui';
import { cn } from '~/utils';
import EndpointOptionsPopover from '~/components/Endpoints/EndpointOptionsPopover';
import { useRecoilState } from 'recoil';
import store from '~/store';

function DocChatbot() {
  const [file, setFile] = useState<File | null>(null);
  const [widget, setWidget] = useRecoilState(store.widget);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (uploadedFile && uploadedFile.type === 'application/pdf') {
      setFile(uploadedFile);
    } else {
      alert('Please upload a valid PDF file.');
    }
  };

  const content = () => (
    <div className="px-4 py-4">
      <div className="flex flex-col gap-4">
        <Label htmlFor="fileUpload" className="text-left text-sm font-medium">Upload PDF</Label>
        <input
          type="file"
          id="fileUpload"
          accept=".pdf"
          onChange={handleFileChange}
          className={cn(
            'border rounded-md px-3 py-2',
            'hover:border-gray-500',
            'focus:border-blue-500 focus:outline-none'
          )}
        />
        {file && <p className="text-green-500">File uploaded: {file.name}</p>}
      </div>
    </div>
  );

  return (
    <EndpointOptionsPopover
      content={content()}
      widget={true}
      visible={widget === 'docbot'}
      saveAsPreset={() => {
        if (!file) alert('Please upload a PDF file first.');
        // Handle any other functionality you want when "Save" is pressed.
      }}
      switchToSimpleMode={() => {
        setWidget('');
      }}
    />
  );
}

export default DocChatbot;


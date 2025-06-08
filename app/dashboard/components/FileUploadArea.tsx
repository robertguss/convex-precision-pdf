import React, { useCallback, useState } from 'react';

import { useDropzone } from 'react-dropzone';

const UploadIcon = () => (
  <svg
    className="mx-auto mb-3 h-10 w-10 text-gray-400 transition-colors group-hover:text-blue-500"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
    ></path>
  </svg>
);

function FileUploadArea({ onFileSelect }) {
  const [dragMessage, setDragMessage] = useState('');

  const onDrop = useCallback(
    (acceptedFiles) => {
      setDragMessage('');
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    [onFileSelect],
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    multiple: false,
    onDragEnter: () => setDragMessage('Release to drop the file'),
    onDragLeave: () => setDragMessage(''),
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png'],
    },
  });

  return (
    <div
      {...getRootProps()}
      className={`group cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-all duration-200 ease-in-out sm:p-8 ${
        isDragActive
          ? 'scale-105 border-blue-500 bg-blue-50'
          : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
      }`}
    >
      <input {...getInputProps()} />
      <UploadIcon />
      {isDragActive ? (
        <p className="text-lg font-semibold text-blue-600">
          {dragMessage || 'Drop the file here ...'}
        </p>
      ) : (
        <>
          <p className="text-md font-medium text-gray-700 sm:text-lg">
            <span
              className="rounded font-semibold text-blue-600 hover:underline focus:ring-2 focus:ring-blue-400 focus:outline-none"
              onClick={(e) => {
                e.stopPropagation();
                open();
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.stopPropagation();
                  open();
                }
              }}
              tabIndex={0} // Make it focusable
              role="button"
            >
              Click to upload
            </span>{' '}
            or drag and drop
          </p>
          <p className="mt-1 text-xs text-gray-500 sm:text-sm">
            JPEG, PNG, PDF
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Max File size: 250MB, Max File pages: 50
          </p>
        </>
      )}
    </div>
  );
}

export default FileUploadArea;

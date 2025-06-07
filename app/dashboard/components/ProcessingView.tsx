// ABOUTME: Loading view component displayed while processing documents
// ABOUTME: Shows a spinner and processing message to the user
import React from 'react';

export const ProcessingView: React.FC = () => {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-gray-100">
      <div className="h-16 w-16 animate-spin rounded-full border-t-4 border-b-4 border-blue-500"></div>
      <p className="mt-4 text-lg text-gray-700">Processing document...</p>
      <p className="text-sm text-gray-500">(Actual processing time varies)</p>
    </div>
  );
};

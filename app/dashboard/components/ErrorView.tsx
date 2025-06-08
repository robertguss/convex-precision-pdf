// ABOUTME: Error view component displayed when document data fails to load
// ABOUTME: Shows error message and option to return to upload screen
import React from 'react';

interface ErrorViewProps {
  error: string | null;
  onReset: () => void;
}

export const ErrorView: React.FC<ErrorViewProps> = ({ error, onReset }) => {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-gray-100">
      <p className="text-lg text-red-500">
        Error: Document data is not available or failed to load.
      </p>
      {error && <p className="text-sm text-red-400">Details: {error}</p>}
      <button
        onClick={onReset}
        className="mt-4 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:ring-2 focus:ring-blue-300 focus:outline-none"
      >
        Go to Upload Screen
      </button>
    </div>
  );
};

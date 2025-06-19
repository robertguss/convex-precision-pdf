import React, { useCallback, useState } from "react";

import { useDropzone } from "react-dropzone";

interface PageUsage {
  used: number;
  limit: number;
  remaining: number;
}

interface FileUploadAreaProps {
  onFileSelect: (file: File) => void;
  pageUsage?: PageUsage | null;
}

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

function FileUploadArea({
  onFileSelect,
  pageUsage = null,
}: FileUploadAreaProps) {
  const [dragMessage, setDragMessage] = useState("");
  const hasPages = !pageUsage || pageUsage.remaining > 0;

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setDragMessage("");
      if (acceptedFiles.length > 0 && hasPages) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    [onFileSelect, hasPages],
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    multiple: false,
    onDragEnter: () => setDragMessage("Release to drop the file"),
    onDragLeave: () => setDragMessage(""),
    accept: {
      "application/pdf": [".pdf"],
      "image/jpeg": [".jpeg", ".jpg"],
      "image/png": [".png"],
    },
    disabled: !hasPages,
  });

  if (!hasPages && pageUsage) {
    return (
      <div className="rounded-lg border-2 border-dashed border-red-300 bg-red-50 p-6 text-center sm:p-8">
        <svg
          className="mx-auto mb-3 h-10 w-10 text-red-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <p
          className="text-lg font-semibold text-red-600 mb-2"
          data-cy="no-pages-remaining"
        >
          No pages remaining
        </p>
        <p className="text-sm text-gray-600 mb-4">
          You&apos;ve used all {pageUsage.limit} pages in your current plan.
        </p>
        <a
          href="/dashboard/upgrade"
          className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          data-cy="upgrade-plan-button"
        >
          Upgrade Plan
        </a>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={`group cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-all duration-200 ease-in-out sm:p-8 ${
        isDragActive
          ? "scale-105 border-blue-500 bg-blue-50"
          : hasPages
            ? "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100"
            : "border-gray-200 bg-gray-50 cursor-not-allowed opacity-50"
      }`}
    >
      <input {...getInputProps()} />
      <UploadIcon />
      {isDragActive ? (
        <p className="text-lg font-semibold text-blue-600">
          {dragMessage || "Drop the file here ..."}
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
                if (e.key === "Enter") {
                  e.stopPropagation();
                  open();
                }
              }}
              tabIndex={0} // Make it focusable
              role="button"
            >
              Click to upload
            </span>{" "}
            or drag and drop
          </p>
          {/* <p className="mt-1 text-xs text-gray-500 sm:text-sm">
            JPEG, PNG, PDF
          </p> */}
          <p className="mt-1 text-xs text-gray-400">
            Max File size: 250MB, Max File pages: 50
          </p>
        </>
      )}
    </div>
  );
}

export default FileUploadArea;

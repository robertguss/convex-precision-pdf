import React from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

import ExampleCard from "./ExampleCard";
import FileUploadArea from "./FileUploadArea";

export interface ExampleFile {
  id: string;
  title: string;
  tags: string[];
  imageUrl: string;
  dataUrl: string;
  staticImageBasePath: string;
}

const exampleFilesData = [
  {
    id: "invoice",
    title: "Invoice",
    tags: ["Tables", "Multi-column"],
    imageUrl: "/examples/invoice/images/page_0.png",
    dataUrl: "/examples/invoice/invoice.json",
    staticImageBasePath: "/examples/invoice/images",
  },
  {
    id: "bank_statement_1",
    title: "Bank Statement 1",
    tags: ["Tables", "Multi-column"],
    imageUrl: "/examples/bank_statement_1/images/page_0.png",
    dataUrl: "/examples/bank_statement_1/bank_statement_1.json",
    staticImageBasePath: "/examples/bank_statement_1/images",
  },
  {
    id: "bank_statement_2",
    title: "Bank Statement 2",
    tags: ["Tables", "Multi-column"],
    imageUrl: "/examples/bank_statement_2/images/page_0.png",
    dataUrl: "/examples/bank_statement_2/bank_statement_2.json",
    staticImageBasePath: "/examples/bank_statement_2/images",
  },
  {
    id: "medical_report_1",
    title: "Medical Report 1",
    tags: ["Medical", "Images"],
    imageUrl: "/examples/medical_report_1/images/page_0.png",
    dataUrl: "/examples/medical_report_1/medical_report_1.json",
    staticImageBasePath: "/examples/medical_report_1/images",
  },
  {
    id: "medical_report_2",
    title: "Medical Report 2",
    tags: ["Medical", "Multi-column", "19 pages"],
    imageUrl: "/examples/medical_report_2/images/page_0.png",
    dataUrl: "/examples/medical_report_2/medical_report_2.json",
    staticImageBasePath: "/examples/medical_report_2/images",
  },
  {
    id: "medical_journal_article",
    title: "Medical Journal Article",
    tags: ["Charts", "Graphs", "Complex"],
    imageUrl: "/examples/medical_journal_article/images/page_0.png",
    dataUrl: "/examples/medical_journal_article/medical_journal_article.json",
    staticImageBasePath: "/examples/medical_journal_article/images",
  },
  {
    id: "mortgage_application",
    title: "Mortgage Application",
    tags: ["Forms", "Checkboxes", "Complex"],
    imageUrl: "/examples/mortgage_application/images/page_0.png",
    dataUrl: "/examples/mortgage_application/mortgage_application.json",
    staticImageBasePath: "/examples/mortgage_application/images",
  },
  {
    id: "settlement_statement",
    title: "Settlement Statement (HUD-1)",
    tags: ["Tables", "Complex"],
    imageUrl: "/examples/settlement_statement/images/page_0.png",
    dataUrl: "/examples/settlement_statement/settlement_statement.json",
    staticImageBasePath: "/examples/settlement_statement/images",
  },
];

/**
 * @typedef {Object} ExampleFile
 * @property {string} id
 * @property {string} title
 * @property {string[]} tags
 * @property {string} imageUrl
 * @property {string} dataUrl
 * @property {string} staticImageBasePath
 */

interface UploadScreenProps {
  onFileUpload: (file: File) => void;
  onExampleSelect: (example: ExampleFile) => void;
  error: string | object | null;
  clearError: () => void;
}

/**
 * Component to display the main upload screen.
 * @param {object} props - The component props.
 * @param {(file: File) => void} props.onFileUpload - Callback function when a file is selected for upload.
 * @param {(example: ExampleFile) => void} props.onExampleSelect - Callback function when an example file is selected.
 * @param {string | object | null} props.error - Error message or object to display.
 * @param {() => void} props.clearError - Callback function to clear the current error.
 */
function UploadScreen({ onFileUpload, onExampleSelect, error, clearError }: UploadScreenProps) {
  const pageUsage = useQuery(api.subscriptions.getUserPageUsage);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-white antialiased sm:p-6">
      <div className="w-full max-w-4xl rounded-xl bg-white p-6 text-gray-800 shadow-2xl sm:p-8 md:p-10">
        <header className="mb-6 text-center sm:mb-8">
          <p className="sm:text-md mx-auto max-w-2xl text-sm text-black md:text-lg">
            Extract structured information from visually complex documents with
            text, tables, pictures, charts, and other information. The app
            returns the extracted data in a hierarchical format and pinpoints
            the exact location of each element.
          </p>
        </header>

        {error && (
          <div
            className="relative mb-6 rounded border-l-4 border-red-500 bg-red-100 px-4 py-3 text-red-700 shadow"
            role="alert"
            data-cy="error-message"
          >
            <div className="flex">
              <div className="py-1">
                <svg
                  className="mr-4 h-6 w-6 fill-current text-red-500"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                >
                  <path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zM10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm-.88-2.12a1 1 0 0 1-1.41-1.41L8.59 12 7.29 10.71a1 1 0 1 1 1.41-1.41L10 10.59l1.29-1.3a1 1 0 0 1 1.42 1.42L11.41 12l1.3 1.29a1 1 0 0 1-1.42 1.42L10 13.41l-1.29 1.29a1 1 0 0 1-.59.29z" />
                </svg>
              </div>
              <div>
                <p className="font-bold">Error</p>
                <p className="text-sm" data-cy="error-text">
                  {typeof error === "string" ? error : JSON.stringify(error)}
                </p>
              </div>
            </div>
            <button
              onClick={clearError}
              className="absolute top-0 right-0 bottom-0 px-4 py-3 text-red-500 hover:text-red-700 focus:outline-none"
            >
              <span className="text-2xl font-light">&times;</span>
            </button>
          </div>
        )}

        <FileUploadArea onFileSelect={onFileUpload} pageUsage={pageUsage} />

        <div className="mt-8 border-t border-gray-200 pt-6 sm:mt-10 sm:pt-8">
          <h2 className="mb-6 text-center text-xl font-semibold text-gray-700 sm:text-2xl">
            Or try an Example File
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
            {exampleFilesData.map((example) => (
              <ExampleCard
                key={example.id}
                title={example.title}
                tags={example.tags}
                imageUrl={example.imageUrl}
                onClick={() => onExampleSelect(example)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default UploadScreen;

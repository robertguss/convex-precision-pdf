// ABOUTME: Header component for the document viewer with export controls
// ABOUTME: Includes back button, export format selector, and action buttons
import React from "react";

import { ArrowLeft, Download, FileDown, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { ExportFormat } from "./types";

interface DocumentHeaderProps {
  exportFormat: ExportFormat;
  onExportFormatChange: (format: ExportFormat) => void;
  onDownloadSelection: () => void;
  onClearSelection: () => void;
  onBack: () => void;
  hasSelection: boolean;
  onDownloadAll: () => void;
  hasMarkdown: boolean;
  documentTitle?: string;
  selectionCount?: number;
}

export const DocumentHeader: React.FC<DocumentHeaderProps> = ({
  exportFormat,
  onExportFormatChange,
  onDownloadSelection,
  onClearSelection,
  onBack,
  hasSelection,
  onDownloadAll,
  hasMarkdown,
  documentTitle,
  selectionCount = 0,
}) => {
  return (
    <header className="border-b bg-white">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left side - Back button and document title */}
        <div className="flex items-center">
          <Button
            onClick={onBack}
            variant="outline"
            size="default"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          {documentTitle && (
            <>
              <Separator orientation="vertical" className="mx-4 h-6" />
              <h1 className="text-lg font-medium text-gray-900">{documentTitle}</h1>
            </>
          )}
        </div>

        {/* Right side - Export controls */}
        <div className="flex items-center gap-3">
          {/* Export format selector */}
          <div className="flex items-center gap-2">
            {!exportFormat && (
              <span className="text-sm font-medium text-gray-500">Step 1:</span>
            )}
            <Select
              value={exportFormat}
              onValueChange={(value) => onExportFormatChange(value as ExportFormat)}
            >
              <SelectTrigger 
                className={`h-10 w-[200px] font-medium transition-all ${
                  exportFormat 
                    ? "border-blue-500 bg-blue-50 text-blue-900 hover:bg-blue-100 shadow-sm" 
                    : "border-gray-400 bg-gradient-to-r from-gray-50 to-white text-gray-800 hover:from-gray-100 hover:to-gray-50 hover:border-gray-500 shadow"
                }`} 
                data-tour="export-button"
              >
                <SelectValue placeholder="Choose export format" className="text-sm" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel className="font-semibold text-gray-700">Export Formats</SelectLabel>
                  <SelectItem value="markdown">Markdown (.md)</SelectItem>
                  <SelectItem value="json">JSON (.json)</SelectItem>
                  <SelectItem value="text">Plain Text (.txt)</SelectItem>
                  <SelectItem value="docx">Word Document (.docx)</SelectItem>
                  <SelectItem value="csv">CSV (.csv)</SelectItem>
                  <SelectItem value="xlsx">Excel Spreadsheet (.xlsx)</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Download All button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={onDownloadAll}
                  disabled={!hasMarkdown || !exportFormat}
                  variant="outline"
                  size="default"
                  data-tour="download-all"
                  className={
                    hasMarkdown && exportFormat 
                      ? "border-gray-300 bg-white hover:bg-gray-100 hover:border-gray-400" 
                      : ""
                  }
                >
                  <FileDown className="mr-2 h-4 w-4" />
                  Download All
                </Button>
              </TooltipTrigger>
              {!exportFormat && hasMarkdown && (
                <TooltipContent>
                  <p>Please select an export format first</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>

          <Separator orientation="vertical" className="h-6" />

          {/* Selection actions */}
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={onDownloadSelection}
                    disabled={!hasSelection || !exportFormat}
                    variant={hasSelection && exportFormat ? "default" : "outline"}
                    size="default"
                    className={hasSelection && exportFormat ? "" : "border-gray-300"}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Selection
                    {hasSelection && (
                      <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium">
                        {selectionCount}
                      </span>
                    )}
                  </Button>
                </TooltipTrigger>
                {!exportFormat && hasSelection && (
                  <TooltipContent>
                    <p>Please select an export format first</p>
                  </TooltipContent>
                )}
                {!hasSelection && exportFormat && (
                  <TooltipContent>
                    <p>Select chunks to download</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
            
            <Button
              onClick={onClearSelection}
              disabled={!hasSelection}
              variant="outline"
              size="default"
              className={
                hasSelection 
                  ? "border-gray-300 bg-white hover:bg-gray-100 hover:border-gray-400" 
                  : ""
              }
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

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
            variant="ghost"
            size="sm"
            className="mr-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          {documentTitle && (
            <>
              <Separator orientation="vertical" className="mr-4 h-6" />
              <h1 className="text-lg font-medium text-gray-900">{documentTitle}</h1>
            </>
          )}
        </div>

        {/* Right side - Export controls */}
        <div className="flex items-center gap-2">
          {/* Export format selector */}
          <Select
            value={exportFormat}
            onValueChange={(value) => onExportFormatChange(value as ExportFormat)}
          >
            <SelectTrigger className="h-9 w-[180px]" data-tour="export-button">
              <SelectValue placeholder="Export format" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Export Formats</SelectLabel>
                <SelectItem value="markdown">Markdown</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="text">Plain Text</SelectItem>
                <SelectItem value="docx">Word (.docx)</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          {/* Download All button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={onDownloadAll}
                  disabled={!hasMarkdown || !exportFormat}
                  variant="outline"
                  size="sm"
                  data-tour="download-all"
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
                    variant={hasSelection ? "default" : "outline"}
                    size="sm"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Selection
                    {hasSelection && (
                      <span className="ml-2 rounded-full bg-primary-foreground/20 px-2 py-0.5 text-xs">
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
              variant="ghost"
              size="sm"
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

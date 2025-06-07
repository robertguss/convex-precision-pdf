// ABOUTME: Header component for the document viewer with export controls
// ABOUTME: Includes back button, export format selector, and action buttons
import React from 'react';

import { Download, Trash2 } from 'lucide-react';

import { Button } from '@kit/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';

import { ExportFormat } from './types';

interface DocumentHeaderProps {
  exportFormat: ExportFormat;
  onExportFormatChange: (format: ExportFormat) => void;
  onDownloadSelection: () => void;
  onClearSelection: () => void;
  onBack: () => void;
  hasSelection: boolean;
  onDownloadAll: () => void;
  hasMarkdown: boolean;
}

export const DocumentHeader: React.FC<DocumentHeaderProps> = ({
  exportFormat,
  onExportFormatChange,
  onDownloadSelection,
  onClearSelection,

  hasSelection,
  onDownloadAll,
  hasMarkdown,
}) => {
  return (
    <header className="flex justify-between border-b border-gray-200 px-4 py-4 text-lg shadow">
      <div>
        <Button
          onClick={onDownloadAll}
          disabled={!hasMarkdown}
          className="rounded bg-blue-500 px-3 py-1 text-sm font-bold text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-300 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          data-tour="download-all"
        >
          <Download className="mr-2 h-4 w-4" />
          Download All
        </Button>
      </div>
      <div className="export-controls flex items-center">
        <Select
          value={exportFormat}
          onValueChange={(value) => onExportFormatChange(value as ExportFormat)}
        >
          <SelectTrigger className="w-[210px]" data-tour="export-button">
            <SelectValue placeholder="Select an export format" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Export Formats</SelectLabel>
              <SelectItem value="markdown">Markdown</SelectItem>
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        <Button
          onClick={onDownloadSelection}
          disabled={!hasSelection || exportFormat === ''}
          className="mr-2 rounded bg-green-500 px-3 py-1 text-sm font-bold text-white hover:bg-green-700 focus:ring-2 focus:ring-green-300 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download className="mr-2 h-4 w-4" />
          Download Selection
        </Button>
        <Button
          onClick={onClearSelection}
          disabled={!hasSelection}
          className="rounded bg-red-500 px-3 py-1 text-sm font-bold text-white hover:bg-red-700 focus:ring-2 focus:ring-red-300 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Clear Selection
        </Button>
      </div>
    </header>
  );
};

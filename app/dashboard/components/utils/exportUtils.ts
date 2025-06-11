// ABOUTME: Utility functions for exporting selected chunks in various formats
// ABOUTME: Supports JSON, Markdown, CSV, and XLSX export formats
import { Chunk, ExportFormat } from '../types';

// Use local API routes to avoid CORS issues
const API_BASE_URL = '';

export async function exportChunks(
  chunks: Chunk[],
  format: ExportFormat,
  documentBasename: string,
): Promise<void> {
  if (chunks.length === 0) {
    console.warn('No chunks to export.');
    return;
  }

  switch (format) {
    case 'json':
      await exportAsJson(chunks, documentBasename);
      break;
    case 'markdown':
      await exportAsMarkdown(chunks, documentBasename);
      break;
    case 'text':
      await exportAsText(chunks, documentBasename);
      break;
    case 'docx':
      await exportAsDocx(chunks, documentBasename);
      break;
    case 'csv':
      await exportAsCsv(chunks, documentBasename);
      break;
    case 'xlsx':
      await exportAsXlsx(chunks, documentBasename);
      break;
    default:
      console.warn(`Export format ${format} not supported yet.`);
      alert(`Export format ${format} not supported yet.`);
  }
}

async function exportAsJson(chunks: Chunk[], documentBasename: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/export/json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ chunks }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `JSON export failed: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    const jsonData = await response.json();
    const jsonString = JSON.stringify(jsonData, null, 2);
    downloadFile(
      jsonString,
      'application/json',
      `${documentBasename}_selection.json`,
    );
  } catch (err) {
    console.error('Failed to export JSON:', err);
    alert(
      `Error exporting to JSON: ${err instanceof Error ? err.message : 'Unknown error'}`,
    );
  }
}

async function exportAsMarkdown(chunks: Chunk[], documentBasename: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/export/markdown`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ chunks }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Markdown export failed: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    const markdownString = await response.text();
    downloadFile(
      markdownString,
      'text/markdown',
      `${documentBasename}_selection.md`,
    );
  } catch (err) {
    console.error('Failed to export Markdown:', err);
    alert(
      `Error exporting to Markdown: ${err instanceof Error ? err.message : 'Unknown error'}`,
    );
  }
}

async function exportAsCsv(chunks: Chunk[], documentBasename: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/export/csv`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ chunks }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `CSV export failed: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    const csvString = await response.text();
    downloadFile(csvString, 'text/csv', `${documentBasename}_selection.csv`);
  } catch (err) {
    console.error('Failed to export CSV:', err);
    alert(
      `Error exporting to CSV: ${err instanceof Error ? err.message : 'Unknown error'}`,
    );
  }
}

async function exportAsXlsx(chunks: Chunk[], documentBasename: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/export/xlsx`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ chunks }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `XLSX export failed: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    const blob = await response.blob();
    downloadBlob(blob, `${documentBasename}_selection.xlsx`);
  } catch (err) {
    console.error('Failed to export XLSX:', err);
    alert(
      `Error exporting to XLSX: ${err instanceof Error ? err.message : 'Unknown error'}`,
    );
  }
}

async function exportAsText(chunks: Chunk[], documentBasename: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/export/text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ chunks }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Text export failed: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    const textString = await response.text();
    downloadFile(
      textString,
      'text/plain',
      `${documentBasename}_selection.txt`,
    );
  } catch (err) {
    console.error('Failed to export Text:', err);
    alert(
      `Error exporting to Text: ${err instanceof Error ? err.message : 'Unknown error'}`,
    );
  }
}

async function exportAsDocx(chunks: Chunk[], documentBasename: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/export/docx`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ chunks }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `DOCX export failed: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    const blob = await response.blob();
    downloadBlob(blob, `${documentBasename}_selection.docx`);
  } catch (err) {
    console.error('Failed to export DOCX:', err);
    alert(
      `Error exporting to DOCX: ${err instanceof Error ? err.message : 'Unknown error'}`,
    );
  }
}

export function downloadFile(
  content: string,
  mimeType: string,
  filename: string,
) {
  const blob = new Blob([content], { type: mimeType });
  downloadBlob(blob, filename);
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  
  // Create a temporary anchor element and trigger download
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  // Use a timeout to ensure the link is processed
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}

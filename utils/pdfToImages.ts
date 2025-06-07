/**
 * Converts PDF pages to images using pdfjs-dist and sharp
 * @module utils/pdfToImages
 */

import sharp from 'sharp';

// Dynamic import to handle Node.js environment
let pdfjsLib: any;
let createCanvas: any;

async function initializePdfJs() {
  if (!pdfjsLib) {
    pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const { createCanvas: canvasCreator } = await import('canvas');
    createCanvas = canvasCreator;
    
    // Configure PDF.js worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@4.8.69/legacy/build/pdf.worker.min.mjs`;
  }
  return pdfjsLib;
}

/**
 * Converts a PDF buffer to an array of image buffers
 * @param pdfBuffer - The PDF file as a buffer
 * @param format - Output image format ('png' or 'jpeg')
 * @param scale - Scale factor for rendering (default: 2 for higher quality)
 * @returns Array of image buffers, one for each page
 */
export async function convertPdfToImages(
  pdfBuffer: Buffer,
  format: 'png' | 'jpeg' = 'png',
  scale: number = 2
): Promise<Buffer[]> {
  try {
    const pdfjs = await initializePdfJs();
    
    // Load the PDF document
    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(pdfBuffer),
      standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@4.8.69/standard_fonts/',
    });
    
    const pdfDoc = await loadingTask.promise;
    const numPages = pdfDoc.numPages;
    const images: Buffer[] = [];

    // Process each page
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      
      // Get page dimensions
      const viewport = page.getViewport({ scale });
      const width = Math.floor(viewport.width);
      const height = Math.floor(viewport.height);

      // Create a canvas to render the page
      const canvas = createCanvas(width, height);
      const context = canvas.getContext('2d');

      // Render the PDF page to canvas
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };
      
      await page.render(renderContext).promise;

      // Convert canvas to buffer
      const canvasBuffer = canvas.toBuffer('image/png');

      // Optimize the image using sharp
      let sharpImage = sharp(canvasBuffer);
      
      if (format === 'jpeg') {
        sharpImage = sharpImage.jpeg({ quality: 90, progressive: true });
      } else {
        sharpImage = sharpImage.png({ compressionLevel: 6 });
      }

      const imageBuffer = await sharpImage.toBuffer();
      images.push(imageBuffer);
    }

    return images;
  } catch (error) {
    console.error('Error converting PDF to images:', error);
    throw new Error(`Failed to convert PDF to images: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get metadata about a PDF document
 * @param pdfBuffer - The PDF file as a buffer
 * @returns Object containing page count and other metadata
 */
export async function getPdfMetadata(pdfBuffer: Buffer): Promise<{
  pageCount: number;
  info: any;
}> {
  try {
    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(pdfBuffer),
    });
    
    const pdfDoc = await loadingTask.promise;
    const info = await pdfDoc.getMetadata();
    
    return {
      pageCount: pdfDoc.numPages,
      info: info.info,
    };
  } catch (error) {
    console.error('Error getting PDF metadata:', error);
    throw new Error(`Failed to get PDF metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
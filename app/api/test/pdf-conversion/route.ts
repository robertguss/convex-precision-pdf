/**
 * Test route for PDF to image conversion
 * @module app/api/test/pdf-conversion/route
 */

import { NextResponse } from "next/server";
import { convertPdfToImages } from "@/utils/pdfToImages";
import fs from "fs/promises";
import path from "path";

export async function GET() {
  try {
    // Check if the PDF conversion utility can be loaded
    const testPdfPath = path.join(process.cwd(), 'public', 'examples', 'invoice', 'invoice.pdf');
    
    // Check if we have a test PDF
    try {
      await fs.access(testPdfPath);
    } catch {
      return NextResponse.json({ 
        error: "No test PDF found",
        note: "Upload a PDF through the UI to test conversion"
      });
    }
    
    // Try to convert a small test PDF
    const pdfBuffer = await fs.readFile(testPdfPath);
    const images = await convertPdfToImages(pdfBuffer, 'png', 1);
    
    return NextResponse.json({
      success: true,
      message: "PDF conversion utility is working",
      pageCount: images.length,
      pageSizes: images.map(img => img.length)
    });
  } catch (error) {
    console.error("PDF conversion test error:", error);
    return NextResponse.json({
      error: "PDF conversion failed",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
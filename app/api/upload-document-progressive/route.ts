// ABOUTME: API route for handling progressive PDF document uploads
// ABOUTME: Integrates with Convex for file storage and Landing AI for processing

import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { auth } from "@clerk/nextjs/server";
// Removed import for pdfToImages - using FastAPI service instead

export async function POST(request: NextRequest) {
  console.log("Upload endpoint called");
  
  try {
    const { getToken } = await auth();
    const token = await getToken({ template: "convex" });
    
    console.log("Auth token obtained:", !!token);
    
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized - No auth token" },
        { status: 401 }
      );
    }
    
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    console.log("Convex URL:", convexUrl);
    
    if (!convexUrl) {
      throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
    }
    
    const convex = new ConvexHttpClient(convexUrl);
    convex.setAuth(token);
    
    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }
    
    const validTypes = ["application/pdf", "image/jpeg", "image/png"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only PDF, JPEG, and PNG files are allowed." },
        { status: 400 }
      );
    }
    
    const maxSize = 250 * 1024 * 1024; // 250MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size exceeds maximum limit of 250MB" },
        { status: 400 }
      );
    }
    
    console.log("Getting upload URL...");
    const uploadUrl = await convex.mutation(api.documents.generateUploadUrl, {});
    console.log("Upload URL:", uploadUrl);
    
    console.log("Uploading file to storage...");
    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        "Content-Type": file.type,
      },
      body: file,
    });
    
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Failed to upload file to storage: ${uploadResponse.status} ${errorText}`);
    }
    
    const uploadResult = await uploadResponse.json();
    console.log("Upload result:", uploadResult);
    const storageId = uploadResult.storageId;
    
    const documentId = await convex.mutation(api.documents.createDocument, {
      title: file.name,
      storageId: storageId as Id<"_storage">,
      fileSize: file.size,
      mimeType: file.type,
    });
    
    // Convert PDF to images if it's a PDF file
    const pageImages: Id<"_storage">[] = [];
    let pageCount = 1; // Default for non-PDF files
    
    if (file.type === "application/pdf") {
      try {
        console.log("Converting PDF to images using FastAPI service...");
        console.log("File size:", file.size, "bytes");
        
        const fastApiUrl = process.env.NEXT_PUBLIC_FAST_API_URL || 'http://localhost:8000';
        
        // Create FormData for the FastAPI endpoint
        const pdfFormData = new FormData();
        pdfFormData.append('file', file);
        
        // Get the API key from environment variables
        const apiKey = process.env.FAST_API_SECRET_KEY;
        if (!apiKey) {
          throw new Error("FAST_API_SECRET_KEY not configured");
        }
        
        // Call FastAPI service to convert PDF to images
        console.log("Calling FastAPI convert_pdf_to_images endpoint...");
        const convertResponse = await fetch(`${fastApiUrl}/api/convert_pdf_to_images`, {
          method: 'POST',
          headers: {
            'X-API-Key': apiKey,
          },
          body: pdfFormData,
        });
        
        if (!convertResponse.ok) {
          const errorText = await convertResponse.text();
          throw new Error(`FastAPI PDF conversion failed: ${convertResponse.status} ${errorText}`);
        }
        
        // The response is a JSON object with page numbers as keys and base64 images as values
        const imageData: Record<string, string[]> = await convertResponse.json();
        console.log("FastAPI response structure:", Object.keys(imageData));
        console.log("FastAPI response sample:", JSON.stringify(imageData).substring(0, 200) + "...");
        
        const pageNumbers = Object.keys(imageData).map(Number).sort((a, b) => a - b);
        pageCount = pageNumbers.length;
        
        console.log(`Received ${pageCount} pages from FastAPI`);
        console.log("Page numbers:", pageNumbers);
        
        // Sort the keys to ensure pages are in order
        const sortedPageKeys = Object.keys(imageData).sort((a, b) => parseInt(a) - parseInt(b));
        
        // Upload each page image to Convex storage
        for (const pageKey of sortedPageKeys) {
          const base64Images = imageData[pageKey];
          console.log(`Processing page key: ${pageKey}, base64Images:`, base64Images ? base64Images.length : 'undefined');
          if (!base64Images || base64Images.length === 0) {
            console.log(`Skipping page ${pageKey} - no images found`);
            continue;
          }
          
          // Use the first image (there should only be one per page)
          const base64Image = base64Images[0];
          const pageNum = parseInt(pageKey);
          console.log(`Uploading page ${pageNum + 1} image...`);
          console.log(`Base64 image length: ${base64Image.length} characters`);
          
          // Convert base64 to buffer
          const imageBuffer = Buffer.from(base64Image, 'base64');
          console.log(`Page ${pageNum + 1} image size: ${imageBuffer.length} bytes`);
          
          // Get a new upload URL for each image
          const imageUploadUrl = await convex.mutation(api.documents.generateUploadUrl, {});
          console.log(`Got upload URL for page ${pageNum + 1}`);
          
          // Upload the image
          const imageUploadResponse = await fetch(imageUploadUrl, {
            method: "POST",
            headers: {
              "Content-Type": "image/png",
            },
            body: imageBuffer,
          });
          
          if (!imageUploadResponse.ok) {
            const errorText = await imageUploadResponse.text();
            throw new Error(`Failed to upload page ${pageNum + 1} image: ${imageUploadResponse.status} ${errorText}`);
          }
          
          const imageResult = await imageUploadResponse.json();
          console.log(`Page ${pageNum + 1} uploaded, storage ID:`, imageResult.storageId);
          pageImages.push(imageResult.storageId as Id<"_storage">);
          console.log(`Page images array after push:`, pageImages);
        }
        
        console.log("All page images uploaded successfully");
        console.log("Page images array:", pageImages);
        
        // Update the document with page images
        console.log("Updating document with page images...");
        await convex.mutation(api.documents.updateDocumentStatus, {
          documentId: documentId as Id<"documents">,
          status: "processing",
          pageImages: pageImages,
          pageCount: pageCount,
        });
        console.log("Document updated with page images");
      } catch (error) {
        console.error("Error converting PDF to images:", error);
        if (error instanceof Error) {
          console.error("Error stack:", error.stack);
        }
        // Continue with processing even if image conversion fails
      }
    }
    
    // Fire and forget - process document in the background
    convex.action(api.documents.processDocumentWithLandingAI, {
      documentId: documentId as Id<"documents">,
    }).catch(error => {
      console.error("Error processing document:", error);
    });
    
    return NextResponse.json({
      documentId,
      status: "processing",
      pageCount,
    });
    
  } catch (error) {
    console.error("Upload error:", error);
    // Log the full error details
    if (error instanceof Error) {
      console.error("Error stack:", error.stack);
    }
    
    // Provide more specific error messages
    let errorMessage = "Failed to upload document";
    let errorDetails = "Unknown error";
    
    if (error instanceof Error) {
      errorDetails = error.message;
      
      // Check for specific error types
      if (error.message.includes("generateUploadUrl")) {
        errorMessage = "Failed to generate upload URL";
      } else if (error.message.includes("storage")) {
        errorMessage = "Failed to upload file to storage";
      } else if (error.message.includes("createDocument")) {
        errorMessage = "Failed to create document record";
      } else if (error.message.includes("Unauthorized") || error.message.includes("auth")) {
        errorMessage = "Authentication error";
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorDetails
      },
      { status: 500 }
    );
  }
}
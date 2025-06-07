// ABOUTME: API route for handling progressive PDF document uploads
// ABOUTME: Integrates with Convex for file storage and Landing AI for processing

import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { auth } from "@clerk/nextjs/server";
import { convertPdfToImages } from "@/utils/pdfToImages";

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
        console.log("Converting PDF to images...");
        
        // Get the file buffer
        const fileBuffer = Buffer.from(await file.arrayBuffer());
        
        // Convert PDF pages to images
        const imageBuffers = await convertPdfToImages(fileBuffer, 'png', 2);
        pageCount = imageBuffers.length;
        
        console.log(`Converted ${pageCount} pages to images`);
        
        // Upload each page image to Convex storage
        for (let i = 0; i < imageBuffers.length; i++) {
          console.log(`Uploading page ${i + 1} image...`);
          
          // Get a new upload URL for each image
          const imageUploadUrl = await convex.mutation(api.documents.generateUploadUrl, {});
          
          // Upload the image
          const imageUploadResponse = await fetch(imageUploadUrl, {
            method: "POST",
            headers: {
              "Content-Type": "image/png",
            },
            body: imageBuffers[i],
          });
          
          if (!imageUploadResponse.ok) {
            throw new Error(`Failed to upload page ${i + 1} image`);
          }
          
          const imageResult = await imageUploadResponse.json();
          pageImages.push(imageResult.storageId as Id<"_storage">);
        }
        
        console.log("All page images uploaded successfully");
        
        // Update the document with page images
        await convex.mutation(api.documents.updateDocumentStatus, {
          documentId: documentId as Id<"documents">,
          status: "processing",
          pageImages: pageImages,
          pageCount: pageCount,
        });
      } catch (error) {
        console.error("Error converting PDF to images:", error);
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
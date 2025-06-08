// ABOUTME: API route for handling standard PDF document uploads
// ABOUTME: Same as progressive upload but without streaming updates

import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
  const { getToken } = await auth();
  const token = await getToken({ template: "convex" });
  
  if (!token) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }
  
  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  convex.setAuth(token);
  try {
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
    
    const uploadUrl = await convex.mutation(api.documents.generateUploadUrl, {});
    
    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        "Content-Type": file.type,
      },
      body: file,
    });
    
    if (!uploadResponse.ok) {
      throw new Error("Failed to upload file to storage");
    }
    
    const { storageId } = await uploadResponse.json();
    
    const documentId = await convex.mutation(api.documents.createDocument, {
      title: file.name,
      storageId: storageId as Id<"_storage">,
      fileSize: file.size,
      mimeType: file.type,
    });
    
    // Fire and forget - process document in the background
    convex.action(api.documents.processDocumentWithLandingAI, {
      documentId: documentId as Id<"documents">,
    }).catch(error => {
      console.error("Error processing document:", error);
    });
    
    return NextResponse.json({
      documentId,
      status: "processing",
    });
    
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { 
        error: "Failed to upload document",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
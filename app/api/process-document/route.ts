/**
 * API route for processing documents with Landing AI
 * This runs in the Next.js server environment where it can access localhost
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the file from the request
    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Get API configuration
    const apiKey = process.env.FAST_API_SECRET_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "FAST_API_SECRET_KEY not configured" },
        { status: 500 }
      );
    }

    const fastApiUrl = process.env.NEXT_PUBLIC_FAST_API_URL || 'http://localhost:8000';

    // Create FormData for FastAPI
    const fastApiFormData = new FormData();
    fastApiFormData.append('file', file);

    // Call FastAPI service
    console.log("Calling FastAPI process_document endpoint...");
    const processResponse = await fetch(`${fastApiUrl}/api/process_document`, {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
      },
      body: fastApiFormData,
    });

    if (!processResponse.ok) {
      const errorText = await processResponse.text();
      console.error("FastAPI error:", errorText);
      return NextResponse.json(
        { error: `FastAPI processing failed: ${processResponse.status}` },
        { status: processResponse.status }
      );
    }

    // Return the Landing AI response
    const landingAiData = await processResponse.json();
    return NextResponse.json(landingAiData);

  } catch (error) {
    console.error("Process document error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
/**
 * API route for exporting all content to DOCX format
 * Proxies requests to the FastAPI service
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
  try {
    // Auth disabled for local development
    const { userId } = await auth();

    // Get the request body
    const body = await request.json();
    
    // Get API configuration
    const fastApiUrl = process.env.NEXT_PUBLIC_FAST_API_URL || 'http://localhost:8000';
    const apiKey = process.env.FAST_API_SECRET_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "FAST_API_SECRET_KEY not configured" },
        { status: 500 }
      );
    }

    // Call FastAPI service
    const response = await fetch(`${fastApiUrl}/api/export/all-docx`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Export failed: ${errorText}` },
        { status: response.status }
      );
    }

    // Return the DOCX as blob
    const blob = await response.blob();
    return new NextResponse(blob, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      },
    });

  } catch (error) {
    console.error("Export all DOCX error:", error);
    return NextResponse.json(
      { error: "Failed to export all DOCX" },
      { status: 500 }
    );
  }
}
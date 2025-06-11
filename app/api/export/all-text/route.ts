/**
 * API route for exporting all content to plain text format
 * Proxies requests to the FastAPI service
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
    const response = await fetch(`${fastApiUrl}/api/export/all-text`, {
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

    // Return the text content
    const textContent = await response.text();
    return new NextResponse(textContent, {
      headers: {
        'Content-Type': 'text/plain',
      },
    });

  } catch (error) {
    console.error("Export all text error:", error);
    return NextResponse.json(
      { error: "Failed to export all text" },
      { status: 500 }
    );
  }
}
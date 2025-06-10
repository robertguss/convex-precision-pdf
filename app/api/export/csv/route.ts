/**
 * API route for exporting chunks to CSV format
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
    const response = await fetch(`${fastApiUrl}/api/export/csv`, {
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

    // Return the CSV as text
    const csv = await response.text();
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
      },
    });

  } catch (error) {
    console.error("Export CSV error:", error);
    return NextResponse.json(
      { error: "Failed to export CSV" },
      { status: 500 }
    );
  }
}
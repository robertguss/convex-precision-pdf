import { NextResponse } from "next/server";

export async function GET() {
  try {
    const fastApiUrl = process.env.NEXT_PUBLIC_FAST_API_URL || 'http://localhost:8000';
    const apiKey = process.env.FAST_API_SECRET_KEY;
    
    // Check if API key is configured
    if (!apiKey) {
      return NextResponse.json({ 
        message: "FastAPI integration check",
        status: "error",
        error: "FAST_API_SECRET_KEY not configured"
      }, { status: 500 });
    }
    
    // Check FastAPI health
    const healthResponse = await fetch(`${fastApiUrl}/api/landing-ai/health`, {
      headers: {
        'X-API-Key': apiKey,
      },
    });
    
    const healthStatus = healthResponse.ok ? "healthy" : "unhealthy";
    const healthData = await healthResponse.json().catch(() => null);
    
    return NextResponse.json({ 
      message: "FastAPI integration check",
      fastApiUrl,
      fastApiHealth: healthStatus,
      fastApiResponse: healthData,
      apiKeyConfigured: true,
    });
  } catch (error) {
    return NextResponse.json({ 
      message: "FastAPI integration check",
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
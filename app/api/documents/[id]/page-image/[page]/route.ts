/**
 * API route for fetching document page images from Convex storage
 * @module app/api/documents/[id]/page-image/[page]/route
 */

import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { auth } from "@clerk/nextjs/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; page: string }> }
) {
  try {
    const { getToken } = await auth();
    const token = await getToken({ template: "convex" });
    
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
    }
    
    const convex = new ConvexHttpClient(convexUrl);
    convex.setAuth(token);
    
    const { id, page } = await params;
    const pageIndex = parseInt(page, 10);
    
    if (isNaN(pageIndex) || pageIndex < 0) {
      return NextResponse.json(
        { error: "Invalid page number" },
        { status: 400 }
      );
    }
    
    // Get the page image URL from Convex
    const imageUrl = await convex.query(api.documents.getPageImageUrl, {
      documentId: id as Id<"documents">,
      pageIndex: pageIndex,
    });
    
    if (!imageUrl) {
      return NextResponse.json(
        { error: "Page image not found" },
        { status: 404 }
      );
    }
    
    // For static example images, just redirect
    if (imageUrl.startsWith('/examples/')) {
      return NextResponse.redirect(new URL(imageUrl, request.url));
    }
    
    // For Convex storage URLs, fetch and return the image
    const imageResponse = await fetch(imageUrl);
    
    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch image" },
        { status: 500 }
      );
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get('content-type') || 'image/png';
    
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
    
  } catch (error) {
    console.error("Error fetching page image:", error);
    return NextResponse.json(
      { error: "Failed to fetch page image" },
      { status: 500 }
    );
  }
}
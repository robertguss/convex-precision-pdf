// ABOUTME: Document viewer page that loads and displays a specific document by ID
// ABOUTME: Handles document fetching, viewing, and export functionality
"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { DocumentViewerWrapper } from '../../components/DocumentViewerWrapper';
import { useParams } from "next/navigation";

export default function DocumentPage() {
  const params = useParams();
  const documentId = params.id as Id<"documents">;
  
  const document = useQuery(api.documents.getDocument, { documentId });
  
  if (document === undefined) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-flex h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
          <p className="text-lg text-gray-700">Loading document...</p>
        </div>
      </div>
    );
  }
  
  if (document === null) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-700">Document not found</p>
        </div>
      </div>
    );
  }
  
  return <DocumentViewerWrapper document={document} />;
}

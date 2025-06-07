// ABOUTME: Document viewer page that loads and displays a specific document by ID
// ABOUTME: Handles document fetching, viewing, and export functionality
import { notFound } from 'next/navigation';
import { preloadQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { DocumentViewerWrapper } from '../../components/DocumentViewerWrapper';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function DocumentPage({ params }: PageProps) {
  const { id } = await params;
  
  try {
    const preloadedDocument = await preloadQuery(
      api.documents.getDocument,
      { documentId: id as Id<"documents"> }
    );
    
    if (!preloadedDocument) {
      notFound();
    }
    
    return <DocumentViewerWrapper preloadedDocument={preloadedDocument} />;
  } catch (error) {
    // If document doesn't exist or user doesn't have access
    notFound();
  }
}

'use client';

import { use, useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import { DocumentViewerWrapper } from '../../dashboard/components/DocumentViewerWrapper';
import { DemoUploadCTA } from '../_components/DemoUploadCTA';
import { DemoTour } from '../_components/DemoTour';

interface DemoDocumentPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function DemoDocumentPage({ params }: DemoDocumentPageProps) {
  const resolvedParams = use(params);
  const [document, setDocument] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
    
    async function loadExample() {
      try {
        const response = await fetch(`/api/examples/load?id=${resolvedParams.id}`);
        if (!response.ok) {
          notFound();
        }
        const data = await response.json();
        setDocument(data);
      } catch (error) {
        console.error('Failed to load example:', error);
        notFound();
      } finally {
        setLoading(false);
      }
    }

    loadExample();
  }, [resolvedParams.id]);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading example...</p>
        </div>
      </div>
    );
  }

  if (!document) {
    return notFound();
  }

  return (
    <div className="h-[calc(100vh-4rem)]">
      <DocumentViewerWrapper 
        document={document} 
        isDemo={true}
      />
      <DemoTour />
    </div>
  );
}
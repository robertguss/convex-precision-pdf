'use client';

import Link from 'next/link';
import { Upload, ArrowRight, FileText, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DemoUploadCTA() {
  return (
    <div className="flex h-full items-center justify-center p-8" data-tour="demo-cta">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <div className="rounded-full bg-primary/10 p-6">
              <Upload className="h-12 w-12 text-primary" />
            </div>
            <div className="absolute -right-2 -top-2 rounded-full bg-primary p-2">
              <Zap className="h-4 w-4 text-white" />
            </div>
          </div>
        </div>

        <h3 className="mb-4 text-2xl font-bold">
          Ready to Process Your Own Documents?
        </h3>
        
        <p className="mb-6 text-muted-foreground">
          You&apos;ve seen what PrecisionPDF can do. Now try it with your own PDFs - invoices, bank statements, contracts, and more.
        </p>

        <div className="mb-6 space-y-3">
          <div className="flex items-center justify-center gap-2 text-sm">
            <FileText className="h-4 w-4 text-primary" />
            <span>10 free pages to start</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm">
            <FileText className="h-4 w-4 text-primary" />
            <span>No credit card required</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm">
            <FileText className="h-4 w-4 text-primary" />
            <span>Process any PDF type</span>
          </div>
        </div>

        <Button size="lg" className="w-full" asChild>
          <Link href="/dashboard">
            Sign Up & Upload Your First Document
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>

        <p className="mt-4 text-xs text-muted-foreground">
          Join thousands who save hours on document processing
        </p>
      </div>
    </div>
  );
}
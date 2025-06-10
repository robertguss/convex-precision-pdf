'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ExampleCard from '../dashboard/components/ExampleCard';

interface Example {
  id: string;
  name: string;
  description: string;
  pageCount: number;
}

const examples: Example[] = [
  {
    id: 'invoice',
    name: 'Invoice',
    description: 'Multi-page business invoice with line items and totals',
    pageCount: 3,
  },
  {
    id: 'bank_statement_1',
    name: 'Bank Statement',
    description: 'Monthly bank statement with transactions',
    pageCount: 1,
  },
  {
    id: 'medical_report_1',
    name: 'Medical Report',
    description: 'Patient medical report with test results',
    pageCount: 2,
  },
  {
    id: 'mortgage_application',
    name: 'Loan Application',
    description: 'Residential loan application form',
    pageCount: 9,
  },
  {
    id: 'settlement_statement',
    name: 'HUD-1 Settlement Statement',
    description: 'HUD-1 settlement statement',
    pageCount: 5,
  },
  {
    id: 'medical_journal_article',
    name: 'Medical Journal',
    description: 'Scientific journal article with tables and figures',
    pageCount: 9,
  },
];

export default function DemoPage() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight">
          Try PrecisionPDF with Real Examples
        </h1>
        <p className="text-muted-foreground mx-auto mb-8 max-w-2xl text-lg">
          Experience the power of AI-driven PDF extraction. Click any example
          below to see how PrecisionPDF transforms complex documents into
          structured, exportable data.
        </p>
      </div>

      {/* Examples Grid */}
      <div className="mb-12">
        <h2 className="mb-6 text-2xl font-semibold">Select an Example</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {examples.map((example) => (
            <Link key={example.id} href={`/demo/${example.id}`} className="block">
              <ExampleCard
                title={example.name}
                tags={[`${example.pageCount} pages`]}
                imageUrl={`/examples/${example.id}/images/page_0.png`}
              />
            </Link>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary/5 mb-12 rounded-lg p-8 text-center">
        <p className="mb-4 text-lg font-medium">
          Ready to process your own documents?
        </p>
        <Button size="lg" asChild>
          <Link href="/dashboard">
            <FileText className="mr-2 h-5 w-5" />
            Sign Up Free - Get 10 Pages
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
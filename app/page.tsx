"use client";

import Link from "next/link";
import { SignUpButton, SignInButton, UserButton } from "@clerk/nextjs";

export default function Home() {
  return (
    <>
      <header className="sticky top-0 z-10 bg-background p-4 border-b-2 border-slate-200 dark:border-slate-800 flex flex-row justify-between items-center">
        <div className="font-semibold">Precision PDF</div>
        <div className="flex gap-4 items-center">
          <Link href="/dashboard" className="hover:underline">Dashboard</Link>
          <Link href="/demo" className="hover:underline">Demo</Link>
          <UserButton />
        </div>
      </header>
      <main className="p-8 flex flex-col gap-8">
        <LandingPage />
      </main>
    </>
  );
}

function LandingPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4">
          Precision PDF Processing
        </h1>
        <p className="text-xl text-muted-foreground">
          Extract structured data from PDFs with AI-powered precision
        </p>
      </div>
      
      <div className="flex justify-center gap-4 mb-16">
        <SignInButton mode="modal" fallbackRedirectUrl="/dashboard">
          <button className="bg-primary text-primary-foreground px-6 py-3 rounded-md hover:bg-primary/90 transition">
            Sign in
          </button>
        </SignInButton>
        <SignUpButton mode="modal" fallbackRedirectUrl="/dashboard">
          <button className="bg-secondary text-secondary-foreground px-6 py-3 rounded-md hover:bg-secondary/90 transition">
            Sign up
          </button>
        </SignUpButton>
      </div>
      
      <div className="grid md:grid-cols-3 gap-8">
        <FeatureCard
          title="AI-Powered Extraction"
          description="Advanced machine learning models extract text, tables, and structured data from any PDF"
        />
        <FeatureCard
          title="Page-by-Page Processing"
          description="Process documents page by page with detailed tracking and usage management"
        />
        <FeatureCard
          title="Export Options"
          description="Export your extracted data as JSON, Markdown, or structured formats"
        />
      </div>
    </div>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-lg">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
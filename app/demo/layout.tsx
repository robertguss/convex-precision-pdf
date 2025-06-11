import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AppLogo } from "@/components/app-logo";

export const metadata: Metadata = {
  title: "Interactive Demo",
  description: "Try Precision PDF with real examples. Experience AI-powered PDF data extraction with invoices, medical records, bank statements, and more. No signup required.",
  alternates: {
    canonical: "https://precisionpdf.com/demo",
  },
  openGraph: {
    title: "Try Precision PDF Demo - Extract Data from Real PDFs",
    description: "Experience AI-powered PDF data extraction with real examples. See how Precision PDF handles invoices, medical records, and complex documents.",
    images: [
      {
        url: "https://precisionpdf.com/demo-og-image.png",
        width: 1200,
        height: 630,
        alt: "Precision PDF Interactive Demo",
      },
    ],
  },
};

function DemoModeBadge() {
  return (
    <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
      <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
      Demo Mode
    </div>
  );
}

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Demo Header */}
      <header className="top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <AppLogo />
            <DemoModeBadge />
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Get 10 free pages to process your own documents
            </span>
            <Button asChild>
              <Link href="/dashboard">Sign Up Free</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>
    </div>
  );
}

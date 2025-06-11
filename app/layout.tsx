import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import { ClerkProvider } from "@clerk/nextjs";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | Precision PDF - AI-Powered PDF Data Extraction",
    default: "Precision PDF - Extract Data from PDFs with AI & Visual Verification",
  },
  description: "AI-powered PDF data extraction tool that shows you exactly where every piece of data comes from. Handle invoices, medical records, bank statements, and complex forms with confidence. Real-time processing with visual proof.",
  keywords: [
    "PDF data extraction",
    "AI document processing",
    "PDF to CSV converter",
    "invoice extraction",
    "medical record processing",
    "bank statement parser",
    "PDF table extraction",
    "document automation",
    "OCR with verification",
    "PDF parsing API",
  ],
  authors: [{ name: "Precision PDF" }],
  creator: "Precision PDF",
  publisher: "Precision PDF",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "Precision PDF - Extract Data from PDFs with AI & Visual Verification",
    description: "AI-powered document processing that shows you exactly where every piece of data comes from. Handle invoices, medical records, bank statements, and complex forms with confidence.",
    url: "https://precisionpdf.com",
    siteName: "Precision PDF",
    images: [
      {
        url: "https://precisionpdf.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "Precision PDF - AI Document Processing with Visual Verification",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Precision PDF - AI-Powered PDF Data Extraction",
    description: "Extract data from PDFs with surgical precision. AI-powered processing with visual proof for every extraction.",
    images: ["https://precisionpdf.com/twitter-image.png"],
    creator: "@precisionpdf",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/convex.svg",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
  },
  metadataBase: new URL("https://precisionpdf.com"),
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClerkProvider 
          dynamic
          signInFallbackRedirectUrl="/dashboard"
          signUpFallbackRedirectUrl="/dashboard"
        >
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}

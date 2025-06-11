import { Metadata } from "next";
import { CallToAction } from "@/components/marketing/CallToAction";
import { Faqs } from "@/components/marketing/Faqs";
import { Footer } from "@/components/marketing/Footer";
import { Header } from "@/components/marketing/Header";
import { Hero } from "@/components/marketing/Hero";
import { MultipleOutputs } from "@/components/marketing/MultipleOutputs";
import { Pricing } from "@/components/marketing/Pricing";
import { SecondaryFeatures } from "@/components/marketing/SecondaryFeatures";
// import { Testimonials } from "@/components/marketing/Testimonials";

export const metadata: Metadata = {
  title: "Home",
  alternates: {
    canonical: "https://precisionpdf.com",
  },
};

const jsonLdSoftware = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Precision PDF",
  applicationCategory: "BusinessApplication",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    ratingCount: "127",
  },
  description: "AI-powered PDF data extraction tool that shows you exactly where every piece of data comes from. Handle invoices, medical records, bank statements, and complex forms with confidence.",
  featureList: [
    "Visual verification of extracted data",
    "Real-time processing with live updates",
    "Smart table recognition and CSV export",
    "Support for invoices, medical records, bank statements",
    "Multi-page document handling",
    "API access for developers",
  ],
  screenshot: "https://precisionpdf.com/screenshot.png",
  softwareVersion: "2.0",
  operatingSystem: "Web-based",
  url: "https://precisionpdf.com",
};

const jsonLdFAQ = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What types of PDFs can Precision PDF handle?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "We process virtually any PDF: invoices, receipts, bank statements, medical records, legal documents, forms with checkboxes, multi-column layouts, and documents with tables, charts, or mixed content.",
      },
    },
    {
      "@type": "Question",
      name: "How accurate is the data extraction?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Our AI achieves 95%+ accuracy on most documents. The interactive viewer lets you verify every extraction by clicking to see the source location in the original PDF.",
      },
    },
    {
      "@type": "Question",
      name: "Can I try it before signing up?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Absolutely! Our interactive demo lets you explore 8 real-world examples without creating an account. Once you sign up for free, you get 10 pages to test with your own documents.",
      },
    },
    {
      "@type": "Question",
      name: "Is my data secure?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. We're SOC 2 Type I and HIPAA compliant. Your documents are encrypted in transit (TLS) and at rest (256-bit AES). We process documents in isolated environments and automatically delete them after 30 days. We never train our models on your data.",
      },
    },
    {
      "@type": "Question",
      name: "What export formats are supported?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Export to CSV (perfect for spreadsheets), JSON (for developers), or Markdown (for documentation). You can also copy individual sections directly.",
      },
    },
  ],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSoftware) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFAQ) }}
      />
      <Header />
      <main>
        <Hero />
        <MultipleOutputs />
        <SecondaryFeatures />
        <CallToAction />
        {/* <Testimonials /> */}
        <Pricing />
        <Faqs />
      </main>
      <Footer />
    </>
  );
}

import Image from "next/image";

import { Container } from "@/components/marketing/Container";
import backgroundImage from "@/images/background-faqs.jpg";

const faqs = [
  [
    {
      question: "What types of PDFs can Precision PDF handle?",
      answer:
        "We process virtually any PDF: invoices, receipts, bank statements, medical records, legal documents, forms with checkboxes, multi-column layouts, and documents with tables, charts, or mixed content.",
    },
    {
      question: "How accurate is the data extraction?",
      answer: "Our AI achieves 95%+ accuracy on most documents. The interactive viewer lets you verify every extraction by clicking to see the source location in the original PDF.",
    },
    {
      question: "Can I try it before signing up?",
      answer:
        "Absolutely! Our interactive demo lets you explore 8 real-world examples without creating an account. Once you sign up for free, you get 10 pages to test with your own documents.",
    },
  ],
  [
    {
      question: "Is my data secure?",
      answer:
        "Yes. We're SOC 2 Type I and HIPAA compliant. Your documents are encrypted in transit (TLS) and at rest (256-bit AES). We process documents in isolated environments and automatically delete them after 30 days. We never train our models on your data.",
    },
    {
      question: "Is there an API for developers?",
      answer:
        "Yes! All paid plans include API access. Our RESTful API returns structured JSON and includes comprehensive documentation and code examples.",
    },
    {
      question: "How fast is processing?",
      answer:
        "Most documents process in 15-30 seconds. Larger documents may take up to 60 seconds. Batch processing runs multiple documents in parallel.",
    },
  ],
  [
    {
      question: "What export formats are supported?",
      answer:
        "Export to CSV (perfect for spreadsheets), JSON (for developers), or Markdown (for documentation). You can also copy individual sections directly.",
    },
    {
      question: "What happens if I exceed my monthly page limit?",
      answer: "You'll be notified before reaching your limit. You can upgrade anytime or purchase additional pages. We never stop processing mid-document.",
    },
    {
      question: "Can I cancel my subscription anytime?",
      answer:
        "Yes, you can cancel anytime from your dashboard. You'll retain access until the end of your billing period, and your data remains accessible for 30 days.",
    },
  ],
];

export function Faqs() {
  return (
    <section
      id="faq"
      aria-labelledby="faq-title"
      className="relative overflow-hidden bg-slate-50 py-20 sm:py-32"
    >
      <Image
        className="absolute top-0 left-1/2 max-w-none translate-x-[-30%] -translate-y-1/4"
        src={backgroundImage}
        alt=""
        width={1558}
        height={946}
        unoptimized
      />
      <Container className="relative">
        <div className="mx-auto max-w-2xl lg:mx-0">
          <h2
            id="faq-title"
            className="font-display text-3xl tracking-tight text-slate-900 sm:text-4xl"
          >
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-lg tracking-tight text-slate-700">
            Everything you need to know about Precision PDF
          </p>
        </div>
        <ul
          role="list"
          className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-3"
        >
          {faqs.map((column, columnIndex) => (
            <li key={columnIndex}>
              <ul role="list" className="flex flex-col gap-y-8">
                {column.map((faq, faqIndex) => (
                  <li key={faqIndex}>
                    <h3 className="font-display text-lg/7 text-slate-900">
                      {faq.question}
                    </h3>
                    <p className="mt-4 text-sm text-slate-700">{faq.answer}</p>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
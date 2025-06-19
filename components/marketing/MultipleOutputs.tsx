"use client";

import React, { forwardRef, useRef } from "react";
import { cn } from "@/lib/utils";
import { AnimatedBeam } from "@/components/magicui/animated-beam";
import { Container } from "@/components/marketing/Container";
import { FileText, Slice, FileSpreadsheet, FileCode, Table, FileJson, FileType } from "lucide-react";

const Circle = forwardRef<
  HTMLDivElement,
  { className?: string; children?: React.ReactNode }
>(({ className, children }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "z-10 flex size-16 items-center justify-center rounded-full border-2 border-gray-200 bg-white p-3 shadow-lg",
        className,
      )}
    >
      {children}
    </div>
  );
});

Circle.displayName = "Circle";

export function MultipleOutputs() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pdfRef = useRef<HTMLDivElement>(null);
  const precisionRef = useRef<HTMLDivElement>(null);
  const markdownRef = useRef<HTMLDivElement>(null);
  const csvRef = useRef<HTMLDivElement>(null);
  const excelRef = useRef<HTMLDivElement>(null);
  const jsonRef = useRef<HTMLDivElement>(null);
  const docxRef = useRef<HTMLDivElement>(null);
  const txtRef = useRef<HTMLDivElement>(null);

  return (
    <section className="py-20 sm:py-32 bg-gray-50">
      <Container>
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="font-display text-3xl tracking-tight text-slate-900 sm:text-4xl">
            Your Data, Your Way
          </h2>
          <p className="mt-4 text-lg tracking-tight text-slate-700">
            Transform PDFs into the format you need. Export to Markdown, JSON, CSV, Word, 
            Excel, or plain text. One document, endless possibilities.
          </p>
        </div>

        <div
          className={cn(
            "relative flex h-[400px] w-full items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm border border-gray-100",
          )}
          ref={containerRef}
        >
          <div className="flex size-full max-w-5xl flex-row items-center justify-between px-10">
            {/* PDF Input */}
            <div className="flex flex-col items-center gap-2">
              <Circle ref={pdfRef}>
                <FileText className="h-8 w-8 text-blue-600" />
              </Circle>
              <span className="text-sm font-medium text-gray-700">PDF Document</span>
            </div>

            {/* PrecisionPDF Processing */}
            <div className="flex flex-col items-center gap-2">
              <Circle ref={precisionRef} className="size-20 border-blue-600 bg-blue-50">
                <Slice className="h-10 w-10 text-blue-600" />
              </Circle>
              <span className="text-sm font-medium text-gray-900">PrecisionPDF</span>
            </div>

            {/* Multiple Outputs - Two columns */}
            <div className="flex gap-16">
              {/* Left column */}
              <div className="flex flex-col gap-8">
                <div className="flex flex-col items-center gap-2">
                  <Circle ref={markdownRef}>
                    <FileCode className="h-8 w-8 text-green-600" />
                  </Circle>
                  <span className="text-sm font-medium text-gray-700">Markdown</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <Circle ref={jsonRef}>
                    <FileJson className="h-8 w-8 text-orange-600" />
                  </Circle>
                  <span className="text-sm font-medium text-gray-700">JSON</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <Circle ref={csvRef}>
                    <Table className="h-8 w-8 text-purple-600" />
                  </Circle>
                  <span className="text-sm font-medium text-gray-700">CSV</span>
                </div>
              </div>
              
              {/* Right column */}
              <div className="flex flex-col gap-8">
                <div className="flex flex-col items-center gap-2">
                  <Circle ref={docxRef}>
                    <FileType className="h-8 w-8 text-blue-600" />
                  </Circle>
                  <span className="text-sm font-medium text-gray-700">Word</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <Circle ref={excelRef}>
                    <FileSpreadsheet className="h-8 w-8 text-emerald-600" />
                  </Circle>
                  <span className="text-sm font-medium text-gray-700">Excel</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <Circle ref={txtRef}>
                    <FileText className="h-8 w-8 text-gray-600" />
                  </Circle>
                  <span className="text-sm font-medium text-gray-700">Text</span>
                </div>
              </div>
            </div>
          </div>

          {/* Animated Beams */}
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={pdfRef}
            toRef={precisionRef}
            duration={3}
          />
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={precisionRef}
            toRef={markdownRef}
            duration={3}
          />
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={precisionRef}
            toRef={jsonRef}
            duration={3}
          />
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={precisionRef}
            toRef={csvRef}
            duration={3}
          />
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={precisionRef}
            toRef={docxRef}
            duration={3}
          />
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={precisionRef}
            toRef={excelRef}
            duration={3}
          />
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={precisionRef}
            toRef={txtRef}
            duration={3}
          />
        </div>

        {/* Feature highlights */}
        <div className="mt-16 grid grid-cols-2 gap-8 sm:grid-cols-3 lg:gap-12">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-green-100">
              <FileCode className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">Markdown</h3>
            <p className="mt-2 text-sm text-gray-600">
              Perfect for documentation and content management
            </p>
          </div>
          <div className="text-center">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-orange-100">
              <FileJson className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">JSON</h3>
            <p className="mt-2 text-sm text-gray-600">
              Structured data for APIs and developers
            </p>
          </div>
          <div className="text-center">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-purple-100">
              <Table className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">CSV</h3>
            <p className="mt-2 text-sm text-gray-600">
              Ideal for data analysis and databases
            </p>
          </div>
          <div className="text-center">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
              <FileType className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">Word</h3>
            <p className="mt-2 text-sm text-gray-600">
              Editable documents for reports and sharing
            </p>
          </div>
          <div className="text-center">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-emerald-100">
              <FileSpreadsheet className="h-6 w-6 text-emerald-600" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">Excel</h3>
            <p className="mt-2 text-sm text-gray-600">
              Direct import with formatting preserved
            </p>
          </div>
          <div className="text-center">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-gray-100">
              <FileText className="h-6 w-6 text-gray-600" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">Plain Text</h3>
            <p className="mt-2 text-sm text-gray-600">
              Simple, universal format for any application
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
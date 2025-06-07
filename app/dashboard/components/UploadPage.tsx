"use client";

import React, { useState } from "react";

import { useRouter } from "next/navigation";

import { useQueryClient } from "@tanstack/react-query";

import { ProcessingView } from "./ProcessingView";
import UploadScreen from "./UploadScreen";
import { Example } from "./types";

export function UploadPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useProgressiveUpload] = useState(true);

  const handleFileUpload = async (file: File) => {
    setError(null);
    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const endpoint = useProgressiveUpload
        ? "/api/upload-document-progressive"
        : "/api/upload-document";

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 402) {
          // Insufficient credits error
          setError(result.error || "Insufficient credits");
          setIsProcessing(false);
          return;
        }
        if (response.status === 202) {
          console.warn(
            "Document uploaded but processing failed:",
            result.processingError,
          );
          setError(
            result.error ||
              "Document uploaded but processing failed. Please try again later.",
          );
          setIsProcessing(false);
          return;
        }
        throw new Error(result.error || "Failed to upload document");
      }

      // Refetch credits after successful upload
      await queryClient.invalidateQueries({ queryKey: ["credits"] });

      // Redirect to document view
      router.push(`/home/documents/${result.documentId}`);
    } catch (err) {
      console.error("Error during file upload:", err);
      setError(
        `Failed to upload ${file.name}: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
      setIsProcessing(false);
    }
  };

  const handleExampleSelect = async (example: Example) => {
    setError(null);
    setIsProcessing(true);

    try {
      // First, fetch the example data to ensure it exists
      const dataResponse = await fetch(example.dataUrl);
      if (!dataResponse.ok) {
        throw new Error(
          `Failed to load example data: ${dataResponse.statusText}`,
        );
      }
      const exampleData = await dataResponse.json();

      // Create a temporary document entry for the example
      const response = await fetch("/api/examples/create-temp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: example.title,
          dataUrl: example.dataUrl,
          staticBasePath: example.staticImageBasePath,
          markdown: exampleData.markdown,
          chunks: exampleData.chunks,
          num_pages: exampleData.num_pages || 0,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create example document");
      }

      const result = await response.json();

      // Redirect to document view
      router.push(`/home/documents/${result.documentId}`);
    } catch (err) {
      console.error(err);
      setError(
        `Failed to load example: ${example.title}. ${err instanceof Error ? err.message : "Unknown error"}`,
      );
      setIsProcessing(false);
    }
  };

  if (isProcessing) {
    return <ProcessingView />;
  }

  return (
    <UploadScreen
      onFileUpload={handleFileUpload}
      onExampleSelect={handleExampleSelect}
      error={error}
      clearError={() => setError(null)}
    />
  );
}

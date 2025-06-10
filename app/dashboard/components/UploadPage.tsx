"use client";

import React, { useState } from "react";

import { useRouter } from "next/navigation";

import { useQueryClient } from "@tanstack/react-query";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

import { ProcessingView } from "./ProcessingView";
import UploadScreen from "./UploadScreen";
import type { ExampleFile } from "./UploadScreen";

export function UploadPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const createExampleDocument = useMutation(api.documents.createExampleDocument);
  const currentUser = useQuery(api.users.current);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useProgressiveUpload] = useState(true);
  
  // Wait for user authentication to be ready
  if (currentUser === undefined) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  // If user is null, the webhook might not have synced yet
  if (currentUser === null) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Setting up your account...</p>
          <p className="text-sm text-muted-foreground mt-2">
            If this takes more than a few seconds, please refresh the page or contact support.
          </p>
          <p className="text-xs text-muted-foreground mt-4">
            Make sure the Clerk webhook is configured in your Clerk dashboard pointing to:
            <br />
            <code className="text-xs bg-muted px-1 py-0.5 rounded">
              {process.env.NEXT_PUBLIC_CONVEX_URL?.replace('/.convex/cloud', '')}/clerk-users-webhook
            </code>
          </p>
        </div>
      </div>
    );
  }

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

      let result;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        result = await response.json();
      } else {
        const text = await response.text();
        console.error("Non-JSON response:", text);
        result = { error: "Server returned non-JSON response", details: text };
      }

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
      router.push(`/dashboard/documents/${result.documentId}`);
    } catch (err) {
      console.error("Error during file upload:", err);
      // Log more details about the error
      if (err instanceof Error) {
        console.error("Error details:", {
          message: err.message,
          stack: err.stack,
          name: err.name
        });
      }
      setError(
        `Failed to upload ${file.name}: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
      setIsProcessing(false);
    }
  };

  const handleExampleSelect = async (example: ExampleFile) => {
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

      // Create a document entry for the example using Convex mutation
      const documentId = await createExampleDocument({
        title: example.title,
        markdown: exampleData.markdown,
        chunks: exampleData.chunks,
        pageCount: exampleData.num_pages || 0,
        staticBasePath: example.staticImageBasePath,
      });

      // Redirect to document view
      router.push(`/dashboard/documents/${documentId}`);
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

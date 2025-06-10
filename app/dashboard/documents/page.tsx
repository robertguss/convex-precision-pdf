"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Calendar, Eye, Trash2, Download, HardDrive, ImageIcon } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { Authenticated } from "convex/react";

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function getStatusColor(status: string): string {
  switch (status) {
    case "completed":
      return "bg-green-500";
    case "processing":
      return "bg-blue-500";
    case "failed":
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
}

function DocumentsList() {
  const documents = useQuery(api.documents.listDocumentsWithThumbnails);

  if (documents === undefined) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">All Documents</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <CardHeader>
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">All Documents</h1>
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No documents yet</h2>
            <p className="text-muted-foreground mb-4">
              Upload your first PDF to get started
            </p>
            <Button asChild>
              <Link href="/dashboard">Upload Document</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">All Documents</h1>
        <Button asChild>
          <Link href="/dashboard">Upload New</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {documents.map((doc) => (
          <Card key={doc._id} className="hover:shadow-lg transition-shadow overflow-hidden">
            {/* Thumbnail Image */}
            {doc.thumbnailUrl && (
              <div className="relative h-48 bg-gray-100">
                <Image
                  src={doc.thumbnailUrl}
                  alt={`First page of ${doc.title}`}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
            )}
            {!doc.thumbnailUrl && doc.status === "completed" && (
              <div className="h-48 bg-gray-100 flex items-center justify-center">
                <ImageIcon className="h-16 w-16 text-gray-400" />
              </div>
            )}
            
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="line-clamp-1">{doc.title}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-2">
                    <Calendar className="h-3 w-3" />
                    {formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}
                  </CardDescription>
                </div>
                <Badge className={getStatusColor(doc.status)} variant="secondary">
                  {doc.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                  <span>{formatFileSize(doc.fileSize)}</span>
                </div>
                {doc.pageCount && (
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>{doc.pageCount} pages</span>
                  </div>
                )}
              </div>

              {doc.errorMessage && (
                <p className="text-sm text-red-500 line-clamp-2">{doc.errorMessage}</p>
              )}

              <div className="flex gap-2">
                {doc.status === "completed" && (
                  <Button asChild size="sm" className="flex-1">
                    <Link href={`/dashboard/documents/${doc._id}`}>
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Link>
                  </Button>
                )}
                {doc.status === "processing" && (
                  <Button size="sm" className="flex-1" disabled>
                    Processing...
                  </Button>
                )}
                {doc.status === "failed" && (
                  <Button size="sm" variant="outline" className="flex-1" disabled>
                    Failed
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function DocumentsPage() {
  const { isLoaded, isSignedIn } = useUser();

  if (!isLoaded) {
    return null;
  }

  if (!isSignedIn) {
    redirect("/");
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard">
                    Dashboard
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>All Documents</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <Authenticated>
          <DocumentsList />
        </Authenticated>
      </SidebarInset>
    </SidebarProvider>
  );
}
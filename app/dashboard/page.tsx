"use client";

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
import { UploadPage } from "./components/UploadPage";
import { useUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { Authenticated } from "convex/react";

export default function Page() {
  const { isLoaded, isSignedIn } = useUser();

  if (!isLoaded) {
    return null; // or a loading spinner
  }

  if (!isSignedIn) {
    redirect("/");
  }
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Authenticated>
          <UploadPage />
        </Authenticated>
      </SidebarInset>
    </SidebarProvider>
  );
}

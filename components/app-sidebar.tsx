"use client";

import * as React from "react";
import { FileText, Home, CreditCard } from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { CreditBalance } from "@/app/dashboard/components/credit-balance";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarSeparator,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import { useUser } from "@clerk/nextjs";
import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useUser();
  const subscription = useQuery(api.subscriptions.getUserSubscription);
  const createPortalSession = useAction(api.stripe.createPortalSession);

  const handleManageSubscription = async () => {
    try {
      const { url } = await createPortalSession();
      window.location.href = url;
    } catch (error) {
      console.error("Error creating portal session:", error);
    }
  };

  const navItems = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
      isActive: true,
    },
    {
      title: "My Documents",
      url: "/dashboard/documents",
      icon: FileText,
    },
  ];

  const userData = user
    ? {
        name:
          user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`
            : user.emailAddresses[0]?.emailAddress || "User",
        email: user.emailAddresses[0]?.emailAddress || "",
        avatar: user.imageUrl,
      }
    : {
        name: "Guest",
        email: "",
      };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarGroup>
          <SidebarGroupLabel>Precision PDF</SidebarGroupLabel>
          <SidebarGroupContent className="mt-4">
            <CreditBalance />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
        <SidebarSeparator />
        <SidebarGroup>
          <SidebarGroupLabel>Subscription</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-3 py-2">
              <p className="text-sm font-medium">
                {subscription?.plan?.name || "Free Plan"}
              </p>
              <p className="text-xs text-muted-foreground">
                {subscription?.plan?.features?.[0] || "10 pages per month"}
              </p>
              {!subscription && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full"
                  asChild
                >
                  <Link href="/dashboard/upgrade">
                    <CreditCard className="mr-2 h-3 w-3" />
                    Upgrade
                  </Link>
                </Button>
              )}
              {subscription && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full"
                  onClick={handleManageSubscription}
                >
                  <CreditCard className="mr-2 h-3 w-3" />
                  Manage
                </Button>
              )}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

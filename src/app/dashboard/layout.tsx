"use client";

import { useUser } from "@clerk/nextjs";
import { Sidebar } from "@/components/dashboard/sidebar";
import { redirect } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (isLoaded && !user) {
      redirect("/sign-in");
    }
  }, [user, isLoaded]);

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="container max-w-none p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
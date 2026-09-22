"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useAuth } from "../hooks/use-auth";

interface DashboardShellProps {
  title: string;
  children: React.ReactNode;
}

export function DashboardShell({ title, children }: DashboardShellProps) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close sidebar drawer automatically when navigating to a new route
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  // Redirect if not authenticated once mounted
  useEffect(() => {
    if (mounted && !user) {
      router.replace("/login");
    }
  }, [mounted, user, router]);

  // Initial SSR render and before client mounts matches, or while redirecting if unauthenticated
  if (!mounted || !user) {
    return null;
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--bg-primary)" }}>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="app-main-wrapper">
        <Header
          title={title}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        />
        <main className="app-content-body">
          {children}
        </main>
      </div>
    </div>
  );
}

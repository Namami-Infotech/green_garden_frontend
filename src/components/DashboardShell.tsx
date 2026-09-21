"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
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

  // isLoading is always false now — redirect instantly if not authenticated
  useEffect(() => {
    if (!user) {
      router.replace("/login");
    }
  }, [user, router]);

  // Not authenticated — show nothing while redirect happens
  if (!user) return null;

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--bg-primary)" }}>
      <Sidebar />
      <div
        style={{
          marginLeft: "var(--sidebar-width)",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          paddingTop: "var(--header-height)",
        }}
      >
        <Header title={title} />
        <main style={{ padding: "32px", flex: 1, maxWidth: "1600px", width: "100%", margin: "0 auto" }}>
          {children}
        </main>
      </div>
    </div>
  );
}

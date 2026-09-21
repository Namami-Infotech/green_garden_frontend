"use client";

import React from "react";
import { Shield } from "lucide-react";
import { useAuth } from "../hooks/use-auth";
import { UserRole } from "../modules/auth/types/index";

export function Header({ title }: { title: string }) {
  const { user, login, token } = useAuth();

  const handleRoleSwitch = async (newRole: UserRole) => {
    if (!user) return;

    const roleEmails: Record<UserRole, string> = {
      SECRETARY: "secretary@society.com",
      ACCOUNTANT: "accountant@society.com",
      SECURITY: "security@society.com",
      USER: "amit.patel@gmail.com",
    };

    try {
      const email = roleEmails[newRole];
      const res = await fetch("http://localhost:5007/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: "123456" }),
      });
      const data = await res.json();
      if (data?.data?.token && data?.data?.user) {
        login(data.data.token, data.data.user);
        return;
      }
    } catch {
      // Fallback
    }

    login(token || "mock_token", {
      ...user,
      role: newRole,
    });
  };

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: "var(--sidebar-width)",
        right: 0,
        height: "var(--header-height)",
        backgroundColor: "rgba(255, 255, 255, 0.96)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border-color)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 32px",
        zIndex: 40,
        boxShadow: "0 1px 4px rgba(0, 0, 0, 0.04)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <h1 style={{ fontSize: "1.35rem", fontWeight: 700, color: "#0f172a" }}>
          {title}
        </h1>
        <span
          style={{
            fontSize: "0.75rem",
            color: "#059669",
            backgroundColor: "#ecfdf5",
            padding: "3px 10px",
            borderRadius: "9999px",
            fontWeight: 600,
            border: "1px solid #a7f3d0",
          }}
        >
          Green Place
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        {/* Role Switcher Pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: "#f8fafc",
            padding: "4px 6px",
            borderRadius: "10px",
            border: "1px solid var(--border-color)",
          }}
        >
          <Shield size={14} color="#64748b" style={{ marginLeft: "4px" }} />
          <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600, marginRight: "4px" }}>Role:</span>
          {(["SECRETARY", "ACCOUNTANT", "SECURITY", "USER"] as UserRole[]).map((r) => (
            <button
              key={r}
              onClick={() => handleRoleSwitch(r)}
              style={{
                background: user?.role === r ? "linear-gradient(135deg, #10b981, #059669)" : "transparent",
                color: user?.role === r ? "#ffffff" : "#475569",
                border: "none",
                fontSize: "0.75rem",
                padding: "4px 10px",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: 600,
                transition: "all 0.15s ease",
                boxShadow: user?.role === r ? "0 2px 6px rgba(16, 185, 129, 0.3)" : "none",
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}

"use client";

import React from "react";
import { Shield, Menu } from "lucide-react";
import { useAuth } from "../hooks/use-auth";
import { UserRole } from "../modules/auth/types/index";

interface HeaderProps {
  title: string;
  onToggleSidebar?: () => void;
}

export function Header({ title, onToggleSidebar }: HeaderProps) {
  const { user, login, token } = useAuth();

  console.log(user, token, user, "saaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");



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
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: "123456" }),
      }).catch(() => fetch("http://localhost:5007/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: "123456" }),
      }));
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
    <header className="app-header">
      <div className="header-title-wrapper">
        {onToggleSidebar && (
          <button
            type="button"
            className="sidebar-toggle-btn"
            onClick={onToggleSidebar}
            aria-label="Toggle navigation menu"
            id="mobile-sidebar-toggle"
          >
            <Menu size={20} />
          </button>
        )}
        <h1 className="header-title-text">
          {title}
        </h1>
        <span className="header-badge">
          Green Place
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {/* <Shield size={16} color="#10b981" /> */}
        <span
          style={{
            fontSize: "0.8rem",
            color: "#059669",
            fontWeight: 700,
            background: "#ecfdf5",
            padding: "4px 10px",
            borderRadius: "6px",
          }}
        >
          {user?.role}
        </span>
      </div>
    </header>
  );
}

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

      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {/* Desktop Role Switcher: Full Button Group */}
        <div className="desktop-role-switcher">
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

        {/* Mobile Role Switcher: Compact Clean Selector */}
        <div className="mobile-role-switcher">
          <Shield size={16} color="#10b981" />
          <select
            className="mobile-role-select"
            value={user?.role || "USER"}
            onChange={(e) => handleRoleSwitch(e.target.value as UserRole)}
            aria-label="Switch Role"
          >
            <option value="SECRETARY">Secretary</option>
            <option value="ACCOUNTANT">Accountant</option>
            <option value="SECURITY">Security</option>
            <option value="USER">Resident</option>
          </select>
        </div>
      </div>
    </header>
  );
}

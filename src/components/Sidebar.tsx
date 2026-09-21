"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building2,
  Home,
  Settings,
  ShieldCheck,
  Trees,
  LogOut,
  ReceiptText,
} from "lucide-react";
import { useAuth } from "../hooks/use-auth";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["USER", "SECRETARY", "ACCOUNTANT", "SECURITY"] },
  { label: "Users & Staff", href: "/users", icon: Users, roles: ["SECRETARY", "ACCOUNTANT"] },
  { label: "Towers & Blocks", href: "/blocks", icon: Building2, roles: ["USER", "SECRETARY", "ACCOUNTANT", "SECURITY"] },
  { label: "Flats & Units", href: "/flats", icon: Home, roles: ["USER", "SECRETARY", "ACCOUNTANT", "SECURITY"] },
  { label: "Transactions & Dues", href: "/transactions", icon: ReceiptText, roles: ["USER", "SECRETARY", "ACCOUNTANT"] },
  { label: "Society Settings", href: "/settings", icon: Settings, roles: ["SECRETARY", "ACCOUNTANT"] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside
      style={{
        width: "var(--sidebar-width)",
        height: "100vh",
        maxHeight: "100vh",
        backgroundColor: "#0f172a",
        borderRight: "1px solid #1e293b",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 50,
        overflow: "hidden",
      }}
    >
      {/* Brand Logo */}
      <div
        style={{
          height: "var(--header-height)",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "0 22px",
          borderBottom: "1px solid #1e293b",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #10b981, #059669)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 16px rgba(16, 185, 129, 0.45)",
          }}
        >
          <Trees size={24} color="#ffffff" />
        </div>
        <div>
          <h2 style={{ fontSize: "1.15rem", fontWeight: "800", color: "#ffffff", lineHeight: 1.1, letterSpacing: "-0.01em" }}>
            GREEN PLACE
          </h2>
          <span style={{ fontSize: "0.7rem", color: "#34d399", fontWeight: 700, letterSpacing: "0.08em" }}>
            RESIDENTIAL ECO-LIVING
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav
        style={{
          padding: "16px 14px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          flex: 1,
          overflowY: "auto",
        }}
      >
        <div
          style={{
            fontSize: "0.725rem",
            fontWeight: "700",
            textTransform: "uppercase",
            color: "#94a3b8",
            padding: "0 12px 4px 12px",
            letterSpacing: "0.08em",
          }}
        >
          Modules
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          const canAccess = !user || item.roles.includes(user.role);

          if (!canAccess) return null;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-link ${isActive ? "active" : ""}`}
            >
              <Icon size={19} className="nav-icon" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Footer Section: User Profile & Logout */}
      <div
        style={{
          padding: "14px",
          borderTop: "1px solid #1e293b",
          backgroundColor: "rgba(0, 0, 0, 0.35)",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          flexShrink: 0,
        }}
      >
        {user && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 12px",
              borderRadius: "10px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #10b981, #059669)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "0.9rem",
                flexShrink: 0,
                boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)",
              }}
            >
              {user.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  color: "#f8fafc",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {user.name}
              </div>
              <div style={{ fontSize: "0.7rem", color: "#34d399", fontWeight: 600, letterSpacing: "0.02em" }}>
                {user.role}
              </div>
            </div>
          </div>
        )}

        {/* Logout Button */}
        <button
          onClick={logout}
          className="sidebar-logout-btn"
          id="sidebar-logout-btn"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "0.7rem", color: "#64748b" }}>
          <ShieldCheck size={14} color="#10b981" />
          <span style={{ fontWeight: 500 }}>RBAC Protected System</span>
        </div>
      </div>
    </aside>
  );
}

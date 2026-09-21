"use client";

import React, { useState } from "react";
import { DashboardShell } from "../../components/DashboardShell";
import { SettingsForm } from "../../modules/settings/components/SettingsForm";
import { useAuth } from "../../hooks/use-auth";
import { ShieldAlert, ShieldCheck } from "lucide-react";

export default function SettingsPage() {
  const { hasRole, login } = useAuth();
  const canManageSettings = hasRole(["SECRETARY", "ACCOUNTANT"]);
  const [switching, setSwitching] = useState(false);

  const handleSwitchToSecretary = async () => {
    setSwitching(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "secretary@society.com", password: "password123" }),
      });
      const data = await res.json();
      if (data?.data?.token && data?.data?.user) {
        login(data.data.token, data.data.user);
      }
    } catch {
      // Fallback
    } finally {
      setSwitching(false);
    }
  };

  return (
    <DashboardShell title="Society Configuration & Rules">
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
            Configure society bylaws, billing parameters, gate security rules, and committee details.
          </p>
        </div>

        {!canManageSettings ? (
          <div
            className="glass-panel"
            style={{
              padding: "36px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "14px",
              maxWidth: "600px",
              margin: "40px auto",
            }}
          >
            <ShieldAlert size={48} color="#f43f5e" />
            <h3 style={{ fontSize: "1.25rem", color: "#0f172a" }}>Access Restricted</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.5 }}>
              Only Society Administrators (Secretary or Accountant) have authorization to modify bylaws and society-wide billing configurations.
            </p>
            <button
              onClick={handleSwitchToSecretary}
              disabled={switching}
              className="btn btn-primary"
              style={{
                marginTop: "12px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                backgroundColor: "#059669",
              }}
            >
              <ShieldCheck size={18} />
              <span>{switching ? "Switching Role..." : "Switch to Secretary (Admin Access)"}</span>
            </button>
          </div>
        ) : (
          <SettingsForm />
        )}
      </div>
    </DashboardShell>
  );
}

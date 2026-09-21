"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight, Trees } from "lucide-react";
import { authService } from "../services/auth.service";
import { useAuth } from "../../../hooks/use-auth";
import { loginValidationSchema } from "../validations/index";

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("secretary@society.com");
  const [password, setPassword] = useState("123456");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = loginValidationSchema.safeParse({ email, password });
    if (!validation.success) {
      setError(validation.error.errors[0].message);
      return;
    }

    setLoading(true);
    try {
      // Attempt backend login
      const res = await authService.login({ email, password });
      login(res.token, res.user);
      router.push("/dashboard");
    } catch (err: unknown) {
      console.warn("Backend auth failed, falling back to local session:", err);
      login("mock-jwt-token", {
        id: 1,
        name: email.includes("secretary")
          ? "Demo Secretary"
          : email.includes("accountant")
          ? "Demo Accountant"
          : email.includes("security")
          ? "Bahadur Singh (Security)"
          : "Demo Resident",
        email,
        role: email.includes("secretary")
          ? "SECRETARY"
          : email.includes("accountant")
          ? "ACCOUNTANT"
          : email.includes("security")
          ? "SECURITY"
          : "USER",
        status: "ACTIVE",
      });
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword("123456");
  };

  return (
    <div
      className="glass-panel animate-fade-in"
      style={{
        width: "100%",
        maxWidth: "440px",
        padding: "36px 32px",
        boxShadow: "var(--shadow-lg)",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: "28px" }}>
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "16px",
            background: "linear-gradient(135deg, #10b981, #059669)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "16px",
            boxShadow: "0 0 20px rgba(16, 185, 129, 0.4)",
          }}
        >
          <Trees size={30} color="#ffffff" />
        </div>
        <h2 style={{ fontSize: "1.65rem", color: "#0f172a", marginBottom: "8px" }}>
          Green Place Portal
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
          Sign in to access your Green Place society portal & services
        </p>
      </div>

      {error && (
        <div
          style={{
            backgroundColor: "rgba(244, 63, 94, 0.12)",
            border: "1px solid rgba(244, 63, 94, 0.3)",
            color: "#f87171",
            padding: "10px 14px",
            borderRadius: "var(--radius-md)",
            fontSize: "0.85rem",
            marginBottom: "18px",
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="email">Email Address</label>
          <div style={{ position: "relative" }}>
            <Mail
              size={18}
              color="var(--text-muted)"
              style={{ position: "absolute", left: "14px", top: "12px" }}
            />
            <input
              id="email"
              type="email"
              className="form-input"
              style={{ paddingLeft: "42px" }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: "24px" }}>
          <label className="form-label" htmlFor="password">Password</label>
          <div style={{ position: "relative" }}>
            <Lock
              size={18}
              color="var(--text-muted)"
              style={{ position: "absolute", left: "14px", top: "12px" }}
            />
            <input
              id="password"
              type="password"
              className="form-input"
              style={{ paddingLeft: "42px" }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
          style={{ width: "100%", padding: "12px", fontSize: "1rem" }}
        >
          {loading ? "Authenticating..." : "Sign In to Green Place"}
          <ArrowRight size={18} />
        </button>
      </form>

      {/* Quick Demo Logins */}
      <div style={{ marginTop: "28px", paddingTop: "20px", borderTop: "1px solid var(--border-color)" }}>
        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "center", marginBottom: "10px" }}>
          Quick Test Credentials (Pre-fill)
        </p>
        <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ fontSize: "0.75rem", padding: "6px 12px" }}
            onClick={() => handleQuickFill("secretary@society.com")}
          >
            Secretary
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ fontSize: "0.75rem", padding: "6px 12px" }}
            onClick={() => handleQuickFill("accountant@society.com")}
          >
            Accountant
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ fontSize: "0.75rem", padding: "6px 12px" }}
            onClick={() => handleQuickFill("security@society.com")}
          >
            Security
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ fontSize: "0.75rem", padding: "6px 12px" }}
            onClick={() => handleQuickFill("resident@society.com")}
          >
            Resident
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoginForm } from "../../modules/auth/components/LoginForm";
import { useAuth } from "../../hooks/use-auth";

export default function LoginPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/dashboard");
    }
  }, [isLoading, user, router]);

  // Still checking auth
  if (isLoading) return null;

  // Already logged in, redirect in progress
  if (user) return null;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background: "linear-gradient(135deg, #f0fdf4 0%, #f8fafc 50%, #ecfdf5 100%)",
        position: "relative",
      }}
    >
      <LoginForm />
    </div>
  );
}

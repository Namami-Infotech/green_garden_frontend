"use client";

import React from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";
import { useToast, ToastItem } from "../hooks/use-toast";

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const toastStyles: Record<
  string,
  {
    bg: string;
    border: string;
    iconColor: string;
    progressColor: string;
    shadow: string;
    titleColor: string;
  }
> = {
  success: {
    bg: "linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)",
    border: "#86efac",
    iconColor: "#059669",
    progressColor: "#10b981",
    shadow: "0 10px 25px -3px rgba(16, 185, 129, 0.18), 0 4px 6px -2px rgba(16, 185, 129, 0.08)",
    titleColor: "#065f46",
  },
  error: {
    bg: "linear-gradient(135deg, #ffffff 0%, #fef2f2 100%)",
    border: "#fca5a5",
    iconColor: "#dc2626",
    progressColor: "#ef4444",
    shadow: "0 10px 25px -3px rgba(239, 68, 68, 0.18), 0 4px 6px -2px rgba(239, 68, 68, 0.08)",
    titleColor: "#991b1b",
  },
  warning: {
    bg: "linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)",
    border: "#fde68a",
    iconColor: "#d97706",
    progressColor: "#f59e0b",
    shadow: "0 10px 25px -3px rgba(245, 158, 11, 0.18), 0 4px 6px -2px rgba(245, 158, 11, 0.08)",
    titleColor: "#92400e",
  },
  info: {
    bg: "linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)",
    border: "#93c5fd",
    iconColor: "#2563eb",
    progressColor: "#3b82f6",
    shadow: "0 10px 25px -3px rgba(59, 130, 246, 0.18), 0 4px 6px -2px rgba(59, 130, 246, 0.08)",
    titleColor: "#1e40af",
  },
};

function ToastCard({ toast, onRemove }: { toast: ToastItem; onRemove: (id: string) => void }) {
  const IconComponent = icons[toast.type] || Info;
  const style = toastStyles[toast.type] || toastStyles.info;
  const duration = toast.duration || 4000;

  return (
    <div
      className="toast-item"
      style={{
        position: "relative",
        background: style.bg,
        border: `1px solid ${style.border}`,
        borderRadius: "14px",
        padding: "14px 18px",
        boxShadow: style.shadow,
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        minWidth: "320px",
        maxWidth: "420px",
        overflow: "hidden",
        pointerEvents: "auto",
        animation: "toastSlideIn 0.32s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      }}
    >
      <div
        style={{
          flexShrink: 0,
          marginTop: "1px",
        }}
      >
        <IconComponent size={22} color={style.iconColor} />
      </div>

      <div style={{ flex: 1, paddingRight: "6px" }}>
        {toast.title && (
          <div
            style={{
              fontSize: "0.95rem",
              fontWeight: 700,
              color: style.titleColor,
              marginBottom: "2px",
            }}
          >
            {toast.title}
          </div>
        )}
        <div
          style={{
            fontSize: "0.88rem",
            color: "#334155",
            lineHeight: 1.45,
            fontWeight: 500,
          }}
        >
          {toast.message}
        </div>
      </div>

      <button
        onClick={() => onRemove(toast.id)}
        aria-label="Dismiss notification"
        style={{
          flexShrink: 0,
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: "#94a3b8",
          padding: "2px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "6px",
          transition: "all 0.15s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "#475569";
          e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.05)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "#94a3b8";
          e.currentTarget.style.backgroundColor = "transparent";
        }}
      >
        <X size={16} />
      </button>

      {/* Timer Progress Bar */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          height: "3px",
          backgroundColor: style.progressColor,
          width: "100%",
          animation: `toastProgress ${duration}ms linear forwards`,
          transformOrigin: "left",
        }}
      />
    </div>
  );
}

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "22px",
        right: "22px",
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        pointerEvents: "none",
      }}
    >
      {toasts.map((item) => (
        <ToastCard key={item.id} toast={item} onRemove={removeToast} />
      ))}
    </div>
  );
}

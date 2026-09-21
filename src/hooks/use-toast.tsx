"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, "id">) => string;
  removeToast: (id: string) => void;
  toast: {
    success: (message: string, title?: string, duration?: number) => string;
    error: (message: string, title?: string, duration?: number) => string;
    info: (message: string, title?: string, duration?: number) => string;
    warning: (message: string, title?: string, duration?: number) => string;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Standalone global listener for calling toast outside components
type ToastListener = (toast: Omit<ToastItem, "id">) => void;
let globalToastListener: ToastListener | null = null;

export const toast = {
  success: (message: string, title?: string, duration?: number) => {
    if (globalToastListener) {
      globalToastListener({ type: "success", message, title, duration });
    }
  },
  error: (message: string, title?: string, duration?: number) => {
    if (globalToastListener) {
      globalToastListener({ type: "error", message, title, duration });
    }
  },
  info: (message: string, title?: string, duration?: number) => {
    if (globalToastListener) {
      globalToastListener({ type: "info", message, title, duration });
    }
  },
  warning: (message: string, title?: string, duration?: number) => {
    if (globalToastListener) {
      globalToastListener({ type: "warning", message, title, duration });
    }
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((newToast: Omit<ToastItem, "id">) => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const item: ToastItem = { ...newToast, id };

    setToasts((prev) => [...prev, item]);

    const duration = newToast.duration || 4000;
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, [removeToast]);

  useEffect(() => {
    globalToastListener = addToast;
    return () => {
      globalToastListener = null;
    };
  }, [addToast]);

  const toastMethods = {
    success: (message: string, title?: string, duration?: number) =>
      addToast({ type: "success", message, title, duration }),
    error: (message: string, title?: string, duration?: number) =>
      addToast({ type: "error", message, title, duration }),
    info: (message: string, title?: string, duration?: number) =>
      addToast({ type: "info", message, title, duration }),
    warning: (message: string, title?: string, duration?: number) =>
      addToast({ type: "warning", message, title, duration }),
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, toast: toastMethods }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Return fallback bound to global listener so it never crashes
    return {
      toasts: [],
      addToast: () => "",
      removeToast: () => {},
      toast,
    };
  }
  return context;
}

import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "../hooks/use-auth";
import { ToastProvider } from "../hooks/use-toast";
import { ToastContainer } from "../components/ToastContainer";

export const metadata: Metadata = {
  title: "Green Place | Residential Society Management System",
  description:
    "Eco-living community and society management system for Green Place residents, towers, flat allocations, accounts, and administration.",
  icons: {
    icon: [
      { url: "/favicon.svg?v=2", type: "image/svg+xml" },
      { url: "/favicon.ico?v=2", sizes: "any" },
    ],
    shortcut: "/favicon.ico?v=2",
    apple: "/apple-touch-icon.png?v=2",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning style={{ backgroundColor: "#f8fafc" }}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=2" />
        <link rel="alternate icon" href="/favicon.ico?v=2" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png?v=2" />
      </head>
      <body suppressHydrationWarning>
        <AuthProvider>
          <ToastProvider>
            {children}
            <ToastContainer />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

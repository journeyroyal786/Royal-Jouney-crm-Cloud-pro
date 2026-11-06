import type { Metadata, Viewport } from "next";
import { ReactNode } from "react";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Royal Journey CRM",
  description: "Real estate CRM for Royal Journey – Dubai",
  icons: { icon: "/logo.png" },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#270403" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body><AuthProvider>{children}</AuthProvider></body>
    </html>
  );
}

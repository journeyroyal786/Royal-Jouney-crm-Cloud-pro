"use client";
import { ReactNode } from "react";
import { DataProvider } from "@/lib/data";
import Shell from "@/components/Shell";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (<DataProvider><Shell>{children}</Shell></DataProvider>);
}

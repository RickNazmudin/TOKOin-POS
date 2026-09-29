"use client";

import React from "react";
import { PrinterProvider } from "@/context/PrinterContext";

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PrinterProvider>{children}</PrinterProvider>;
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "TPMS — MIMOS Academy",
    template: "%s · TPMS MIMOS Academy",
  },
  description:
    "Training Programme Management System (TPMS) — Sistem pengurusan program latihan MIMOS Academy.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ms">
      <body className="min-h-screen bg-background font-sans text-foreground">
        {children}
      </body>
    </html>
  );
}

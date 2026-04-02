import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Club Vivo",
  description: "Week 12 frontend scaffold for the first coach-facing SIC web surface."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

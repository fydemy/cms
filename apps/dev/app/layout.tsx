import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Simple CMS Demo",
  description: "File-based CMS for Next.js",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

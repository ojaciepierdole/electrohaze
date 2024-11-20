import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PDF Analyzer",
  description: "Analiza dokumentów PDF z wykorzystaniem Azure Document Intelligence",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

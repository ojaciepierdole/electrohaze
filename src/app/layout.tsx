import type { Metadata } from "next";
import "./globals.css";
import { ClientLayout } from "@/components/ClientLayout";

export const metadata: Metadata = {
  title: "Analizator Faktur",
  description: "Analiza dokumentów PDF z wykorzystaniem Azure Document Intelligence",
  openGraph: {
    title: "Analizator Faktur",
    description: "Analiza dokumentów PDF z wykorzystaniem Azure Document Intelligence",
    images: [
      {
        url: "public/iconapp.png",
        width: 1200,
        height: 630,
        alt: "Ikona aplikacji"
      }
    ],
    locale: "pl_PL",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nazwa Twojego Projektu",
    description: "Analiza dokumentów PDF z wykorzystaniem Azure Document Intelligence",
    images: ["public/iconapp.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pl">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

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
  metadataBase: new URL(process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000'
  )
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
      <body>{children}</body>
    </html>
  );
}

import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import { Toaster } from "@/components/ui/toaster"
import { ClientLayout } from '@/components/ClientLayout';

const inter = Inter({ subsets: ['latin', 'latin-ext'] });

export const metadata: Metadata = {
  title: 'PDF Analyzer - Analiza dokumentów',
  description: 'Aplikacja do analizy dokumentów PDF przy użyciu Azure Document Intelligence',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl">
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen bg-gray-50">
            <ClientLayout>
              {children}
            </ClientLayout>
          </div>
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}

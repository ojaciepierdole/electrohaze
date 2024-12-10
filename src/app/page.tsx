'use client';

import { ProcessingClient } from '@/components/ProcessingClient';

export default function Home() {
  return (
    <main className="container mx-auto py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Analiza dokumentów PDF</h1>
          <p className="text-gray-500 mt-2">
            Przetwarzaj dokumenty PDF używając modeli OCR Azure Document Intelligence
          </p>
        </div>
        
        <ProcessingClient />
      </div>
    </main>
  );
}

'use client';

import { ProcessingClient } from '@/components/ProcessingClient';

export default function Home() {
  return (
    <main className="container mx-auto py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <p className="text-gray-500">
            Przetwarzaj dokumenty PDF używając modeli OCR Azure Document Intelligence
          </p>
        </div>
        
        <ProcessingClient />
      </div>
    </main>
  );
}

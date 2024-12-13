'use client';

import { ProcessingClient } from './ProcessingClient';

export function ProcessingClientWrapper() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">
          Analiza dokumentów PDF
        </h1>
        <p className="text-gray-600">
          Przetwarzaj dokumenty PDF używając modeli OCR Azure Document Intelligence
        </p>
        <ProcessingClient />
      </div>
    </div>
  );
} 
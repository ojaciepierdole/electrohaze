'use client';

import { ProcessingClient } from './ProcessingClient';

export function ProcessingClientWrapper() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">
          Przetwarzanie wsadowe dokumentów
        </h1>
        <p className="text-gray-600">
          Wybierz pliki PDF i modele do analizy. Możesz przetworzyć do 20 plików jednocześnie.
        </p>
        <ProcessingClient />
      </div>
    </div>
  );
} 
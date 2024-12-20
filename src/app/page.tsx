'use client';

import React, { useState } from 'react';
import { ProcessingClient } from '@/components/ProcessingClient';
import { ProcessingResult } from '@/types/processing';
import { Toaster } from '@/components/ui/toaster';

export default function Home() {
  const [results, setResults] = useState<ProcessingResult[]>([]);

  const handleResults = (newResults: ProcessingResult[]) => {
    setResults(newResults);
  };

  return (
    <main className="min-h-screen p-4">
      <div className="max-w-3xl mx-auto space-y-4">
        <ProcessingClient onResults={handleResults} />
      </div>
      <Toaster />
    </main>
  );
}

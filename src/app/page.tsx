'use client';

import { ProcessingClient } from '@/components/ProcessingClient';

export default function Home() {
  return (
    <main className="container mx-auto py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <ProcessingClient />
      </div>
    </main>
  );
}

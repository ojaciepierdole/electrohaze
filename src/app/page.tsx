'use client';

import React from 'react';
import { ProcessingClient } from '@/components/ProcessingClient';
import { Toaster } from '@/components/ui/toaster';

export default function Home() {
  return (
    <main className="container mx-auto p-4 space-y-4">
      <ProcessingClient />
      <Toaster />
    </main>
  );
}

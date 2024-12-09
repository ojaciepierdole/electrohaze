'use client';

import { ModelProvider } from '@/context/ModelContext';
import { Header } from './Header';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModelProvider>
      <Header />
      {children}
    </ModelProvider>
  );
} 
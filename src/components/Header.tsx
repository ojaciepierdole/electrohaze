'use client';

import * as React from 'react';
import Link from 'next/link';
import { FileText } from 'lucide-react';

export function Header() {
  return (
    <div className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center">
          <Link href="/" className="flex items-center gap-2">
            <FileText className="h-6 w-6" />
            <span className="text-lg font-semibold">Document Analysis</span>
          </Link>
        </div>
      </div>
    </div>
  );
} 
'use client';

import * as React from 'react';
import { DocumentList } from '@/components/DocumentList';
import type { ProcessingResult } from '@/types/processing';
import { motion, AnimatePresence } from 'framer-motion';

interface BatchProcessingResultsProps {
  results: ProcessingResult[];
}

export function BatchProcessingResults({ results }: BatchProcessingResultsProps) {
  if (!results.length) return null;

  return (
    <div className="space-y-4">
      <DocumentList documents={results} />
    </div>
  );
} 
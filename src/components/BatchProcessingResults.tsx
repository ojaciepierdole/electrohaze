'use client';

import * as React from 'react';
import { DocumentList } from '@/components/DocumentList';
import type { ProcessingResult } from '@/types/processing';
import { motion, AnimatePresence } from 'framer-motion';

interface BatchProcessingResultsProps {
  results: ProcessingResult[];
  onExport?: () => void;
}

export function BatchProcessingResults({ results, onExport }: BatchProcessingResultsProps) {
  // Oblicz całkowity czas przetwarzania
  const totalTime = results.reduce((sum, result) => sum + result.processingTime, 0);

  return (
    <motion.div 
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <DocumentList
        documents={results}
        totalTime={totalTime}
        onExport={onExport}
      />
    </motion.div>
  );
} 
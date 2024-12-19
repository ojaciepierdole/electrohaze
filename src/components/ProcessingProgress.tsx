'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProcessingResult } from '@/types/processing';
import { motion, AnimatePresence } from 'framer-motion';

interface ProcessingProgressProps {
  isProcessing: boolean;
  currentFileIndex: number;
  totalFiles: number;
  results: ProcessingResult[];
  error: string | null;
  onReset?: () => void;
}

export function ProcessingProgress({
  isProcessing,
  currentFileIndex,
  totalFiles,
  results,
  error,
  onReset
}: ProcessingProgressProps) {
  const progress = totalFiles > 0 ? (currentFileIndex / totalFiles) * 100 : 0;
  const isComplete = !isProcessing && currentFileIndex === totalFiles && !error;

  return (
    <Card className="border-gray-900/10">
      <div className="p-4 space-y-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {isProcessing ? 'Przetwarzanie...' : 
                 error ? 'Błąd przetwarzania' : 
                 isComplete ? 'Zakończono' : 'Zatrzymano'}
              </span>
              <span className="text-sm text-gray-500">
                {results.length} z {totalFiles} plików
              </span>
            </div>
            {(!isProcessing || error) && onReset && (
              <Button
                variant="outline"
                size="sm"
                onClick={onReset}
              >
                {error ? 'Spróbuj ponownie' : 'Nowa analiza'}
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <Progress 
              value={progress} 
              className={cn(
                "transition-all duration-300",
                error ? "bg-red-500" : 
                isComplete ? "bg-green-500" : undefined
              )}
            />
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        {results.length > 0 && !error && (
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {results.map((result, index) => (
              <motion.div
                key={`${result.fileName}-${index}`}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center justify-between py-1 text-sm"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {result.confidence >= 0.8 ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                  )}
                  <span className="truncate">{result.fileName}</span>
                </div>
                <span className={cn(
                  "ml-2",
                  result.confidence >= 0.8 ? "text-green-600" : "text-red-600"
                )}>
                  {(result.confidence * 100).toFixed(0)}%
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
} 
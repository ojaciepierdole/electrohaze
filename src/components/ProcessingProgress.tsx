'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProcessingResult } from '@/types/processing';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

interface ProcessingProgressProps {
  currentFile: string | null;
  fileProgress: number;
  totalProgress: number;
  error: string | null;
}

export function ProcessingProgress({
  currentFile,
  fileProgress,
  totalProgress,
  error
}: ProcessingProgressProps) {
  return (
    <Card className="p-4 space-y-4">
      {/* Nagłówek */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Przetwarzanie dokumentów</h3>
        {error && (
          <Badge variant="destructive" className="text-xs">
            Błąd
          </Badge>
        )}
      </div>

      {/* Postęp */}
      <div className="space-y-4">
        {currentFile && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Aktualny plik:</span>
              <span className="font-medium">{currentFile}</span>
            </div>
            <Progress value={fileProgress} />
          </div>
        )}
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Całkowity postęp:</span>
            <span className="font-medium">{totalProgress.toFixed(0)}%</span>
          </div>
          <Progress value={totalProgress} />
        </div>
      </div>

      {/* Błąd */}
      {error && (
        <div className="p-3 rounded-md bg-red-50 border border-red-200">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </Card>
  );
} 
'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronDown, ChevronUp, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProcessingResult } from '@/types/processing';

interface ProcessingProgressProps {
  isProcessing: boolean;
  currentFileIndex: number;
  currentFileName: string | null;
  currentModelIndex: number;
  currentModelId: string | null;
  fileProgress: number;
  totalProgress: number;
  totalFiles: number;
  results: ProcessingResult[];
  error: string | null;
  onExpand?: () => void;
  onCollapse?: () => void;
  onReset?: () => void;
}

export function ProcessingProgress({
  isProcessing,
  currentFileIndex,
  currentFileName,
  currentModelIndex,
  currentModelId,
  fileProgress,
  totalProgress,
  totalFiles,
  results,
  error,
  onExpand,
  onCollapse,
  onReset
}: ProcessingProgressProps) {
  const [isExpanded, setIsExpanded] = React.useState(true);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    if (isExpanded) {
      onCollapse?.();
    } else {
      onExpand?.();
    }
  };

  const getStatusMessage = () => {
    if (error) return 'Wystąpił błąd podczas przetwarzania';
    if (!isProcessing && results.length === 0) return 'Oczekiwanie na rozpoczęcie';
    if (!isProcessing && results.length > 0) return 'Przetwarzanie zakończone';
    if (currentFileName && currentModelId) {
      return `Przetwarzanie ${currentFileName} (${currentModelId})`;
    }
    return 'Przetwarzanie...';
  };

  const getStatusIcon = () => {
    if (error) return <XCircle className="h-5 w-5 text-red-500" />;
    if (!isProcessing && results.length > 0) return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    if (!isProcessing) return <AlertCircle className="h-5 w-5 text-gray-400" />;
    return null;
  };

  // Oblicz rzeczywisty postęp
  const actualFileProgress = Math.max(0, Math.min(100, fileProgress));
  const actualTotalProgress = Math.max(0, Math.min(100, totalProgress));

  return (
    <Card className={cn(
      "processing-progress border-gray-900/10",
      isExpanded ? "expanded" : "collapsed"
    )}>
      <div className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {getStatusIcon()}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">
                {getStatusMessage()}
              </p>
              {isProcessing && (
                <p className="text-xs text-muted-foreground">
                  Plik {currentFileIndex + 1} z {totalFiles}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isProcessing && results.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={onReset}
                className="text-xs"
              >
                Nowa analiza
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggle}
              className="p-2"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {isProcessing && (
          <div className="mt-4 space-y-2">
            <div className="h-2 relative rounded-full overflow-hidden bg-gray-100">
              <Progress 
                value={actualTotalProgress} 
                className="h-2 transition-all duration-300 ease-in-out"
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Postęp całkowity</span>
              <span>{Math.round(actualTotalProgress)}%</span>
            </div>
          </div>
        )}

        {isExpanded && error && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        {isExpanded && isProcessing && (
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Przetwarzany plik</span>
                <span className="font-medium">{currentFileName}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Model</span>
                <span className="font-medium">{currentModelId}</span>
              </div>
              <div className="h-1.5 relative rounded-full overflow-hidden bg-gray-100">
                <Progress 
                  value={actualFileProgress} 
                  className="h-1.5 transition-all duration-300 ease-in-out"
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Postęp pliku</span>
                <span>{Math.round(actualFileProgress)}%</span>
              </div>
            </div>

            {results.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium">Przetworzone pliki</p>
                <div className="space-y-1">
                  {results.map((result, index) => (
                    <div
                      key={`${result.fileName}-${index}`}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="truncate flex-1">{result.fileName}</span>
                      <span className="text-muted-foreground ml-2">
                        {(result.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
} 
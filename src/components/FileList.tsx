'use client';

import * as React from 'react';
import { File, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface FileListProps {
  files: File[];
  onRemove?: (file: File) => void;
  maxHeight?: string;
}

export function FileList({ files, onRemove, maxHeight }: FileListProps) {
  if (!files.length) {
    return (
      <Card 
        className="bg-gray-50 border-2 border-dashed"
        style={{ maxHeight }}
      >
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
          <File className="h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500">
            Przeciągnij i upuść pliki lub użyj przycisku powyżej
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Obsługiwane formaty: PDF, JPG, PNG
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-white">
      <div className="flex flex-col h-full">
        {files.length > 3 && (
          <div className="px-4 py-2 border-b">
            <p className="text-xs text-gray-500">
              Załadowano {files.length} {files.length === 1 ? 'plik' : files.length < 5 ? 'pliki' : 'plików'}
            </p>
          </div>
        )}
        <ScrollArea 
          className="w-full overflow-y-auto"
          style={{ maxHeight }}
        >
          <div className="p-3 space-y-2">
            {files.map((file, index) => {
              // Skracamy nazwę pliku jeśli jest za długa
              const fileName = file.name;
              const extension = fileName.split('.').pop() || '';
              const nameWithoutExt = fileName.slice(0, -(extension.length + 1));
              const truncatedName = nameWithoutExt.length > 40 
                ? nameWithoutExt.slice(0, 37) + '...' 
                : nameWithoutExt;
              const displayName = `${truncatedName}.${extension}`;

              return (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors group"
                >
                  <div className="flex-shrink-0">
                    <File className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {displayName}
                      </p>
                      <p className="text-xs text-gray-500 flex-shrink-0">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  {onRemove && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemove(file)}
                      className={cn(
                        "h-8 w-8 p-0 rounded-full flex-shrink-0",
                        "opacity-0 group-hover:opacity-100 transition-opacity",
                        "hover:bg-red-100 hover:text-red-600"
                      )}
                    >
                      <X className="h-5 w-5" />
                      <span className="sr-only">Usuń plik</span>
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </Card>
  );
} 
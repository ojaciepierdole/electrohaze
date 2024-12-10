'use client';

import * as React from 'react';
import { File, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

interface FileListProps {
  files: File[];
  onRemove?: (file: File) => void;
}

export function FileList({ files, onRemove }: FileListProps) {
  if (!files.length) {
    return (
      <div className="flex items-center justify-center h-32 border-2 border-dashed rounded-lg">
        <p className="text-sm text-gray-500">Brak wybranych plików</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-64 rounded-md border">
      <div className="p-4">
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center justify-between p-2 rounded-lg bg-gray-50"
            >
              <div className="flex items-center gap-2 min-w-0">
                <File className="h-4 w-4 flex-shrink-0 text-blue-500" />
                <span className="text-sm truncate">{file.name}</span>
                <span className="text-xs text-gray-500">
                  ({Math.round(file.size / 1024)} KB)
                </span>
              </div>
              {onRemove && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => onRemove(file)}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Usuń plik</span>
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
} 
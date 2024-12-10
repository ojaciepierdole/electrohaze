'use client';

import * as React from 'react';
import { FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SelectedFilesListProps {
  files: File[];
  onRemoveFile: (file: File) => void;
  disabled?: boolean;
}

export function SelectedFilesList({ files, onRemoveFile, disabled }: SelectedFilesListProps) {
  if (files.length === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground p-4">
        Nie wybrano żadnych plików
      </div>
    );
  }

  return (
    <div className="p-4 space-y-1">
      {files.map((file, index) => (
        <div
          key={`${file.name}-${index}`}
          className={cn(
            "flex items-center justify-between p-2 rounded-md",
            "hover:bg-muted/10 group",
            "transition-colors"
          )}
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm truncate max-w-[300px]" title={file.name}>
              {file.name}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onRemoveFile(file);
            }}
            disabled={disabled}
            className={cn(
              "h-6 w-6 p-0 rounded-full",
              "text-destructive bg-destructive/10",
              "opacity-0 group-hover:opacity-100",
              "transition-opacity duration-200"
            )}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Usuń plik</span>
          </Button>
        </div>
      ))}
    </div>
  );
} 
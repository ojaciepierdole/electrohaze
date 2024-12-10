'use client';

import * as React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { FileText, Trash2 } from 'lucide-react';
import { truncateFileName } from '@/utils/processing';

interface SelectedFilesListProps {
  files: File[];
  onRemoveFile: (file: File) => void;
  disabled?: boolean;
}

export function SelectedFilesList({ files, onRemoveFile, disabled }: SelectedFilesListProps) {
  if (files.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Nie wybrano żadnych plików
      </div>
    );
  }

  return (
    <ScrollArea className="h-[300px] border rounded-lg">
      <div className="p-4 space-y-2">
        {files.map((file) => (
          <div
            key={file.name}
            className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center gap-3 min-w-0">
              <FileText className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="truncate text-sm">{truncateFileName(file.name)}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemoveFile(file)}
              disabled={disabled}
              className="shrink-0"
            >
              <Trash2 className="w-4 h-4 text-gray-500" />
            </Button>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
} 
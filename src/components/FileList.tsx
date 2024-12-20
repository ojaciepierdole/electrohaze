'use client';

import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface FileListProps {
  files: File[];
  onRemove: (file: File) => void;
  onRemoveAll: () => void;
  isProcessing: boolean;
}

export function FileList({
  files,
  onRemove,
  onRemoveAll,
  isProcessing
}: FileListProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (isProcessing) {
      setIsCollapsed(true);
    }
  }, [isProcessing]);

  if (!files.length) return null;

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <div className="flex items-center gap-2">
            {isCollapsed ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
            <span>Pliki ({files.length})</span>
          </div>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-destructive"
          onClick={onRemoveAll}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          <span>Usuń wszystkie</span>
        </Button>
      </div>
      {!isCollapsed && (
        <ScrollArea className="h-[200px] w-full rounded-md border">
          <div className="p-4 space-y-2">
            {files.map((file, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-center justify-between p-2 rounded-lg",
                  "bg-muted/50 hover:bg-muted/80"
                )}
              >
                <span className="text-sm font-medium">{file.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onRemove(file)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
} 
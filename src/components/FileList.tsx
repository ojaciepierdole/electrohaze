'use client';

import React from 'react';
import { File, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FileListProps {
  files: Array<File>;
  onRemove?: (file: File) => void;
  isProcessing: boolean;
}

export function FileList({ files, onRemove, isProcessing }: FileListProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  React.useEffect(() => {
    if (isProcessing) {
      setIsCollapsed(true);
    }
  }, [isProcessing]);

  return (
    <Collapsible
      open={!isCollapsed}
      onOpenChange={setIsCollapsed}
      className="w-full space-y-2"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Załadowano {files.length} {files.length === 1 ? 'plik' : files.length < 5 ? 'pliki' : 'plików'}
        </h3>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm">
            {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
      </div>

      <CollapsibleContent>
        <ScrollArea className="h-[200px] rounded-md border">
          <div className="space-y-1 p-4">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between rounded-lg border border-transparent bg-white/50 p-2 hover:bg-white/80"
              >
                <div className="flex items-center gap-2">
                  <File className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{file.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                </div>
                {onRemove && !isProcessing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(file);
                    }}
                    className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Usuń plik</span>
                  </Button>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CollapsibleContent>
    </Collapsible>
  );
} 
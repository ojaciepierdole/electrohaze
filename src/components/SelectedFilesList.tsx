'use client';

import * as React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { FileText, Trash2, Eye } from 'lucide-react';
import { truncateFileName } from '@/utils/processing';

interface SelectedFilesListProps {
  files: File[];
  onRemoveFile: (file: File) => void;
  disabled?: boolean;
}

export function SelectedFilesList({ files, onRemoveFile, disabled }: SelectedFilesListProps) {
  // Mapa do przechowywania URL-i dla plików
  const [fileUrls, setFileUrls] = React.useState<Map<string, string>>(new Map());

  // Funkcja do generowania URL dla pliku
  const getFileUrl = React.useCallback((file: File) => {
    if (!fileUrls.has(file.name)) {
      const url = URL.createObjectURL(file);
      setFileUrls(prev => new Map(prev).set(file.name, url));
      return url;
    }
    return fileUrls.get(file.name);
  }, [fileUrls]);

  // Czyszczenie URL-i przy odmontowaniu komponentu
  React.useEffect(() => {
    return () => {
      fileUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [fileUrls]);

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
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const url = getFileUrl(file);
                  if (url) {
                    window.open(url, '_blank');
                  }
                }}
                disabled={disabled}
                className="shrink-0 h-8 w-8 p-0"
                title="Podgląd dokumentu"
              >
                <Eye className="w-4 h-4 text-gray-500" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemoveFile(file)}
                disabled={disabled}
                className="shrink-0 h-8 w-8 p-0"
                title="Usuń plik"
              >
                <Trash2 className="w-4 h-4 text-gray-500" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
} 
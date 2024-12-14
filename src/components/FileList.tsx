'use client';

import * as React from 'react';
import { File, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FileListProps {
  files: File[];
  onRemove?: (file: File) => void;
  maxHeight?: string;
}

export function FileList({ files, onRemove, maxHeight }: FileListProps) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  // Obsługa przewijania z inercją
  React.useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let startY = 0;
    let startScrollTop = 0;
    let momentumID: number | null = null;
    let velocity = 0;
    let lastY = 0;
    let lastTime = 0;

    function startDrag(clientY: number) {
      if (!container) return;
      if (momentumID !== null) {
        cancelAnimationFrame(momentumID);
        momentumID = null;
      }
      startY = clientY;
      startScrollTop = container.scrollTop;
      lastY = clientY;
      lastTime = Date.now();
      velocity = 0;
      setIsDragging(true);
    }

    function drag(clientY: number) {
      if (!isDragging || !container) return;
      
      const deltaY = clientY - lastY;
      const now = Date.now();
      const elapsed = now - lastTime;
      
      velocity = deltaY / elapsed;
      container.scrollTop = startScrollTop - (clientY - startY);
      
      lastY = clientY;
      lastTime = now;
    }

    function endDrag() {
      if (!isDragging || !container) return;
      setIsDragging(false);

      function momentum() {
        if (Math.abs(velocity) > 0.1 && container) {
          container.scrollTop -= velocity * 16; // 16ms = około jedna klatka
          velocity *= 0.95; // Współczynnik tarcia
          momentumID = requestAnimationFrame(momentum);
        }
      }

      momentumID = requestAnimationFrame(momentum);
    }

    function handleTouchStart(e: TouchEvent) {
      startDrag(e.touches[0].clientY);
    }

    function handleTouchMove(e: TouchEvent) {
      e.preventDefault();
      drag(e.touches[0].clientY);
    }

    function handleTouchEnd() {
      endDrag();
    }

    function handleMouseDown(e: MouseEvent) {
      startDrag(e.clientY);
    }

    function handleMouseMove(e: MouseEvent) {
      if (isDragging) {
        e.preventDefault();
        drag(e.clientY);
      }
    }

    function handleMouseUp() {
      endDrag();
    }

    // Touch events
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    // Mouse events
    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (momentumID !== null) {
        cancelAnimationFrame(momentumID);
      }
    };
  }, [isDragging]);

  if (!files.length) {
    return (
      <Card 
        className="bg-gray-50 border-2 border-dashed border-gray-900/10"
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
    <Card className="bg-white border-gray-900/10">
      <div className="flex flex-col h-full">
        <div className="px-4 py-2 border-b border-gray-900/10">
          <p className="text-xs text-gray-500">
            Załadowano {files.length} {files.length === 1 ? 'plik' : files.length < 5 ? 'pliki' : 'plików'}
          </p>
        </div>
        <div
          ref={scrollContainerRef}
          className={cn(
            "w-full overflow-hidden",
            "touch-pan-y overscroll-y-contain",
            isDragging ? "cursor-grabbing" : "cursor-grab"
          )}
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
        </div>
      </div>
    </Card>
  );
} 
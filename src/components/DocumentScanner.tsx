import { useState, useRef, useEffect } from 'react';
import { Camera, X, Plus, Send, ArrowLeft } from 'lucide-react';
import Image from 'next/image';

interface ScannedPage {
  id: string;
  imageUrl: string;
  order: number;
}

interface DocumentScannerProps {
  onScanComplete: (images: File[]) => void;
  onClose: () => void;
}

export function DocumentScanner({ onScanComplete, onClose }: DocumentScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedPages, setScannedPages] = useState<ScannedPage[]>([]);
  const [draggedItem, setDraggedItem] = useState<ScannedPage | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startScanning = async () => {
    try {
      const constraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(e => console.error('Error playing video:', e));
      }
      
      setIsScanning(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  };

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsScanning(false);
  };

  const captureImage = async () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0);
    
    canvas.toBlob((blob) => {
      if (!blob) return;
      
      const newPage: ScannedPage = {
        id: Date.now().toString(),
        imageUrl: URL.createObjectURL(blob),
        order: scannedPages.length
      };
      
      setScannedPages(prev => [...prev, newPage]);
      stopScanning();
    }, 'image/jpeg', 0.8);
  };

  const handleDragStart = (page: ScannedPage) => {
    setDraggedItem(page);
  };

  const handleDragOver = (e: React.DragEvent, targetPage: ScannedPage) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.id === targetPage.id) return;

    setScannedPages(prev => {
      const newPages = [...prev];
      const draggedIndex = newPages.findIndex(p => p.id === draggedItem.id);
      const targetIndex = newPages.findIndex(p => p.id === targetPage.id);
      
      newPages.splice(draggedIndex, 1);
      newPages.splice(targetIndex, 0, draggedItem);
      
      return newPages.map((page, index) => ({ ...page, order: index }));
    });
  };

  const handleDelete = (pageId: string) => {
    setScannedPages(prev => prev.filter(page => page.id !== pageId));
  };

  const handleComplete = async () => {
    const files = await Promise.all(
      scannedPages.map(async (page) => {
        const response = await fetch(page.imageUrl);
        const blob = await response.blob();
        return new File([blob], `scan-${page.order + 1}.jpg`, { type: 'image/jpeg' });
      })
    );
    onScanComplete(files);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {isScanning ? (
        <div className="relative w-full h-full">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-contain bg-black"
            onLoadedMetadata={(e) => {
              const video = e.currentTarget;
              video.play().catch(err => console.error('Error playing video:', err));
            }}
            style={{ 
              transform: 'scaleX(-1)',
              maxWidth: '100%',
              maxHeight: '100vh'
            }}
          />
          <div className="absolute bottom-0 left-0 right-0 p-4 flex justify-center gap-4 bg-gradient-to-t from-black to-transparent">
            <button
              onClick={stopScanning}
              className="p-3 rounded-full bg-red-500 text-white"
              aria-label="Anuluj"
            >
              <X />
            </button>
            <button
              onClick={captureImage}
              className="p-3 rounded-full bg-white"
              aria-label="Zrób zdjęcie"
            >
              <Camera className="text-black" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-gray-800 text-white"
            >
              <ArrowLeft size={20} />
            </button>
            <h2 className="text-white text-lg font-medium">
              Zeskanowane strony ({scannedPages.length})
            </h2>
            <div className="w-8" /> {/* Spacer */}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            {scannedPages.map((page) => (
              <div
                key={page.id}
                draggable
                onDragStart={() => handleDragStart(page)}
                onDragOver={(e) => handleDragOver(e, page)}
                className="relative aspect-[3/4] bg-gray-800 rounded-lg overflow-hidden"
              >
                <Image
                  src={page.imageUrl}
                  alt={`Strona ${page.order + 1}`}
                  fill
                  className="object-cover"
                />
                <button
                  onClick={() => handleDelete(page.id)}
                  className="absolute top-2 right-2 p-1 rounded-full bg-red-500 text-white"
                >
                  <X size={16} />
                </button>
                <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-black bg-opacity-50 text-white text-sm">
                  {page.order + 1}
                </div>
              </div>
            ))}
            <button
              onClick={startScanning}
              className="aspect-[3/4] border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:text-white hover:border-white transition-colors"
            >
              <Plus size={24} />
              <span className="mt-2 text-sm">Dodaj stronę</span>
            </button>
          </div>

          {scannedPages.length > 0 && (
            <button
              onClick={handleComplete}
              className="w-full py-3 bg-blue-500 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors"
            >
              <Send size={20} />
              Wyślij do analizy
            </button>
          )}
        </div>
      )}
    </div>
  );
} 
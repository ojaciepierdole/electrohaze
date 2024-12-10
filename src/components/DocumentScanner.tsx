'use client';

import * as React from 'react';
import { Camera, X, Send, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CircularProgress } from '@/components/ui/circular-progress';
import type { ModelDefinition } from '@/types/processing';

interface DocumentScannerProps {
  selectedModels: ModelDefinition[];
  onScanComplete: (files: File[]) => void;
  onClose: () => void;
}

export function DocumentScanner({ selectedModels, onScanComplete, onClose }: DocumentScannerProps) {
  const [isScanning, setIsScanning] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [scannedPages, setScannedPages] = React.useState<{ id: string; imageUrl: string }[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  // Inicjalizacja kamery
  React.useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      setError('Nie udało się uzyskać dostępu do kamery');
      console.error('Camera error:', err);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const captureImage = async () => {
    if (!videoRef.current || isProcessing) return;

    try {
      setIsProcessing(true);
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get canvas context');

      // Efekt flash
      const flashElement = document.createElement('div');
      flashElement.className = 'absolute inset-0 bg-white/75 z-50';
      video.parentElement?.appendChild(flashElement);
      
      // Zrób zdjęcie
      ctx.drawImage(video, 0, 0);
      
      // Usuń flash
      setTimeout(() => flashElement.remove(), 100);

      // Konwertuj na blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.95);
      });

      // Dodaj do listy zeskanowanych stron
      const pageId = Date.now().toString();
      const imageUrl = URL.createObjectURL(blob);
      setScannedPages(prev => [...prev, { id: pageId, imageUrl }]);

    } catch (err) {
      setError('Błąd podczas robienia zdjęcia');
      console.error('Capture error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleComplete = async () => {
    try {
      setIsProcessing(true);
      // Konwertuj zeskanowane strony na pliki
      const files = await Promise.all(
        scannedPages.map(async (page) => {
          const response = await fetch(page.imageUrl);
          const blob = await response.blob();
          return new File([blob], `scan_${page.id}.jpg`, { type: 'image/jpeg' });
        })
      );
      onScanComplete(files);
    } catch (err) {
      setError('Błąd podczas przetwarzania zeskanowanych stron');
      console.error('Processing error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50">
      <div className="relative h-full flex flex-col">
        {/* Header */}
        <div className="p-4 flex items-center justify-between bg-black/50">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div className="text-white font-medium">
            Skanowanie ({scannedPages.length})
          </div>
          <div className="w-10" /> {/* Spacer */}
        </div>

        {/* Camera Preview */}
        <div className="relative flex-1">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />
          
          {/* Scanning Frame */}
          <div className="absolute inset-4 border-2 border-white/50 rounded-lg">
            <div className="absolute -left-2 -top-2 w-4 h-4 border-t-2 border-l-2 border-white" />
            <div className="absolute -right-2 -top-2 w-4 h-4 border-t-2 border-r-2 border-white" />
            <div className="absolute -left-2 -bottom-2 w-4 h-4 border-b-2 border-l-2 border-white" />
            <div className="absolute -right-2 -bottom-2 w-4 h-4 border-b-2 border-r-2 border-white" />
          </div>
        </div>

        {/* Controls */}
        <div className="p-4 bg-black/50">
          <div className="flex justify-between items-center">
            <div className="text-white text-sm">
              {selectedModels.map(model => model.name).join(', ')}
            </div>
            {scannedPages.length > 0 && (
              <Button
                onClick={handleComplete}
                disabled={isProcessing}
                className="gap-2"
              >
                <Send className="w-4 h-4" />
                Zakończ
              </Button>
            )}
          </div>
          
          <div className="mt-4 flex justify-center">
            <Button
              size="lg"
              variant="outline"
              className="rounded-full w-16 h-16 p-0 border-4"
              onClick={captureImage}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <CircularProgress value={100} size={24} />
              ) : (
                <Camera className="w-8 h-8" />
              )}
            </Button>
          </div>
        </div>

        {/* Thumbnails */}
        {scannedPages.length > 0 && (
          <div className="absolute bottom-32 left-0 right-0 p-4 overflow-x-auto">
            <div className="flex gap-2">
              {scannedPages.map((page) => (
                <div
                  key={page.id}
                  className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 border-white"
                >
                  <Image
                    src={page.imageUrl}
                    alt={`Strona ${page.id}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-red-500 text-white rounded">
            {error}
          </div>
        )}
      </div>
    </div>
  );
} 
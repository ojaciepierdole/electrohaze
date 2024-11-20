import { useState, useRef, useEffect } from 'react';
import { Camera, X, Plus, Send, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { PDFDocument } from 'pdf-lib';

interface ScannedPage {
  id: string;
  imageUrl: string;
  order: number;
}

interface DocumentScannerProps {
  onScanComplete: (images: File[]) => void;
  onClose: () => void;
}

// Dodajemy zmienną globalną dla śledzenia stanu ładowania OpenCV
declare global {
  interface Window {
    cv: any;
    cvLoading?: Promise<void>;
  }
}

// Funkcja do ładowania OpenCV (poza komponentem)
const loadOpenCV = async () => {
  if (window.cv) return Promise.resolve();
  if (window.cvLoading) return window.cvLoading;

  window.cvLoading = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://docs.opencv.org/4.5.4/opencv.js';
    script.async = true;
    script.onload = () => {
      if (window.cv) {
        window.cv.onRuntimeInitialized = () => {
          resolve();
        };
      } else {
        reject(new Error('OpenCV load failed'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load OpenCV script'));
    document.body.appendChild(script);
  });

  return window.cvLoading;
};

const performDeskew = async (imageBlob: Blob): Promise<Blob> => {
  const cv = window.cv;
  if (!cv) throw new Error('OpenCV not loaded');

  // Konwertuj blob na canvas
  const imageUrl = URL.createObjectURL(imageBlob);
  const img = document.createElement('img');
  
  await new Promise((resolve) => {
    img.onload = resolve;
    img.src = imageUrl;
  });

  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');
  
  ctx.drawImage(img, 0, 0);
  URL.revokeObjectURL(imageUrl);

  // Konwertuj do formatu OpenCV
  const src = cv.imread(canvas);
  const dst = new cv.Mat();
  
  // Konwertuj do skali szarości
  cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY);
  
  // Wykryj krawędzie
  cv.Canny(dst, dst, 50, 150, 3);
  
  // Znajdź linie używając transformacji Hougha
  const lines = new cv.Mat();
  cv.HoughLines(dst, lines, 1, Math.PI / 180, 150);
  
  // Oblicz dominujący kąt
  let angle = 0;
  let count = 0;
  
  for (let i = 0; i < lines.rows; i++) {
    const rho = lines.data32F[i * 2];
    const theta = lines.data32F[i * 2 + 1];
    const degrees = theta * 180 / Math.PI - 90;
    
    // Bierzemy pod uwagę tylko kąty w zakresie ±45 stopni
    if (Math.abs(degrees) < 45) {
      angle += degrees;
      count++;
    }
  }
  
  // Oblicz średni kąt
  if (count > 0) {
    angle /= count;
  }

  // Obróć obraz
  const center = new cv.Point(src.cols / 2, src.rows / 2);
  const rotationMatrix = cv.getRotationMatrix2D(center, -angle, 1.0);
  cv.warpAffine(src, src, rotationMatrix, new cv.Size(src.cols, src.rows));

  // Konwertuj z powrotem na canvas
  const outputCanvas = document.createElement('canvas');
  cv.imshow(outputCanvas, src);

  // Zwolnij pamięć
  src.delete();
  dst.delete();
  lines.delete();
  rotationMatrix.delete();

  // Konwertuj canvas na blob
  return new Promise((resolve) => {
    outputCanvas.toBlob((blob) => {
      resolve(blob!);
    }, 'image/jpeg', 0.8);
  });
};

export function DocumentScanner({ onScanComplete, onClose }: DocumentScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedPages, setScannedPages] = useState<ScannedPage[]>([]);
  const [draggedItem, setDraggedItem] = useState<ScannedPage | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showCaptureFlash, setShowCaptureFlash] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [isDocumentDetected, setIsDocumentDetected] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const processingRef = useRef(false);
  const [isOpenCVReady, setIsOpenCVReady] = useState(false);
  const [initProgress, setInitProgress] = useState(0);

  // Automatycznie uruchamiamy skaner po załadowaniu
  useEffect(() => {
    let mounted = true;

    const initScanner = async () => {
      try {
        setInitProgress(10);
        await loadOpenCV();
        if (!mounted) return;
        setInitProgress(50);
        
        await startScanning();
        if (!mounted) return;
        setInitProgress(80);
        
        setIsOpenCVReady(true);
        setInitProgress(100);
      } catch (error) {
        console.error('Failed to initialize scanner:', error);
        if (mounted) {
          setError('Nie udało się zainicjalizować skanera');
        }
      }
    };

    initScanner();

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (isScanning && videoRef.current && isOpenCVReady) {
      const processFrame = () => {
        if (videoRef.current && !processingRef.current) {
          detectDocument(videoRef.current);
        }
        if (isScanning) {
          requestAnimationFrame(processFrame);
        }
      };

      requestAnimationFrame(processFrame);
    }
  }, [isScanning, isOpenCVReady]);

  const startScanning = async () => {
    try {
      setError(null);
      setIsScanning(true);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (e) {
          console.error('Error playing video:', e);
          setError('Nie udało się uruchomić kamery');
          setIsScanning(false);
        }
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setError('Brak dostępu do kamery');
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  const captureImage = async () => {
    if (!videoRef.current) return;

    setIsCapturing(true);
    setShowCaptureFlash(true);

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (video.style.transform.includes('scaleX(-1)')) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }

      ctx.drawImage(video, 0, 0);
      
      // Najpierw konwertuj canvas na blob
      const initialBlob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.8);
      });

      // Wykonaj deskew
      setProcessingStatus('Prostowanie dokumentu...');
      const processedBlob = await performDeskew(initialBlob);

      const newPage: ScannedPage = {
        id: Date.now().toString(),
        imageUrl: URL.createObjectURL(processedBlob),
        order: scannedPages.length
      };
      
      setScannedPages(prev => [...prev, newPage]);
      showToast(`Zrobiono zdjęcie (${scannedPages.length + 1})`);
    } catch (error) {
      console.error('Error capturing image:', error);
      showToast('Błąd podczas przetwarzania zdjęcia');
    } finally {
      setTimeout(() => {
        setShowCaptureFlash(false);
        setIsCapturing(false);
        setProcessingStatus('');
      }, 200);
    }
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

  const createPDFFromImages = async (pages: ScannedPage[]): Promise<File> => {
    setProcessingStatus('Tworzenie dokumentu PDF...');
    const pdfDoc = await PDFDocument.create();
    
    for (const page of pages) {
      setProcessingStatus(`Dodawanie strony ${page.order + 1}...`);
      const response = await fetch(page.imageUrl);
      const imageBytes = await response.arrayBuffer();
      const image = await pdfDoc.embedJpg(imageBytes);
      
      const pageWidth = image.width;
      const pageHeight = image.height;
      const pdfPage = pdfDoc.addPage([pageWidth, pageHeight]);
      
      pdfPage.drawImage(image, {
        x: 0,
        y: 0,
        width: pageWidth,
        height: pageHeight,
      });
    }

    setProcessingStatus('Finalizowanie dokumentu...');
    const pdfBytes = await pdfDoc.save();
    return new File([pdfBytes], 'scanned_document.pdf', { type: 'application/pdf' });
  };

  const handleComplete = async () => {
    try {
      setIsProcessing(true);
      const pdfFile = await createPDFFromImages(scannedPages);
      onScanComplete([pdfFile]);
    } catch (error) {
      console.error('Error creating PDF:', error);
      setError('Nie udało się utworzyć dokumentu PDF');
    } finally {
      setIsProcessing(false);
    }
  };

  const [toast, setToast] = useState<string | null>(null);
  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  };

  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(scannedPages);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Aktualizuj numerację
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index + 1
    }));

    setScannedPages(updatedItems);
  };

  const detectDocument = (video: HTMLVideoElement) => {
    if (!canvasRef.current || processingRef.current || !isOpenCVReady || !window.cv) return;
    processingRef.current = true;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    try {
      // @ts-ignore
      const cv = window.cv;
      // Konwertujemy obraz do formatu OpenCV
      const src = cv.imread(canvas);
      const dst = new cv.Mat();
      
      // Konwertujemy do skali szarości
      cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY);
      
      // Stosujemy rozmycie Gaussa
      cv.GaussianBlur(dst, dst, new cv.Size(5, 5), 0);
      
      // Wykrywamy krawędzie
      cv.Canny(dst, dst, 75, 200);
      
      // Znajdujemy kontury
      const contours = new cv.MatVector();
      const hierarchy = new cv.Mat();
      cv.findContours(dst, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

      let maxArea = 0;
      let maxContourIndex = -1;

      // Szukamy największego konturu (prawdopodobnie dokument)
      for (let i = 0; i < contours.size(); i++) {
        const contour = contours.get(i);
        const area = cv.contourArea(contour);
        if (area > maxArea) {
          maxArea = area;
          maxContourIndex = i;
        }
      }

      if (maxContourIndex !== -1) {
        const contour = contours.get(maxContourIndex);
        const perimeter = cv.arcLength(contour, true);
        const approx = new cv.Mat();
        cv.approxPolyDP(contour, approx, 0.02 * perimeter, true);

        // Jeśli mamy czworokąt, prawdopodobnie znaleźliśmy dokument
        if (approx.rows === 4) {
          // Aktualizujemy ramkę pomocniczą
          if (frameRef.current) {
            const points = [];
            for (let i = 0; i < 4; i++) {
              points.push({
                x: approx.data32S[i * 2] / canvas.width * 100,
                y: approx.data32S[i * 2 + 1] / canvas.height * 100
              });
            }
            updateFrame(points);
            setIsDocumentDetected(true);
          }
        } else {
          setIsDocumentDetected(false);
        }

        approx.delete();
      }

      // Zwalniamy pamięć
      src.delete();
      dst.delete();
      contours.delete();
      hierarchy.delete();
    } catch (error) {
      console.error('Error detecting document:', error);
    }

    processingRef.current = false;
  };

  const updateFrame = (points: Array<{ x: number, y: number }>) => {
    if (!frameRef.current) return;

    // Tworzymy ścieżkę SVG z punktów
    const path = `M ${points[0].x},${points[0].y} 
                  L ${points[1].x},${points[1].y} 
                  L ${points[2].x},${points[2].y} 
                  L ${points[3].x},${points[3].y} Z`;

    frameRef.current.style.clipPath = `path('${path}')`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {error ? (
        <div className="flex-1 flex items-center justify-center flex-col gap-4 p-4">
          <p className="text-white text-lg">{error}</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white rounded text-black"
          >
            Zamknij
          </button>
        </div>
      ) : isScanning ? (
        <div className="relative w-full h-full bg-black">
          <button
            onClick={() => {
              stopScanning();
              setIsScanning(false);
            }}
            className="absolute top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-red-500 text-white rounded-full z-10 flex items-center gap-2 hover:bg-red-600 transition-colors"
          >
            <X size={16} />
            Zakończ
          </button>

          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />
          
          {showCaptureFlash && (
            <div className="absolute inset-0 bg-white animate-flash" />
          )}

          <canvas ref={canvasRef} className="hidden" />

          <div
            ref={frameRef}
            className={`absolute inset-0 border-2 transition-colors duration-200 ${
              isDocumentDetected ? 'border-green-500' : 'border-white'
            }`}
          />

          <AnimatePresence>
            {isDocumentDetected && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              >
                <div className="bg-green-500/50 text-white px-4 py-2 rounded-full">
                  Dokument wykryty
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {scannedPages.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-28 inset-x-0 flex justify-center"
              >
                <div className="bg-black/75 text-white px-4 py-2 rounded-full">
                  {scannedPages.length} {scannedPages.length === 1 ? 'zdjęcie' : 'zdjęcia'}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="absolute bottom-0 left-0 right-0 p-4 flex justify-center">
            <motion.button
              onClick={captureImage}
              disabled={isCapturing}
              whileTap={{ scale: 0.9 }}
              className={`p-4 rounded-full transition-all ${
                isCapturing 
                  ? 'bg-gray-300' 
                  : 'bg-white hover:bg-gray-100'
              }`}
              aria-label="Zrób zdjęcie"
            >
              <Camera 
                className={`text-black transition-colors ${
                  isCapturing ? 'opacity-50' : ''
                }`} 
                size={24} 
              />
            </motion.button>
          </div>

          {/* Ramka dokumentu */}
          <div className="absolute inset-4 border-2 border-white/50 rounded-lg pointer-events-none">
            <div className="absolute -left-2 -top-2 w-4 h-4 border-t-2 border-l-2 border-white" />
            <div className="absolute -right-2 -top-2 w-4 h-4 border-t-2 border-r-2 border-white" />
            <div className="absolute -left-2 -bottom-2 w-4 h-4 border-b-2 border-l-2 border-white" />
            <div className="absolute -right-2 -bottom-2 w-4 h-4 border-b-2 border-r-2 border-white" />
          </div>

          {/* Wskaźnik wykrycia dokumentu */}
          <AnimatePresence>
            {isDocumentDetected && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-32 inset-x-0 flex justify-center"
              >
                <div className="bg-green-500/80 text-white px-4 py-2 rounded-full flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  Dokument gotowy do zeskanowania
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <div className="flex-1 p-4 overflow-y-auto bg-gray-900">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-gray-800 text-white hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <h2 className="text-white text-lg font-medium">
              Zeskanowane strony ({scannedPages.length})
            </h2>
            <div className="w-8" />
          </div>

          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="scanned-pages">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="grid grid-cols-2 gap-4 mb-4"
                >
                  {scannedPages.map((page, index) => (
                    <Draggable
                      key={page.id}
                      draggableId={page.id}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`relative aspect-[3/4] bg-gray-800 rounded-lg overflow-hidden ${
                            snapshot.isDragging ? 'ring-2 ring-blue-500 shadow-lg' : ''
                          }`}
                        >
                          <Image
                            src={page.imageUrl}
                            alt={`Strona ${page.order + 1}`}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/50 opacity-0 hover:opacity-100 transition-opacity">
                            <div className="absolute top-2 right-2 flex gap-2">
                              <button
                                onClick={() => handleDelete(page.id)}
                                className="p-1.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                              >
                                <X size={16} />
                              </button>
                            </div>
                            <div className="absolute bottom-2 left-2 flex items-center gap-2">
                              <span className="px-2 py-1 rounded bg-black/75 text-white text-sm font-medium">
                                Strona {index + 1}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  <button
                    onClick={startScanning}
                    className="aspect-[3/4] border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:text-white hover:border-white transition-colors group"
                  >
                    <Plus size={24} className="group-hover:scale-110 transition-transform" />
                    <span className="mt-2 text-sm">Dodaj stronę</span>
                  </button>
                </div>
              )}
            </Droppable>
          </DragDropContext>

          {scannedPages.length > 0 && (
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-900">
              <AnimatePresence>
                {isProcessing && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="mb-4 text-center text-white text-sm"
                  >
                    {processingStatus}
                  </motion.div>
                )}
              </AnimatePresence>
              <button
                onClick={handleComplete}
                disabled={isProcessing}
                className={`w-full py-3 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                  isProcessing
                    ? 'bg-blue-400 text-white/80'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                <Send size={20} />
                {isProcessing ? 'Przygotowywanie dokumentu...' : 'Wyślij do analizy'}
              </button>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes flash {
          0% { opacity: 0; }
          50% { opacity: 1; }
          100% { opacity: 0; }
        }
        .animate-flash {
          animation: flash 200ms ease-out;
        }
      `}</style>
      {!isOpenCVReady && !error && (
        <div className="absolute inset-0 bg-black flex items-center justify-center">
          <div className="w-64 space-y-4">
            <div className="text-white text-center mb-6">
              <p className="text-lg font-medium mb-2">Inicjalizacja skanera</p>
              <p className="text-sm text-gray-400">Przygotowywanie modułów...</p>
            </div>
            
            <div className="relative h-2 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 bg-white rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: `${initProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            
            <p className="text-center text-white/60 text-sm">
              {initProgress}%
            </p>
          </div>
        </div>
      )}
    </div>
  );
} 
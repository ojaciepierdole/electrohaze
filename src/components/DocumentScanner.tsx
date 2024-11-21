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
  return new Promise(async (resolve, reject) => {
    try {
      const cv = window.cv;
      if (!cv) throw new Error('OpenCV not loaded');

      // Konwertuj blob na canvas
      const imageUrl = URL.createObjectURL(imageBlob);
      const img = document.createElement('img');
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
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
      
      // Znajdź kontury
      const contours = new cv.MatVector();
      const hierarchy = new cv.Mat();
      cv.findContours(dst, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

      let maxArea = 0;
      let maxContourIndex = -1;

      // Znajdź największy kontur
      for (let i = 0; i < contours.size(); i++) {
        const contour = contours.get(i);
        const area = cv.contourArea(contour);
        if (area > maxArea) {
          maxArea = area;
          maxContourIndex = i;
        }
      }

      if (maxContourIndex === -1) {
        throw new Error('No document contour found');
      }

      // Znajdź punkty narożne dokumentu
      const contour = contours.get(maxContourIndex);
      const perimeter = cv.arcLength(contour, true);
      const approx = new cv.Mat();
      cv.approxPolyDP(contour, approx, 0.02 * perimeter, true);

      // Prostowanie dokumentu
      if (approx.rows === 4) {
        // Sortuj punkty
        const points = [];
        for (let i = 0; i < 4; i++) {
          points.push({
            x: approx.data32S[i * 2],
            y: approx.data32S[i * 2 + 1]
          });
        }

        // Transformacja perspektywy
        const dstPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
          0, 0,
          src.cols, 0,
          src.cols, src.rows,
          0, src.rows
        ]);
        const srcPoints = cv.matFromArray(4, 1, cv.CV_32FC2, points.flatMap(p => [p.x, p.y]));
        const matrix = cv.getPerspectiveTransform(srcPoints, dstPoints);
        cv.warpPerspective(src, src, matrix, new cv.Size(src.cols, src.rows));

        // Zwolnij pamięć
        dstPoints.delete();
        srcPoints.delete();
        matrix.delete();
      }

      // Konwertuj wynik na canvas
      const outputCanvas = document.createElement('canvas');
      cv.imshow(outputCanvas, src);

      // Zwolnij pamięć
      src.delete();
      dst.delete();
      contours.delete();
      hierarchy.delete();
      approx.delete();

      // Konwertuj canvas na blob
      outputCanvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to create blob'));
      }, 'image/jpeg', 0.95);

    } catch (error) {
      reject(error);
    }
  });
};

interface DetectedDocument {
  corners: { x: number; y: number }[];
  isGoodPerspective: boolean;
}

interface Point {
  x: number;
  y: number;
}

interface DeskewProps {
  image: string;
  onConfirm: (transformedImage: File) => void;
  onCancel: () => void;
}

const DeskewView = ({ image, onConfirm, onCancel }: DeskewProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [corners, setCorners] = useState<Point[]>([
    { x: 0, y: 0 },     // top-left
    { x: 100, y: 0 },   // top-right
    { x: 100, y: 100 }, // bottom-right
    { x: 0, y: 100 }    // bottom-left
  ]);
  const [activeCorner, setActiveCorner] = useState<number | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const img = document.createElement('img');
    img.src = image;
    img.onload = async () => {
      if (!canvasRef.current) return;
      
      const canvas = canvasRef.current;
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Automatyczne wykrycie dokumentu
      const detectedCorners = await detectDocumentCorners(img);
      if (detectedCorners) {
        setCorners(detectedCorners);
      }
      
      drawImage();
      setImageLoaded(true);
    };
  }, [image]);

  const drawImage = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const img = document.createElement('img');
    img.src = image;
    
    // Dodajemy obsługę onload przed rysowaniem
    img.onload = () => {
      // Rysuj obraz
      ctx.drawImage(img, 0, 0);
      
      // Rysuj półprzezroczystą nakładkę
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      
      // Rysuj obszar dokumentu
      ctx.beginPath();
      ctx.moveTo(corners[0].x, corners[0].y);
      corners.forEach((corner, i) => {
        const nextCorner = corners[(i + 1) % corners.length];
        ctx.lineTo(nextCorner.x, nextCorner.y);
      });
      ctx.closePath();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.fill();
      
      // Rysuj punkty kontrolne
      corners.forEach((corner, i) => {
        ctx.beginPath();
        ctx.arc(corner.x, corner.y, 10, 0, Math.PI * 2);
        ctx.fillStyle = i === activeCorner ? '#4ade80' : '#3b82f6';
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Sprawdź, czy kliknięto w punkt kontrolny
    const clickedCorner = corners.findIndex(corner => 
      Math.hypot(corner.x - x, corner.y - y) < 20
    );

    if (clickedCorner !== -1) {
      setActiveCorner(clickedCorner);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (activeCorner === null) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCorners(prev => prev.map((corner, i) => 
      i === activeCorner ? { x, y } : corner
    ));

    drawImage();
  };

  const handleMouseUp = () => {
    setActiveCorner(null);
  };

  const handleConfirm = async () => {
    if (!canvasRef.current) return;
    
    // Wykonaj transformację perspektywy
    const transformedImage = await transformPerspective(
      canvasRef.current,
      corners
    );
    
    onConfirm(transformedImage);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded-lg max-w-[90vw] max-h-[90vh]">
        <div className="relative">
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="max-w-full max-h-[70vh] object-contain"
          />
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
            </div>
          )}
        </div>
        <div className="flex justify-end gap-4 mt-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
          >
            Anuluj
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Zatwierdź
          </button>
        </div>
      </div>
    </div>
  );
};

// Funkcja do wykrywania rogów dokumentu
async function detectDocumentCorners(image: HTMLImageElement): Promise<Point[]> {
  try {
    const cv = window.cv;
    if (!cv) throw new Error('OpenCV not loaded');

    // Tworzymy canvas do przetwarzania
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');
    ctx.drawImage(image, 0, 0);

    // Konwertuj do formatu OpenCV
    const src = cv.imread(canvas);
    const dst = new cv.Mat();
    
    // Konwertuj do skali szarości
    cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY);
    
    // Rozmycie Gaussa dla redukcji szumu
    cv.GaussianBlur(dst, dst, new cv.Size(5, 5), 0);
    
    // Detekcja krawędzi Canny
    cv.Canny(dst, dst, 75, 200);
    
    // Dylatacja dla wzmocnienia krawędzi
    const kernel = cv.Mat.ones(5, 5, cv.CV_8U);
    cv.dilate(dst, dst, kernel, new cv.Point(-1, -1), 1);

    // Znajdź kontury
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    cv.findContours(dst, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    let maxArea = 0;
    let maxContourIndex = -1;
    const totalArea = src.rows * src.cols;

    // Znajdź największy kontur
    for (let i = 0; i < contours.size(); i++) {
      const contour = contours.get(i);
      const area = cv.contourArea(contour);
      if (area > maxArea && area < totalArea * 0.95) { // Ignoruj zbyt duże kontury
        maxArea = area;
        maxContourIndex = i;
      }
    }

    if (maxContourIndex === -1) {
      // Jeśli nie znaleziono konturów, zwróć domyślne narożniki
      return [
        { x: image.width * 0.1, y: image.height * 0.1 },
        { x: image.width * 0.9, y: image.height * 0.1 },
        { x: image.width * 0.9, y: image.height * 0.9 },
        { x: image.width * 0.1, y: image.height * 0.9 }
      ];
    }

    // Znajdź punkty narożne dokumentu
    const contour = contours.get(maxContourIndex);
    const perimeter = cv.arcLength(contour, true);
    const approx = new cv.Mat();
    cv.approxPolyDP(contour, approx, 0.02 * perimeter, true);

    // Konwertuj punkty na format Point[]
    const points: Point[] = [];
    if (approx.rows === 4) {
      // Mamy dokładnie 4 punkty - idealna sytuacja
      for (let i = 0; i < 4; i++) {
        points.push({
          x: approx.data32S[i * 2],
          y: approx.data32S[i * 2 + 1]
        });
      }
    } else {
      // Jeśli nie mamy dokładnie 4 punktów, użyj prostokąta otaczającego
      const rect = cv.boundingRect(contour);
      points.push({ x: rect.x, y: rect.y });
      points.push({ x: rect.x + rect.width, y: rect.y });
      points.push({ x: rect.x + rect.width, y: rect.y + rect.height });
      points.push({ x: rect.x, y: rect.y + rect.height });
    }

    // Sortuj punkty zgodnie z ruchem wskazówek zegara
    const center = points.reduce(
      (acc, point) => ({ x: acc.x + point.x / 4, y: acc.y + point.y / 4 }),
      { x: 0, y: 0 }
    );

    points.sort((a, b) => {
      const angleA = Math.atan2(a.y - center.y, a.x - center.x);
      const angleB = Math.atan2(b.y - center.y, b.x - center.x);
      return angleA - angleB;
    });

    // Zwolnij pamięć
    src.delete();
    dst.delete();
    contours.delete();
    hierarchy.delete();
    approx.delete();
    kernel.delete();

    return points;

  } catch (error) {
    console.error('Error detecting document corners:', error);
    // Zwróć domyślne narożniki w przypadku błędu
    return [
      { x: image.width * 0.1, y: image.height * 0.1 },
      { x: image.width * 0.9, y: image.height * 0.1 },
      { x: image.width * 0.9, y: image.height * 0.9 },
      { x: image.width * 0.1, y: image.height * 0.9 }
    ];
  }
}

// Funkcja do transformacji perspektywy
async function transformPerspective(
  canvas: HTMLCanvasElement,
  corners: Point[]
): Promise<File> {
  // Tu należy zaimplementować transformację perspektywy
  // Można użyć OpenCV.js lub innej biblioteki
  
  // Tymczasowo zwracamy oryginalny obraz
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(new File([blob], 'transformed.jpg', { type: 'image/jpeg' }));
      }
    }, 'image/jpeg');
  });
}

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
  const [detectedDocument, setDetectedDocument] = useState<DetectedDocument | null>(null);
  const lastGoodDetection = useRef<DetectedDocument | null>(null);
  const [processingPages, setProcessingPages] = useState<Set<string>>(new Set());
<<<<<<< HEAD
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [scannedFiles, setScannedFiles] = useState<File[]>([]);
=======
  const [processedImages, setProcessedImages] = useState<Map<string, Blob>>(new Map());
>>>>>>> 730988d0574076b58a0e6453aae5c53981a2209e

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
    if (!videoRef.current || isCapturing) return;

    try {
      setIsCapturing(true);
      
      // Sprawdzamy czy OpenCV jest dostępne
      if (!window.cv) {
        console.error('OpenCV is not available');
        showToast('Błąd inicjalizacji skanera');
        return;
      }

      // Tworzymy kopię obrazu z kamery
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

      // Robimy zdjęcie
      ctx.drawImage(video, 0, 0);
      
      // Usuwamy flash
      setTimeout(() => flashElement.remove(), 100);

      // Konwertujemy na blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.95);
      });

      // Dodajemy surowe zdjęcie do galerii
      const pageId = Date.now().toString();
      const newPage: ScannedPage = {
        id: pageId,
        imageUrl: URL.createObjectURL(blob),
        order: scannedPages.length
      };
      
      setScannedPages(prev => [...prev, newPage]);
      showToast('Przetwarzanie dokumentu...');
      setProcessingPages(prev => new Set(prev).add(pageId));

      try {
        // Przetwarzamy zdjęcie
        const processedBlob = await performDeskew(blob);
        
        // Zapisujemy przetworzone zdjęcie
        processedImages.set(pageId, processedBlob);
        
        // Aktualizujemy podgląd w galerii
        const newUrl = URL.createObjectURL(processedBlob);
        setScannedPages(prev => prev.map(page => 
          page.id === pageId ? { ...page, imageUrl: newUrl } : page
        ));
        
        showToast('Dokument przetworzony');
      } catch (error) {
        console.error('Błąd podczas przetwarzania:', error);
        showToast('Błąd przetwarzania dokumentu');
      } finally {
        setProcessingPages(prev => {
          const next = new Set(prev);
          next.delete(pageId);
          return next;
        });
      }

    } catch (error) {
      console.error('Error capturing image:', error);
      showToast('Błąd podczas robienia zdjęcia');
    } finally {
      setIsCapturing(false);
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
      setProcessingStatus('Przygotowywanie dokumentu...');

      // Czekamy na zakończenie przetwarzania wszystkich zdjęć
      const unprocessedPages = scannedPages.filter(page => !processedImages.has(page.id));
      
      if (unprocessedPages.length > 0) {
        setProcessingStatus('Przetwarzanie pozostałych stron...');
        
        for (const page of unprocessedPages) {
          try {
            setProcessingStatus(`Przetwarzanie strony ${page.order + 1}...`);
            const response = await fetch(page.imageUrl);
            const blob = await response.blob();
            const processedBlob = await performDeskew(blob);
            
            // Zapisujemy przetworzone zdjęcie
            processedImages.set(page.id, processedBlob);
            
            // Aktualizujemy podgląd w galerii
            const newUrl = URL.createObjectURL(processedBlob);
            setScannedPages(prev => prev.map(p => 
              p.id === page.id ? { ...p, imageUrl: newUrl } : p
            ));
          } catch (error) {
            console.error(`Error processing page ${page.order + 1}:`, error);
          }
        }
      }

      // Tworzymy PDF z przetworzonych zdjęć
      setProcessingStatus('Tworzenie dokumentu PDF...');
      const pdfDoc = await PDFDocument.create();
      
      for (const page of scannedPages) {
        setProcessingStatus(`Dodawanie strony ${page.order + 1} do PDF...`);
        
        // Używamy przetworzonego zdjęcia jeśli jest dostępne
        const imageBlob = processedImages.get(page.id);
        if (!imageBlob) {
          console.error(`No processed image found for page ${page.id}`);
          continue;
        }

        const imageArrayBuffer = await imageBlob.arrayBuffer();
        const image = await pdfDoc.embedJpg(imageArrayBuffer);
        
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
      const pdfFile = new File([pdfBytes], 'scanned_document.pdf', { type: 'application/pdf' });
      
      onScanComplete([pdfFile]);
    } catch (error) {
      console.error('Error creating PDF:', error);
      setError('Nie udało się utworzyć dokumentu PDF');
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
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
    if (!canvasRef.current || processingRef.current || !window.cv) return;
    processingRef.current = true;

    const cv = window.cv;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    try {
      const src = cv.imread(canvas);
      const dst = new cv.Mat();
      
      // Konwertuj do skali szarości
      cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY);
      cv.GaussianBlur(dst, dst, new cv.Size(5, 5), 0);
      cv.Canny(dst, dst, 75, 200);
      
      // Znajdź kontury
      const contours = new cv.MatVector();
      const hierarchy = new cv.Mat();
      cv.findContours(dst, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

      let maxArea = 0;
      let maxContourIndex = -1;
      const totalArea = canvas.width * canvas.height;

      // Znajdź największy kontur
      for (let i = 0; i < contours.size(); i++) {
        const contour = contours.get(i);
        const area = cv.contourArea(contour);
        if (area > maxArea && area < totalArea * 0.95) { // Ignoruj zbyt duże kontury
          maxArea = area;
          maxContourIndex = i;
        }
      }

      if (maxContourIndex !== -1) {
        const contour = contours.get(maxContourIndex);
        const perimeter = cv.arcLength(contour, true);
        const approx = new cv.Mat();
        cv.approxPolyDP(contour, approx, 0.02 * perimeter, true);

        if (approx.rows === 4) {
          setIsDocumentDetected(true);
        } else {
          setIsDocumentDetected(false);
        }

        approx.delete();
      }

      // Zwolnij pamięć
      src.delete();
      dst.delete();
      contours.delete();
      hierarchy.delete();
    } catch (error) {
      console.error('Error detecting document:', error);
    }

    processingRef.current = false;
  };

  const checkPerspective = (
    corners: { x: number; y: number }[],
    width: number,
    height: number
  ): boolean => {
    // Sortuj narożniki według pozycji
    const sortedCorners = [...corners].sort((a, b) => {
      if (Math.abs(a.y - b.y) < 10) return a.x - b.x;
      return a.y - b.y;
    });

    // Sprawdź czy dokument jest wystarczająco duży
    const minArea = width * height * 0.2; // Minimum 20% ekranu
    const documentArea = calculateQuadArea(sortedCorners);
    if (documentArea < minArea) return false;

    // Sprawdź czy kąty są zbliżone do 90 stopni
    const angles = calculateQuadAngles(sortedCorners);
    return angles.every(angle => Math.abs(angle - 90) < 20);
  };

  const calculateQuadArea = (corners: { x: number; y: number }[]): number => {
    // Implementacja obliczania pola czworokąta
    return Math.abs(
      (corners[0].x * corners[1].y + corners[1].x * corners[2].y +
       corners[2].x * corners[3].y + corners[3].x * corners[0].y) -
      (corners[1].x * corners[0].y + corners[2].x * corners[1].y +
       corners[3].x * corners[2].y + corners[0].x * corners[3].y)
    ) / 2;
  };

  const calculateQuadAngles = (corners: { x: number; y: number }[]): number[] => {
    // Implementacja obliczania kątów czworokąta
    return corners.map((corner, i) => {
      const prev = corners[(i + 3) % 4];
      const next = corners[(i + 1) % 4];
      
      const angle = Math.atan2(next.y - corner.y, next.x - corner.x) -
                   Math.atan2(prev.y - corner.y, prev.x - corner.x);
      
      return Math.abs(angle * 180 / Math.PI);
    });
  };

  const handleCapture = (imageSrc: string) => {
    setCapturedImage(imageSrc);
  };

  const handleDeskewConfirm = (transformedImage: File) => {
    setScannedFiles(prev => [...prev, transformedImage]);
    setCapturedImage(null);
  };

  const handleDeskewCancel = () => {
    setCapturedImage(null);
  };

  // Dodajemy nowy useEffect do reinicjalizacji kamery
  useEffect(() => {
    if (!capturedImage && isOpenCVReady) {
      // Reinicjalizacja kamery po powrocie z DeskewView
      startScanning();
    }
    return () => {
      // Zatrzymanie kamery przy przejściu do DeskewView
      if (capturedImage) {
        stopScanning();
      }
    };
  }, [capturedImage, isOpenCVReady]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50">
      {capturedImage ? (
        <DeskewView
          image={capturedImage}
          onConfirm={handleDeskewConfirm}
          onCancel={handleDeskewCancel}
        />
      ) : (
        <div className="h-full flex flex-col">
          {/* Komponent kamery */}
          <div className="flex-1 relative bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            
            {/* Nakładka z ramką */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="relative w-full h-full">
                <div className="absolute inset-[10%] border-2 border-white/50 rounded-lg" />
                {isDocumentDetected && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-full text-sm">
                    Wykryto dokument
                  </div>
                )}
              </div>
            </div>

            {/* Canvas do przetwarzania obrazu (ukryty) */}
            <canvas
              ref={canvasRef}
              className="hidden"
            />

            {/* Przycisk do robienia zdjęcia */}
            <button
              onClick={() => {
                if (videoRef.current) {
                  const canvas = document.createElement('canvas');
                  canvas.width = videoRef.current.videoWidth;
                  canvas.height = videoRef.current.videoHeight;
                  const ctx = canvas.getContext('2d');
                  if (ctx) {
                    ctx.drawImage(videoRef.current, 0, 0);
                    handleCapture(canvas.toDataURL('image/jpeg'));
                  }
                }
              }}
              disabled={isCapturing || !isOpenCVReady}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center"
            >
              <div className="w-12 h-12 rounded-full border-4 border-blue-500" />
            </button>

            {/* Przycisk powrotu */}
            <button
              onClick={onClose}
              className="absolute top-4 left-4 p-2 rounded-full bg-black/50 text-white"
            >
              <ArrowLeft size={24} />
            </button>
          </div>
          
          {/* Miniaturki zeskanowanych dokumentów */}
          {scannedFiles.length > 0 && (
            <div className="bg-white p-4">
              <div className="flex gap-4 overflow-x-auto">
                {scannedFiles.map((file, index) => (
                  <div key={index} className="relative w-24 h-32">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Scan ${index + 1}`}
                      className="w-full h-full object-cover rounded"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Przyciski kontrolne */}
          <div className="bg-white p-4 flex justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
            >
              Anuluj
            </button>
            <button
              onClick={handleComplete}
              disabled={scannedFiles.length === 0}
              className={`
                px-4 py-2 rounded
                ${scannedFiles.length === 0
                  ? 'bg-gray-300 text-gray-500'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
                }
              `}
            >
              Zakończ ({scannedFiles.length})
            </button>
          </div>

          {/* Toast */}
          {toast && (
            <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-black/75 text-white px-4 py-2 rounded">
              {toast}
            </div>
          )}

          {/* Loader podczas inicjalizacji */}
          {!isOpenCVReady && (
            <div className="absolute inset-0 bg-black/75 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="mb-4">Inicjalizacja skanera...</div>
                <div className="w-48 h-2 bg-white/20 rounded-full">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all duration-300"
                    style={{ width: `${initProgress}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 
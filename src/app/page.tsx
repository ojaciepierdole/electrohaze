'use client';

import { useState, useEffect, useMemo, useRef, TouchEvent } from 'react';
import type { DragEvent } from 'react';
import Image from 'next/image';
import { DisplayInvoiceData } from '@/types/compose2';
import { displayLabels, formatAmount } from '@/lib/compose2-helpers';
import { Search, Download, Trophy, Upload, FileSearch } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  BarProps,
} from 'recharts';
import { funnyMessages, getRandomMessage } from '@/lib/funny-messages';
import { SupplierLogo } from '@/components/SupplierLogo';
import { ColorPalette, extractColorsFromLogo, getSupplierColors } from '@/lib/color-helpers';
import { getSupplierDomain } from '@/lib/logo-helpers';
import { DocumentScanner } from '@/components/DocumentScanner';
import { Camera } from 'lucide-react';

// Dodaj na początku pliku funkcję pomocniczą do formatowania tekstu
const formatProperName = (text: string) => {
  if (!text) return '';
  return text
    .split(' ')
    .map(word => {
      // Zachowaj oryginalne słowo jeśli zawiera cyfry (np. numery mieszkań)
      if (/\d/.test(word)) return word;
      // Zachowaj słowa pisane wielkimi literami (np. skróty)
      if (word === word.toUpperCase() && word.length > 1) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
};

// Interfejs dla logów analizy
interface AnalysisLog {
  fileName: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  invoiceIssuer: string;
}

// Typy dla danych wykresu
interface ChartDataItem {
  name: string;
  domain: string;
  avgTime: number;
}

// Funkcja formatująca timestamp
const formatTimestamp = (date: Date) => {
  return [
    date.getHours().toString().padStart(2, '0'),
    date.getMinutes().toString().padStart(2, '0'),
    date.getSeconds().toString().padStart(2, '0')
  ].join('.');
};

// Funkcja formatująca datę
const formatDate = (date: Date) => {
  return [
    date.getDate().toString().padStart(2, '0'),
    (date.getMonth() + 1).toString().padStart(2, '0'),
    date.getFullYear()
  ].join('.');
};

// Aktualizujemy interfejs BarProps
interface BarCustomProps {
  x: number;
  y: number;
  width: number;
  height: number;
  value: number;
  index: number;
  payload: {
    name: string;
    domain: string;
    avgTime: number;
  };
}

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<DisplayInvoiceData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analysisLogs, setAnalysisLogs] = useState<AnalysisLog[]>([]);
  const [analysisStartTime, setAnalysisStartTime] = useState<Date | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<'time' | 'duration'>('time');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const itemsPerPage = 5;
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const [currentMessage, setCurrentMessage] = useState(() => 
    Math.floor(Math.random() * funnyMessages.length)
  );
  const [supplierColors, setSupplierColors] = useState<Record<string, ColorPalette>>({});
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const sortedLogs = useMemo(() => {
    return [...analysisLogs].sort((a, b) => {
      if (sortField === 'time') {
        return sortDirection === 'desc' 
          ? b.startTime.getTime() - a.startTime.getTime()
          : a.startTime.getTime() - b.startTime.getTime();
      }
      return sortDirection === 'desc' 
        ? b.duration - a.duration
        : a.duration - b.duration;
    });
  }, [analysisLogs, sortField, sortDirection]);

  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedLogs.slice(start, start + itemsPerPage);
  }, [sortedLogs, currentPage]);

  const totalPages = Math.ceil(analysisLogs.length / itemsPerPage);

  // Symulacja postępu analizy
  useEffect(() => {
    if (isAnalyzing) {
      const interval = setInterval(() => {
        setAnalysisProgress(prev => {
          if (prev >= 90) return 90; // Zatrzymujemy na 90% do faktycznego zakończenia
          return prev + 10;
        });
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isAnalyzing]);

  // Efekt dla losowej zmiany zabawnych komunikatów
  useEffect(() => {
    if (isAnalyzing) {
      const interval = setInterval(() => {
        setCurrentMessage(prev => getRandomMessage(prev));
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isAnalyzing]);

  // Automatyczna analiza po wybraniu pliku
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setAnalysisResult(null);
    setError(null);
    setAnalysisProgress(0);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }

    // Automatycznie rozpocznij analizę
    await handleAnalyze(file);
  };

  const handleAnalyze = async (fileOrEvent: File | React.MouseEvent) => {
    const file = fileOrEvent instanceof File ? fileOrEvent : selectedFile;
    if (!file) return;

    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setError(null);
    const startTime = new Date();
    setAnalysisStartTime(startTime);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Błąd podczas analizy dokumentu');
      }

      const data = await response.json();
      const endTime = new Date();
      
      const newLog: AnalysisLog = {
        fileName: file.name,
        startTime,
        endTime,
        duration: endTime.getTime() - startTime.getTime(),
        invoiceIssuer: data.result.supplierName || 'Nie znaleziono'
      };
      
      setAnalysisLogs(prev => [newLog, ...prev]);
      setAnalysisResult(data.result);
      setAnalysisProgress(100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił nieznany błąd');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const calculateAnalyticsStats = () => {
    if (analysisLogs.length === 0) return { median: 0, average: 0 };
    
    const durations = analysisLogs.map(log => log.duration);
    const average = durations.reduce((a, b) => a + b, 0) / durations.length;
    
    const sorted = [...durations].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 === 0
      ? (sorted[middle - 1] + sorted[middle]) / 2
      : sorted[middle];
    
    return { median, average };
  };

  const exportToCSV = () => {
    const headers = ['Nazwa pliku', 'Czas rozpoczęcia', 'Czas zakończenia', 'Czas trwania (ms)'];
    const rows = analysisLogs.map(log => [
      log.fileName,
      log.startTime.toISOString(),
      log.endTime.toISOString(),
      log.duration.toString()
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'analiza_czasow.csv';
    link.click();
  };

  const handlePreview = () => {
    if (selectedFile) {
      // Tworzymy URL dla pliku
      const fileUrl = URL.createObjectURL(selectedFile);
      // Otwieramy w nowym oknie/zakładce
      window.open(fileUrl, '_blank');
      // Czyścimy URL po otwarciu
      URL.revokeObjectURL(fileUrl);
    }
  };

  const stats = calculateAnalyticsStats();

  const handleTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const swipeThreshold = 50; // minimalna odległoć swipe'a
    const diff = touchStartX.current - touchEndX.current;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0 && currentPage < totalPages) {
        // Swipe w lewo - następna strona
        setCurrentPage(prev => Math.min(prev + 1, totalPages));
      } else if (diff < 0 && currentPage > 1) {
        // Swipe w prawo - poprzednia strona
        setCurrentPage(prev => Math.max(prev - 1, 1));
      }
    }
  };

  const fetchSupplierColors = async (domain: string) => {
    try {
      const response = await fetch(`/api/logo/colors?domain=${domain}`);
      if (!response.ok) throw new Error('Failed to fetch colors');
      const colors = await response.json();
      setSupplierColors(prev => ({
        ...prev,
        [domain]: colors
      }));
    } catch (error) {
      console.error('Error fetching supplier colors:', error);
    }
  };

  const chartData = useMemo(() => {
    return Object.entries(
      analysisLogs
        .filter(log => log.invoiceIssuer && log.invoiceIssuer !== 'Nie znaleziono')
        .reduce((acc, log) => {
          const supplier = log.invoiceIssuer.split(' ')[0];
          const domain = getSupplierDomain(supplier);
          
          // Pobierz kolory dla dostawcy jeśli jeszcze nie mamy
          if (!supplierColors[domain]) {
            fetchSupplierColors(domain);
          }

          if (!acc[supplier]) {
            acc[supplier] = {
              name: supplier,
              domain: domain,
              avgTime: 0,
              count: 0,
              totalTime: 0
            };
          }
          acc[supplier].count++;
          acc[supplier].totalTime += log.duration;
          acc[supplier].avgTime = acc[supplier].totalTime / acc[supplier].count;
          return acc;
        }, {} as Record<string, { name: string; domain: string; avgTime: number; count: number; totalTime: number }>)
    )
      .map(([_, stats]) => ({
        name: stats.name,
        domain: stats.domain,
        avgTime: Number((stats.avgTime / 1000).toFixed(2))
      }))
      .sort((a, b) => a.avgTime - b.avgTime);
  }, [analysisLogs, supplierColors]);

  const handleScanComplete = async (scannedFiles: File[]) => {
    if (scannedFiles.length === 0) return;
    
    setIsScannerOpen(false);
    // Używamy pierwszego pliku jako głównego
    setSelectedFile(scannedFiles[0]);
    await handleAnalyze(scannedFiles[0]);
  };

  // Na początku komponentu dodaj detekcję urządzenia mobilnego
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

  // Dodaj obsługę drag & drop tylko dla desktopa
  useEffect(() => {
    if (isMobile) return;

    const handleDragOver = (e: DragEvent) => {
      if (!(e instanceof DragEvent)) return;
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = (e: DragEvent) => {
      if (!(e instanceof DragEvent)) return;
      e.preventDefault();
      e.stopPropagation();
      
      const files = e.dataTransfer?.files;
      if (files && files[0]) {
        const file = files[0];
        if (file.type.startsWith('image/') || file.type === 'application/pdf') {
          setSelectedFile(file);
          void handleDroppedFile(file);
        }
      }
    };

    const handleDroppedFile = async (file: File) => {
      await handleAnalyze(file);
    };

    // Używamy type assertion dla funkcji obsługi zdarzeń
    document.addEventListener('dragover', handleDragOver as unknown as EventListener);
    document.addEventListener('drop', handleDrop as unknown as EventListener);

    return () => {
      document.removeEventListener('dragover', handleDragOver as unknown as EventListener);
      document.removeEventListener('drop', handleDrop as unknown as EventListener);
    };
  }, [isMobile]);

  // Dodaj ten efekt na początku komponentu, zaraz po deklaracji stanów
  useEffect(() => {
    if (analysisResult?.supplierName) {
      const domain = getSupplierDomain(analysisResult.supplierName);
      if (!supplierColors[domain]) {
        console.log('Fetching colors for domain:', domain);
        fetchSupplierColors(domain);
      }
    }
  }, [analysisResult?.supplierName]);

  return (
    <main className="min-h-screen">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="max-w-2xl mx-auto px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="flex items-start sm:items-center gap-2">
              <FileSearch className="w-6 h-6 text-gray-700 shrink-0" />
              <div className="flex flex-col items-start">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-700">
                  Analiza faktury za prąd
                </h1>
                <p className="text-xs text-gray-500 sm:text-right sm:hidden pl-0">
                  Automatyczna analiza faktur i wyodrębnianie danych
                </p>
              </div>
            </div>
            <p className="hidden sm:block text-xs text-gray-500 sm:text-right max-w-[200px]">
              Automatyczna analiza faktur i wyodrębnianie danych
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-6">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="relative border-2 border-dashed border-gray-300 rounded-lg">
            {(isAnalyzing || analysisProgress === 100) && (
              <div 
                className="absolute top-0 left-0 h-[5px] transition-all duration-500 rounded-t-lg"
                style={{ 
                  width: `${analysisProgress}%`,
                  backgroundColor: '#4ade80'
                }}
              />
            )}
            
            <div className="p-4 text-center">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                {isAnalyzing ? (
                  <div className="space-y-2">
                    <p className="text-lg">Analiza dokumentu</p>
                    <p className="text-gray-500 text-sm mt-2 italic">
                      {funnyMessages[currentMessage]}
                    </p>
                    <p className="text-gray-500">{analysisProgress}%</p>
                  </div>
                ) : (
                  <>
                    <p className="hidden sm:block text-base sm:text-lg text-gray-500 hover:text-gray-700 transition-colors">
                      Przeciągnij i upuść plik tutaj
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto sm:ml-auto">
                      <button
                        onClick={() => setIsScannerOpen(true)}
                        className="w-full md:hidden order-first px-4 py-3 text-sm rounded bg-gray-900 text-white hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 shadow-lg active:shadow-sm active:transform active:translate-y-px"
                      >
                        <Camera size={18} className="text-white" />
                        <span>Zrób zdjęcie</span>
                      </button>
                      <label 
                        htmlFor="file-upload" 
                        className="cursor-pointer w-full sm:w-auto sm:min-w-[140px]"
                      >
                        <input
                          id="file-upload"
                          type="file"
                          className="hidden"
                          accept=".pdf,image/*"
                          onChange={handleFileChange}
                        />
                        <span
                          className={`
                            px-4 py-3 text-sm rounded transition-all
                            flex items-center justify-center gap-2
                            w-full shadow-lg active:shadow-sm
                            active:transform active:translate-y-px
                            ${selectedFile 
                              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                              : 'bg-blue-500 text-white hover:bg-blue-600'
                            }
                          `}
                        >
                          <Upload size={18} className="shrink-0" />
                          <span>Wybierz z dysku</span>
                        </span>
                      </label>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {selectedFile && (
              <div className="relative">
                <div 
                  className={`flex items-center justify-between px-4 py-2 border-t text-sm transition-colors ${
                    analysisProgress === 100 ? 'bg-green-50' : 'bg-gray-100'
                  }`}
                >
                  <div className="flex items-center flex-1 min-w-0">
                    <p className="text-gray-700 truncate max-w-[50%]">{selectedFile.name}</p>
                    <button
                      onClick={() => {
                        const win = window.open('', '_blank');
                        if (win) {
                          win.document.write(`
                            <html>
                              <head>
                                <title>${selectedFile.name}</title>
                                <style>
                                  body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; background: #f3f4f6; }
                                  img, embed { max-width: 60vw; max-height: 90vh; }
                                </style>
                              </head>
                              <body>
                                ${selectedFile.type === 'application/pdf' 
                                  ? `<embed src="${URL.createObjectURL(selectedFile)}" type="application/pdf" width="100%" height="100%">`
                                  : `<img src="${URL.createObjectURL(selectedFile)}" alt="Preview">`
                                }
                              </body>
                            </html>
                          `);
                        }
                      }}
                      className="ml-2 p-1.5 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                    >
                      <Search size={16} />
                    </button>
                  </div>
                  {!isAnalyzing && !analysisResult && (
                    <button
                      onClick={handleAnalyze}
                      className="ml-4 px-4 py-1 text-white rounded transition-colors bg-blue-500 hover:bg-blue-600"
                    >
                      Analizuj dokument
                    </button>
                  )}
                  {analysisProgress === 100 && (
                    <span className="text-green-600 text-xs font-medium">
                      przeskanowano
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {analysisResult && (
            <div className="relative mt-8">
              {/* Główna zawartość z cieniem na zewnątrz */}
              <div className="p-6 space-y-6 bg-white rounded-lg relative border border-gray-200 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)]">
                <h2 className="text-xl font-bold text-gray-800 pb-3 border-b border-gray-200 relative">
                  Wyniki analizy dokumentu
                </h2>
                
                {/* Sekcja sprzedawcy */}
                {analysisResult.supplierName && (
                  <div 
                    className="flex items-start space-x-4 p-5 rounded-lg transition-colors"
                    style={{ 
                      backgroundColor: (() => {
                        const domain = getSupplierDomain(analysisResult.supplierName);
                        const colors = supplierColors[domain];
                        console.log('Supplier colors:', {
                          domain,
                          colors,
                          supplierName: analysisResult.supplierName
                        });
                        if (colors?.primary) {
                          return `${colors.primary}1A`;
                        }
                        return 'rgb(249 250 251)';
                      })()
                    }}
                  >
                    <SupplierLogo supplierName={analysisResult.supplierName} size={48} />
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">
                        {displayLabels.supplierName}
                      </p>
                      <p className="font-semibold text-lg text-gray-900">{analysisResult.supplierName}</p>
                    </div>
                  </div>
                )}

                {/* Grid z pozostałymi danymi */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  {analysisResult.customer && (
                    <div className="p-5 bg-gray-50 rounded-lg border border-gray-100">
                      <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-3">
                        {displayLabels.customer.title}
                      </p>
                      <p className="font-semibold text-gray-900 mb-2">
                        {formatProperName(analysisResult.customer.fullName) || 'Nie znaleziono'}
                      </p>
                      <p className="text-sm">
                        <span 
                          className="font-mono"
                          style={{ 
                            color: (() => {
                              const domain = getSupplierDomain(analysisResult.supplierName || '');
                              const colors = supplierColors[domain];
                              if (colors?.primary) {
                                const color = colors.primary.startsWith('#') 
                                  ? colors.primary 
                                  : '#3b82f6';
                                return `${color}dd`;
                              }
                              return '#374151';
                            })()
                          }}
                        >
                          {formatProperName(analysisResult.customer.address) || 'Brak adresu'}
                        </span>
                      </p>
                    </div>
                  )}

                  {analysisResult.correspondenceAddress && (
                    <div className="p-5 bg-gray-50 rounded-lg border border-gray-100">
                      <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-3">
                        {displayLabels.correspondenceAddress.title}
                      </p>
                      <p className="font-semibold text-gray-900 mb-2">
                        {formatProperName(analysisResult.correspondenceAddress.fullName) || 'Nie znaleziono'}
                      </p>
                      <p className="text-sm">
                        <span 
                          className="font-mono"
                          style={{ 
                            color: (() => {
                              const domain = getSupplierDomain(analysisResult.supplierName || '');
                              const colors = supplierColors[domain];
                              if (colors?.primary) {
                                const color = colors.primary.startsWith('#') 
                                  ? colors.primary 
                                  : '#3b82f6';
                                return `${color}dd`;
                              }
                              return '#374151';
                            })()
                          }}
                        >
                          {formatProperName(analysisResult.correspondenceAddress.address) || 'Brak adresu'}
                        </span>
                      </p>
                    </div>
                  )}

                  {analysisResult.deliveryPoint && (
                    <div className="p-5 bg-gray-50 rounded-lg border border-gray-100 col-span-full">
                      <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-3">
                        {displayLabels.deliveryPoint.title}
                      </p>
                      <div className="space-y-3">
                        <p className="text-sm">
                          <span className="font-medium text-gray-700">Adres: </span>
                          <span 
                            className="font-mono"
                            style={{ 
                              color: (() => {
                                const domain = getSupplierDomain(analysisResult.supplierName || '');
                                const colors = supplierColors[domain];
                                if (colors?.primary) {
                                  const color = colors.primary.startsWith('#') 
                                    ? colors.primary 
                                    : '#3b82f6';
                                  return `${color}dd`;
                                }
                                return '#374151';
                              })()
                            }}
                          >
                            {formatProperName(analysisResult.deliveryPoint.address) || 'Brak adresu'}
                          </span>
                        </p>
                        <p className="text-sm">
                          <span className="font-medium text-gray-700">Numer PPE: </span>
                          <span 
                            className="font-mono"
                            style={{ 
                              color: (() => {
                                const domain = getSupplierDomain(analysisResult.supplierName || '');
                                const colors = supplierColors[domain];
                                if (colors?.primary) {
                                  const color = colors.primary.startsWith('#') 
                                    ? colors.primary 
                                    : '#3b82f6';
                                  return `${color}dd`;
                                }
                                return '#374151';
                              })()
                            }}
                          >
                            {analysisResult.deliveryPoint.ppeNumber || 'Nie znaleziono'}
                          </span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Zaktualizowana sekcja historii */}
          {analysisLogs.length > 0 && (
            <div className="p-6 bg-white border rounded-lg space-y-6 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)]">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <h2 className="text-xl font-bold text-gray-800">Historia analiz</h2>
                
                <div className="w-full sm:w-auto flex flex-row justify-between items-center gap-2">
                  {/* Lewa strona z sortowaniem */}
                  <div className="flex items-center h-8 gap-2">
                    <span className="text-xs text-gray-500">Sortuj wg.</span>
                    <select 
                      value={sortField}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
                        setSortField(e.target.value as 'time' | 'duration')
                      }
                      className="text-sm border rounded h-full px-2"
                    >
                      <option value="time">kolejności dodania</option>
                      <option value="duration">czasu przetwarzania</option>
                    </select>
                    <button
                      onClick={() => setSortDirection(d => d === 'asc' ? 'desc' : 'asc')}
                      className="h-full px-2 border rounded"
                    >
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </button>
                  </div>

                  {/* Prawa strona z przyciskiem pobierania */}
                  <button
                    onClick={exportToCSV}
                    className="h-8 px-4 text-sm bg-black text-white rounded hover:bg-gray-800 flex items-center gap-2 ml-auto"
                  >
                    <Download size={16} />
                    <span className="hidden sm:inline">Pobierz</span>
                  </button>
                </div>
              </div>

              {/* Separator */}
              <div className="border-t border-gray-200" />
              
              {/* Statystyki */}
              <div className="text-sm text-gray-600 flex flex-wrap items-center justify-start gap-x-6 gap-y-1">
                <div className="flex items-center whitespace-nowrap">
                  <span className="text-[13px] sm:text-sm">Średni czas analizy:</span>
                  <span className="ml-1 font-medium text-sm sm:text-base">{(stats.average / 1000).toFixed(2)}s</span>
                </div>
                <div className="flex items-center whitespace-nowrap">
                  <span className="text-[13px] sm:text-sm">Mediana czasu analizy:</span>
                  <span className="ml-1 font-medium text-sm sm:text-base">{(stats.median / 1000).toFixed(2)}s</span>
                </div>
              </div>

              {/* Lista uploadów */}
              <div 
                className="space-y-2 touch-pan-x"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {paginatedLogs.map((log, index, array) => (
                  <div 
                    key={log.startTime.getTime()} 
                    className={`text-sm flex justify-between items-center ${
                      array.length > 1 && index !== array.length - 1 ? 'border-b pb-2' : 'pb-2'
                    } ${log.invoiceIssuer === 'Nie znaleziono' ? 'bg-red-50 rounded p-2' : ''}`}
                  >
                    <div className="flex items-center min-w-0 flex-1 gap-3">
                      <div className="shrink-0">
                        <SupplierLogo supplierName={log.invoiceIssuer} size={24} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium bg-gray-100 px-2 py-1 rounded text-xs">
                            {log.invoiceIssuer.split(' ')[0]}
                          </span>
                          <span className="text-gray-600 truncate max-w-[30%]">
                            {log.fileName}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400">
                          {formatDate(log.startTime)} • {formatTimestamp(log.startTime)}
                        </span>
                      </div>
                    </div>
                    <span className="text-gray-500 shrink-0 ml-4">
                      {(log.duration / 1000).toFixed(2)}s
                    </span>
                  </div>
                ))}
              </div>

              {/* Paginacja */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-4">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent"
                  >
                    ←
                  </button>
                  
                  <div className="flex gap-2">
                    {Array.from({ length: totalPages }, (_, i) => {
                      if (i === 0 || i === totalPages - 1) {
                        return (
                          <button
                            key={i}
                            onClick={() => setCurrentPage(i + 1)}
                            className={`px-3 py-1 rounded ${
                              currentPage === i + 1 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-gray-100 hover:bg-gray-200'
                            }`}
                          >
                            {i + 1}
                          </button>
                        );
                      }
                      
                      if (
                        i === currentPage - 2 ||
                        i === currentPage - 1 ||
                        i === currentPage ||
                        i === currentPage + 1
                      ) {
                        return (
                          <button
                            key={i}
                            onClick={() => setCurrentPage(i + 1)}
                            className={`px-3 py-1 rounded ${
                              currentPage === i + 1 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-gray-100 hover:bg-gray-200'
                            }`}
                          >
                            {i + 1}
                          </button>
                        );
                      }
                      
                      if (
                        (i === 1 && currentPage > 3) ||
                        (i === totalPages - 2 && currentPage < totalPages - 2)
                      ) {
                        return <span key={i} className="px-2">...</span>;
                      }
                      
                      return null;
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent"
                  >
                    →
                  </button>
                </div>
              )}

              {/* Ranking */}
              {analysisLogs.length >= 2 && (
                <div className="border-t pt-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-6">
                    Ranking czasów według dostawcy
                  </h3>
                  
                  <div className="space-y-4">
                    {Object.entries(
                      analysisLogs
                        .filter(log => log.invoiceIssuer && log.invoiceIssuer !== 'Nie znaleziono')
                        .reduce((acc, log) => {
                          const supplier = log.invoiceIssuer.split(' ')[0];
                          if (!acc[supplier]) {
                            acc[supplier] = {
                              count: 0,
                              totalTime: 0,
                              avgTime: 0
                            };
                          }
                          acc[supplier].count++;
                          acc[supplier].totalTime += log.duration;
                          acc[supplier].avgTime = acc[supplier].totalTime / acc[supplier].count;
                          return acc;
                        }, {} as Record<string, { count: number; totalTime: number; avgTime: number }>)
                    )
                      .sort((a, b) => a[1].avgTime - b[1].avgTime)
                      .map(([supplier, stats], index) => (
                        <div 
                          key={supplier}
                          className={`flex items-center justify-between p-3 rounded ${
                            analysisLogs.length >= 3 && index === 0 
                              ? 'bg-yellow-100/50' // Jaśniejszy żółty kolor dla lidera
                              : 'bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {/* Stały kontener dla ikony lub miejsca */}
                            <div className="w-8 flex justify-center">
                              {analysisLogs.length >= 3 && index === 0 && (
                                <Trophy 
                                  className="text-yellow-500" 
                                  size={20}
                                  aria-label="Trophy icon"
                                />
                              )}
                            </div>
                            <span className="font-medium text-sm text-gray-500">#{index + 1}</span>
                            <span className="font-medium">{supplier}</span>
                            <span className="text-sm text-gray-500">
                              ({stats.count} {stats.count === 1 ? 'analiza' : 'analizy'})
                            </span>
                          </div>
                          <span className="font-medium">
                            {(stats.avgTime / 1000).toFixed(2)}s
                          </span>
                        </div>
                      ))
                    }
                  </div>

                  {/* Wykres */}
                  <div className="mt-8 pt-6 border-t">
                    <h4 className="text-lg font-semibold text-gray-700 mb-6">
                      Średnie czasy przetwarzania
                    </h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={chartData}
                          margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                        >
                          <XAxis 
                            dataKey="name"
                            height={40}
                            tickMargin={10}
                            interval={0}
                          />
                          <YAxis 
                            label={undefined}
                          />
                          <Tooltip 
                            formatter={(value: number) => [`${value}s`, 'Średni czas']}
                            cursor={{ fill: 'transparent' }}
                          />
                          <Bar 
                            dataKey="avgTime"
                            shape={(props) => {
                              // Rzutujemy payload na nasz typ
                              const payload = (props as any).payload as ChartDataItem;
                              const { x, y, width, height, value, index } = props;
                              const cornerRadius = 4;
                              const color = supplierColors[payload.domain]?.primary || '#3b82f6';
                              
                              return (
                                <g>
                                  <path
                                    d={`
                                      M${x},${y + height}
                                      L${x},${y + cornerRadius}
                                      Q${x},${y} ${x + cornerRadius},${y}
                                      L${x + width - cornerRadius},${y}
                                      Q${x + width},${y} ${x + width},${y + cornerRadius}
                                      L${x + width},${y + height}
                                      Z
                                    `}
                                    fill={color}
                                  />
                                  <g style={{ transform: `translate(${x + width/2}px, ${y + height/2}px)` }}>
                                    <rect
                                      x={-20}
                                      y={-12}
                                      width={40}
                                      height={24}
                                      fill="white"
                                      rx={4}
                                      ry={4}
                                      filter="url(#shadow)"
                                    />
                                    <text
                                      x={0}
                                      y={6}
                                      textAnchor="middle"
                                      fill="#374151"
                                      fontSize={12}
                                      fontWeight="500"
                                    >
                                      {value}s
                                    </text>
                                  </g>
                                  {index === 0 && (
                                    <g style={{ transform: `translate(${x + width/2 - 10}px, ${y - 25}px)` }}>
                                      <Trophy
                                        size={20}
                                        className="text-yellow-500"
                                      />
                                    </g>
                                  )}
                                </g>
                              );
                            }}
                          />
                          <defs>
                            <filter
                              id="shadow"
                              filterUnits="userSpaceOnUse"
                              width="200%"
                              height="200%"
                            >
                              <feDropShadow 
                                dx="0" 
                                dy="1" 
                                stdDeviation="1"
                                floodOpacity="0.1"
                              />
                            </filter>
                          </defs>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {isScannerOpen && (
            <DocumentScanner
              onScanComplete={handleScanComplete}
              onClose={() => setIsScannerOpen(false)}
            />
          )}
        </div>
      </div>
    </main>
  );
}

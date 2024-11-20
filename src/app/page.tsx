'use client';

import { useState, useEffect, useMemo, useRef, TouchEvent } from 'react';
import Image from 'next/image';
import { DisplayInvoiceData } from '@/types/compose2';
import { displayLabels, formatAmount } from '@/lib/compose2-helpers';
import { Search, Download, Trophy } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface AnalysisLog {
  fileName: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  invoiceIssuer: string;
}

const funnyMessages = [
  "Rebootowanie hamsterów w kołowrotkach...",
  "Kalibrowanie poziomu biurokracji...",
  "Optymalizowanie stosu papierologii...",
  "Liczenie elektronów w dokumencie...",
  "Negocjowanie z AI o szybsze przetwarzanie...",
  "Składanie origami z bitów...",
  "Motywowanie leniwych pikseli...",
  "Przeprogramowywanie matrixa...",
  "Debugowanie rzeczywistości...",
  "Synchronizowanie kwantowych długopisów...",
  "Rozwiązywanie równań biurokratycznych...",
  "Formatowanie cyfrowej herbaty...",
  "Kompilowanie marzeń urzędników...",
  "Defragmentacja szuflad wirtualnych...",
  "Aktualizowanie przestarzałych przepisów...",
  "Instalowanie łatek do dziur w logice...",
  "Przetwarzanie kawy na kod binarny...",
  "Obliczanie sensu życia dokumentów...",
  "Renderowanie wirtualnej cierpliwości...",
  "Optymalizowanie chaosu biurowego...",
  "Skanowanie wymiarów równoległych...",
  "Indeksowanie wspomnień serwera...",
  "Kompresowanie nieskończoności...",
  "Debugowanie paradoksów czasowych...",
  "Kalibrowanie detektora absurdów...",
  "Ładowanie sztucznej inteligencji emocjonalnej...",
  "Synchronizowanie zegarów kwantowych...",
  "Przetwarzanie marzeń sennych AI...",
  "Kompilowanie wirtualnej rzeczywistości...",
  "Optymalizowanie przepływu czasu...",
  "Defragmentacja bazy danych marzeń...",
  "Instalowanie sterowników do wyobraźni...",
  "Aktualizowanie definicji niemożliwego...",
  "Renderowanie alternatywnych rzeczywistości...",
  "Konfigurowanie generatora wymówek...",
  "Debugowanie ludzkiej logiki...",
  "Indeksowanie zbiorowej nieświadomości...",
  "Kompresowanie nieskończonych możliwości...",
  "Optymalizowanie przypadkowych zbiegów okoliczności...",
  "Kalibrowanie detektora nonsensu...",
  "Przetwarzanie cyfrowych déjà vu...",
  "Synchronizowanie równoległych wszechświatów...",
  "Kompilowanie abstrakcyjnych koncepcji...",
  "Renderowanie wirtualnych możliwości...",
  "Instalowanie łatek do rzeczywistości...",
  "Aktualizowanie bazy danych paradoksów...",
  "Debugowanie teorii spiskowych...",
  "Indeksowanie kolektywnej wyobraźni...",
  "Optymalizowanie przypadkowych koincydencji...",
  "Kalibrowanie generatora szczęśliwych zbiegów okoliczności...",
  "Przetwarzanie cyfrowych przepowiedni...",
  "Synchronizowanie międzywymiarowych portali...",
  "Kompilowanie snów elektronicznych...",
  "Renderowanie alternatywnych linii czasowych...",
  "Instalowanie poprawek do praw fizyki...",
  "Aktualizowanie matrycy prawdopodobieństwa...",
  "Debugowanie kosmicznych anomalii...",
  "Indeksowanie biblioteki nieskończoności...",
  "Optymalizowanie kwantowej biurokracji...",
  "Kalibrowanie międzygalaktycznych formularzy...",
  "Przetwarzanie cyfrowej karmy...",
  "Synchronizowanie baz danych z przyszłością...",
  "Kompilowanie wirtualnych przepowiedni...",
  "Renderowanie cyfrowych horoskopów...",
  "Instalowanie sterowników do szczęścia...",
  "Aktualizowanie definicji przypadku...",
  "Debugowanie efektu motyla...",
  "Indeksowanie cyfrowego przeznaczenia...",
  "Optymalizowanie losowych zbiegów okoliczności...",
  "Kalibrowanie generatora cudów...",
  "Przetwarzanie międzywymiarowej korespondencji...",
  "Przekonywanie pikseli do współpracy...",
  "Obliczanie prawdopodobieństwa zagubionego długopisu...",
  "Symulowanie biurowej rzeczywistości...",
  "Kalibrowanie poziomu kawy w systemie...",
  "Dostrajanie częstotliwości narzekania...",
  "Optymalizowanie wydajności papierologii...",
  "Synchronizowanie zegarów z rzeczywistością równoległą...",
  "Analizowanie wzorców w chaosie biurowym...",
  "Przetwarzanie marzeń o weekendzie...",
  "Kompilowanie wymówek na poniedziałek...",
  "Defragmentacja służbowego chaosu...",
  "Indeksowanie biurowych plotek...",
  "Renderowanie wirtualnej cierpliwości urzędnika...",
  "Kalibrowanie detektora absurdów biurowych...",
  "Optymalizowanie czasu do przerwy na kawę...",
  "Analizowanie wzorców w stosie dokumentów...",
  "Przetwarzanie biurowych legend miejskich...",
  "Synchronizowanie zegarów z czasem obiadowym...",
  "Kompresowanie nieskończonej biurokracji...",
  "Debugowanie ludzkiej logiki w papierach...",
  "Instalowanie łatek do przepisów prawnych...",
  "Aktualizowanie bazy danych wymówek...",
  "Renderowanie wirtualnych kolejek...",
  "Optymalizowanie procesu picia kawy...",
  "Kalibrowanie poziomu stresu w systemie...",
  "Analizowanie wzorców w zachowaniu drukarki...",
  "Przetwarzanie marzeń o urlopie...",
  "Synchronizowanie deadlinów z rzeczywistością...",
  "Kompilowanie biurowych żartów...",
  "Debugowanie relacji międzyludzkich...",
  "Instalowanie sterowników do motywacji...",
  "Aktualizowanie definicji weekendu...",
  "Renderowanie wirtualnego spokoju...",
  "Optymalizowanie czasu do końca pracy...",
  "Kalibrowanie detektora wymówek...",
  "Analizowanie wzorców w spóźnieniach...",
  "Przetwarzanie służbowych plotek...",
  "Synchronizowanie przerw na kawę...",
  "Kompilowanie wymówek o korku...",
  "Debugowanie służbowego humoru...",
  "Instalowanie łatek do regulaminu...",
  "Aktualizowanie bazy danych usprawiedliwień...",
  "Renderowanie wirtualnych nadgodzin...",
  "Optymalizowanie procesu narzekania...",
  "Kalibrowanie poziomu entuzjazmu...",
  "Analizowanie wzorców w znikającej kawie...",
  "Przetwarzanie teorii spiskowych o drukarce...",
  "Synchronizowanie zegarów z czasem kawy...",
  "Kompilowanie biurowych mitów...",
  "Debugowanie służbowej etykiety...",
  "Instalowanie sterowników do drukarki (znowu)...",
  "Aktualizowanie definicji deadline'u...",
  "Renderowanie wirtualnego weekendu...",
  "Optymalizowanie czasu do przerwy...",
  "Kalibrowanie detektora nudy...",
  "Analizowanie wzorców w znikających długopisach...",
  "Przetwarzanie wymówek o korku (wersja 2.0)...",
  "Synchronizowanie zegarów z czasem do domu...",
  "Kompilowanie historii o drukarce...",
  "Debugowanie służbowego eteru...",
  "Instalowanie łatek do motywacji...",
  "Aktualizowanie bazy danych spóźnień...",
  "Renderowanie wirtualnej produktywności...",
  "Optymalizowanie procesu prokrastynacji...",
  "Kalibrowanie poziomu chaosu...",
  "Analizowanie wzorców w znikających spinaczach...",
  "Przetwarzanie biurowych urban legend...",
  "Synchronizowanie deadline'ów z rzeczywistością...",
  "Kompilowanie wymówek na jutro...",
  "Debugowanie międzywydziałowej komunikacji...",
  "Instalowanie sterowników do efektywności...",
  "Aktualizowanie definicji 'na wczoraj'...",
  "Renderowanie wirtualnego porządku...",
  "Optymalizowanie czasu do weekendu...",
  "Kalibrowanie detektora wymówek 2.0...",
  "Analizowanie wzorców w znikającym czasie...",
  "Przetwarzanie biurowych przepowiedni...",
  "Synchronizowanie zegarów ze światem zewnętrznym...",
  "Kompilowanie historii o nadgodzinach...",
  "Debugowanie służbowej rzeczywistości...",
  "Instalowanie łatek do systemu motywacyjnego...",
  "Aktualizowanie bazy danych biurowych mitów...",
  "Renderowanie wirtualnej efektywności...",
  "Optymalizowanie procesu delegowania zadań...",
  "Kalibrowanie poziomu biurowego absurdu..."
];

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
        setCurrentMessage(prev => {
          let next;
          do {
            next = Math.floor(Math.random() * funnyMessages.length);
          } while (next === prev); // Upewniamy się, że nie powtórzymy tego samego komunikatu
          return next;
        });
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
    const swipeThreshold = 50; // minimalna odległość swipe'a
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

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold">Wgraj plik</h1>
        
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
          
          <div className="p-8 text-center">
            <div className="space-y-4">
              <div className="flex justify-center">
                {preview ? (
                  <div className="relative w-48 h-48">
                    <img
                      src={preview}
                      alt="Preview"
                      className="object-contain w-full h-full"
                    />
                    <button
                      onClick={() => window.open(URL.createObjectURL(selectedFile!), '_blank')}
                      className="absolute top-2 right-2 p-2 bg-white rounded-full shadow hover:bg-gray-50"
                    >
                      <Image src="/magnifier.svg" alt="Zoom" width={20} height={20} />
                    </button>
                  </div>
                ) : (
                  <Image src="/file.svg" alt="Upload icon" width={48} height={48} />
                )}
              </div>
              {isAnalyzing ? (
                <div className="space-y-2">
                  <p className="text-lg">Analiza dokumentu</p>
                  <p className="text-gray-500 text-sm mt-2 italic">{funnyMessages[currentMessage]}</p>
                  <p className="text-gray-500">{analysisProgress}%</p>
                </div>
              ) : (
                <p className="text-lg">
                  Przeciągnij i upuść plik tutaj
                </p>
              )}
              <button
                onClick={() => {
                  const input = document.querySelector<HTMLInputElement>('input[type="file"]');
                  if (input) input.click();
                }}
                className={`px-4 py-2 rounded transition-colors ${
                  selectedFile 
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                Wybierz z dysku
              </button>
              <input
                type="file"
                className="hidden"
                accept=".pdf,image/*"
                onChange={handleFileChange}
              />
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
          <div 
            className={`p-4 rounded-lg space-y-4 shadow-md ${
              error 
                ? 'bg-red-50' 
                : 'bg-gray-50 shadow-sm hover:shadow-lg transition-shadow'
            }`}
          >
            <p className="font-bold text-lg">Wyniki analizy dokumentu:</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-bold">{displayLabels.supplierName}: </p>
                <p className="normal-case">{analysisResult.supplierName || 'Nie znaleziono'}</p>
              </div>

              {analysisResult.customer && (
                <div>
                  <p className="font-bold">{displayLabels.customer.title}: </p>
                  <p className="normal-case">{analysisResult.customer.fullName || 'Nie znaleziono'}</p>
                  <p className="text-sm text-gray-600 normal-case">{analysisResult.customer.address || 'Brak adresu'}</p>
                </div>
              )}

              {analysisResult.correspondenceAddress && (
                <div>
                  <p className="font-bold">{displayLabels.correspondenceAddress.title}: </p>
                  <p className="normal-case">{analysisResult.correspondenceAddress.fullName || 'Nie znaleziono'}</p>
                  <p className="text-sm text-gray-600 normal-case">{analysisResult.correspondenceAddress.address || 'Brak adresu'}</p>
                </div>
              )}

              {analysisResult.deliveryPoint && (
                <div>
                  <p className="font-bold">{displayLabels.deliveryPoint.title}: </p>
                  <p className="text-sm text-gray-600 normal-case">
                    <span className="font-bold">Adres: </span>
                    {analysisResult.deliveryPoint.address || 'Brak adresu'}
                  </p>
                  <p className="text-sm text-gray-600 normal-case">
                    <span className="font-bold">Numer PPE: </span>
                    {analysisResult.deliveryPoint.ppeNumber || 'Nie znaleziono'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Zaktualizowana sekcja historii */}
        {analysisLogs.length > 0 && (
          <div className="p-4 bg-white border rounded-lg space-y-6">
            <div className="flex justify-between items-center">
              <p className="font-bold text-lg">Historia analiz</p>
              <div className="flex gap-2">
                <select 
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value as 'time' | 'duration')}
                  className="text-sm border rounded p-1"
                >
                  <option value="time">Sortuj po czasie</option>
                  <option value="duration">Sortuj po długości</option>
                </select>
                <button
                  onClick={() => setSortDirection(d => d === 'asc' ? 'desc' : 'asc')}
                  className="p-1 border rounded"
                >
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </button>
                <button
                  onClick={exportToCSV}
                  className="px-4 py-1 text-sm bg-black text-white rounded hover:bg-gray-800 flex items-center gap-2"
                >
                  <Download size={16} />
                  Pobierz
                </button>
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              <p>Średni czas analizy: {(stats.average / 1000).toFixed(2)}s</p>
              <p>Mediana czasu analizy: {(stats.median / 1000).toFixed(2)}s</p>
            </div>

            <div 
              className="space-y-2 touch-pan-x"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {paginatedLogs.slice().reverse().map((log, index, array) => (
                <div 
                  key={log.startTime.getTime()} 
                  className={`text-sm flex justify-between items-center ${
                    array.length > 1 && index !== array.length - 1 ? 'border-b pb-2' : 'pb-2'
                  } ${log.invoiceIssuer === 'Nie znaleziono' ? 'bg-red-50 rounded p-2' : ''}`}
                >
                  <div className="flex items-center min-w-0 flex-1">
                    <span className="font-medium bg-gray-100 px-2 py-1 rounded mr-2 shrink-0">
                      {log.invoiceIssuer.split(' ')[0]}
                    </span>
                    <span className="text-gray-600 truncate max-w-[50%]">{log.fileName}</span>
                  </div>
                  <span className="text-gray-500 shrink-0">
                    {(log.duration / 1000).toFixed(2)}s
                  </span>
                </div>
              ))}
            </div>

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
                    // Pokazuj zawsze pierwszą i ostatnią stronę
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
                    
                    // Pokazuj sąsiadujące strony
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
                    
                    // Pokazuj kropki dla pominiętych stron
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

            {/* Ranking i wykres */}
            {analysisLogs.length >= 2 && (
              <>
                <div className="border-t pt-4">
                  <h3 className="font-bold text-lg mb-4">Ranking czasów według dostawcy</h3>
                  
                  {/* Ranking */}
                  <div className="space-y-4">
                    {Object.entries(
                      analysisLogs
                        .filter(log => log.invoiceIssuer !== 'Nie znaleziono') // Filtrujemy nieudane analizy z rankingu
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
                              ? 'bg-yellow-50' 
                              : 'bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {analysisLogs.length >= 3 && index === 0 && (
                              <Trophy className="text-yellow-500" size={20} />
                            )}
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
                  <div className="h-64 mt-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={Object.entries(
                          analysisLogs.reduce((acc, log) => {
                            const supplier = log.invoiceIssuer.split(' ')[0];
                            if (!acc[supplier]) {
                              acc[supplier] = {
                                name: supplier,
                                avgTime: 0,
                                count: 0,
                                totalTime: 0
                              };
                            }
                            acc[supplier].count++;
                            acc[supplier].totalTime += log.duration;
                            acc[supplier].avgTime = acc[supplier].totalTime / acc[supplier].count;
                            return acc;
                          }, {} as Record<string, { name: string; avgTime: number; count: number; totalTime: number }>)
                        ).map(([_, stats]) => ({
                          name: stats.name,
                          avgTime: Number((stats.avgTime / 1000).toFixed(2))
                        }))}
                        margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                      >
                        <XAxis 
                          dataKey="name"
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis 
                          label={{ 
                            value: 'Średni czas (s)', 
                            angle: -90, 
                            position: 'insideLeft',
                            style: { textAnchor: 'middle' }
                          }}
                        />
                        <Tooltip 
                          formatter={(value: number) => [`${value}s`, 'Średni czas']}
                        />
                        <Bar 
                          dataKey="avgTime" 
                          fill="#3b82f6"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { BarChart2, FileText, Clock, Server, Cpu, Eye, CheckCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { availableFields, fieldsByCategory, calculateMedian, type AnalysisLogEntry, type SupplierStats, calculateSupplierStats, getSupplierDomain, canCreateContract, updateAverage, calculateSuccessRate, hasRequiredFields } from '@/lib/analytics-helpers';
import { getSupplierColors, type ColorPalette } from '@/lib/color-helpers';
import { SupplierLogo } from '@/components/SupplierLogo';

// Funkcja pomocnicza do animacji licznika (poza komponentem)
const animateCounter = (
  startValue: number,
  endValue: number,
  duration: number,
  setValue: (value: number) => void
) => {
  const startTime = Date.now();
  const animate = () => {
    const currentTime = Date.now();
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    setValue(Math.floor(startValue + (endValue - startValue) * progress));
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };
  
  requestAnimationFrame(animate);
};

// Komponent karty z czasami
const TimeCard = ({ 
  title, 
  icon: Icon,
  currentValue,
  lastValue, 
  avgValue, 
  medianValue,
  recordValue
}: { 
  title: string;
  icon: LucideIcon;
  currentValue: number;
  lastValue: number;
  avgValue: number;
  medianValue: number;
  recordValue: number;
}) => (
  <div className="bg-gray-800 rounded-lg p-3">
    <div className="flex items-center gap-2 text-gray-400 mb-2">
      <Icon className="w-4 h-4" />
      <p>{title}</p>
    </div>
    <div className="space-y-1 font-mono text-sm">
      <div className="flex justify-between">
        <span className="text-gray-500">Ostatni:</span>
        <span className="text-white">{currentValue || lastValue}ms</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-500">Średnia:</span>
        <span className="text-gray-300">{avgValue.toFixed(0)}ms</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-500">Mediana:</span>
        <span className="text-gray-300">{medianValue.toFixed(0)}ms</span>
      </div>
      {recordValue !== Infinity && (
        <div className="flex justify-between">
          <span className="text-gray-500">Rekord:</span>
          <span className="text-green-400">{recordValue}ms</span>
        </div>
      )}
    </div>
  </div>
);

// Główny komponent
export default function AnalyticsPage() {
  // Stany
  const [analysisLogs, setAnalysisLogs] = useState<AnalysisLogEntry[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisLogEntry | null>(null);
  const [supplierStats, setSupplierStats] = useState<Record<string, SupplierStats>>({});
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);
  const [currentFileUrl, setCurrentFileUrl] = useState<string | null>(null);
  
  // Stany dla animacji
  const [processingProgress, setProcessingProgress] = useState(0);
  const [currentTotalTime, setCurrentTotalTime] = useState(0);
  const [currentAzureTime, setCurrentAzureTime] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const [supplierColors, setSupplierColors] = useState<Record<string, ColorPalette>>({});

  useEffect(() => {
    if (currentAnalysis?.supplierName) {
      const domain = getSupplierDomain(currentAnalysis.supplierName);
      getSupplierColors(domain).then(colors => {
        setSupplierColors(prev => ({
          ...prev,
          [domain]: colors
        }));
      });
    }
  }, [currentAnalysis?.supplierName]);

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setProcessingProgress(0);
    setCurrentTotalTime(0);
    setCurrentAzureTime(0);
    const startTime = Date.now();

    try {
      const formData = new FormData();
      formData.append('file', file);
      setCurrentFileName(file.name);
      setCurrentFileUrl(URL.createObjectURL(file));

      // Rozpocznij animację paska postępu
      const progressInterval = setInterval(() => {
        setProcessingProgress(prev => {
          if (prev >= 90) return prev;
          return prev + 1;
        });
      }, 50);

      const azureStartTime = Date.now();
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Analiza nie powiodła się');
      }

      const azureEndTime = Date.now();
      const data = await response.json();
      console.log('Otrzymane dane:', data.result);

      const endTime = Date.now();

      // Zatrzymaj i wyczyść interval
      clearInterval(progressInterval);
      setProcessingProgress(100);

      // Animuj liczniki czasu
      const totalTime = endTime - startTime;
      const azureTime = azureEndTime - azureStartTime;
      
      animateCounter(0, totalTime, 1000, setCurrentTotalTime);
      animateCounter(0, azureTime, 1000, setCurrentAzureTime);

      // Funkcja pomocnicza do ekstrakcji adresu
      const extractAddressParts = (address: string | undefined) => {
        if (!address) return { street: null, building: null, unit: null, city: null, postalCode: null };
        
        const postalCodeMatch = address.match(/\d{2}-\d{3}/);
        const postalCode = postalCodeMatch ? postalCodeMatch[0] : null;
        
        // Wyciągnij miasto (zakładamy, że jest po kodzie pocztowym)
        const cityMatch = address.match(/\d{2}-\d{3}\s+([^,]+)/);
        const city = cityMatch ? cityMatch[1].trim() : null;
        
        // Wyciągnij ulicę i numery
        const streetParts = address.split(',')[0].trim();
        const buildingMatch = streetParts.match(/\s+(\d+)/);
        const unitMatch = streetParts.match(/\/(\d+)/);
        
        return {
          street: streetParts.replace(/\s+\d+.*$/, ''),
          building: buildingMatch ? buildingMatch[1] : null,
          unit: unitMatch ? unitMatch[1] : null,
          city,
          postalCode
        };
      };

      // Ekstrakcja danych adresowych
      const deliveryAddress = extractAddressParts(data.result.deliveryPoint?.address);
      const customerAddress = extractAddressParts(data.result.customer?.address);
      const correspondenceAddress = extractAddressParts(data.result.correspondenceAddress?.address);

      const analysisEntry: AnalysisLogEntry = {
        timestamp: new Date(),
        supplierName: data.result.SupplierName || 'Nieznany',
        timings: {
          totalTime: endTime - startTime,
          azureResponseTime: azureEndTime - azureStartTime,
          processingTime: endTime - azureEndTime
        },
        extractedFields: {
          // Dane faktury
          InvoiceNumber: data.result.InvoiceNumber,
          InvoiceDate: data.result.InvoiceDate,
          InvoiceType: data.result.InvoiceType,
          BillingStartDate: data.result.BillingStartDate,
          BillingEndDate: data.result.BillingEndDate,
          
          // Dane zużycia
          ConsumptionValue: data.result.ConsumptionValue?.toString(),
          ConsumptionUnit: data.result.ConsumptionUnit,
          MeterNumber: data.result.MeterNumber,
          ReadingType: data.result.ReadingType,
          
          // Punkt poboru
          PPENumber: data.result.PPENumber,
          DeliveryAddress: data.result.DeliveryAddress,
          TariffGroup: data.result.TariffGroup,
          
          // Dane klienta
          CustomerName: data.result.CustomerName,
          CustomerAddress: data.result.CustomerAddress,
          CustomerTaxId: data.result.CustomerTaxId,
          
          // Dane sprzedawcy
          SupplierName: data.result.SupplierName,
          SupplierAddress: data.result.SupplierAddress,
          SupplierTaxId: data.result.SupplierTaxId
        }
      };

      console.log('Przetworzone dane:', analysisEntry);

      setCurrentAnalysis(analysisEntry);
      setAnalysisLogs(prev => [analysisEntry, ...prev]);
      setSupplierStats(prev => {
        const newStats = { ...prev };
        const supplier = analysisEntry.supplierName;
        
        if (!newStats[supplier]) {
          newStats[supplier] = {
            totalDocuments: 0,
            contractReadyDocuments: 0,
            avgTotalTime: 0,
            avgAzureResponseTime: 0,
            avgProcessingTime: 0,
            successRates: {}
          };
        }
        
        const stats = newStats[supplier];
        stats.totalDocuments++;
        
        // Sprawdź kompletność danych
        if (hasRequiredFields(analysisEntry.extractedFields)) {
          stats.contractReadyDocuments++;
        }
        
        // Oblicz procent kompletnych dokumentów
        stats.readyForContractRate = (stats.contractReadyDocuments / stats.totalDocuments) * 100;
        
        // Aktualizuj średnie czasy
        stats.avgTotalTime = updateAverage(stats.avgTotalTime, analysisEntry.timings.totalTime, stats.totalDocuments);
        stats.avgAzureResponseTime = updateAverage(stats.avgAzureResponseTime, analysisEntry.timings.azureResponseTime, stats.totalDocuments);
        stats.avgProcessingTime = updateAverage(stats.avgProcessingTime, analysisEntry.timings.processingTime, stats.totalDocuments);
        
        // Aktualizuj statystyki sukcesu dla każdego pola
        Object.entries(analysisEntry.extractedFields).forEach(([field, value]) => {
          if (!stats.successRates[field]) {
            stats.successRates[field] = { success: 0, total: 0, rate: 0 };
          }
          stats.successRates[field].total++;
          if (value) {
            stats.successRates[field].success++;
          }
          stats.successRates[field].rate = stats.successRates[field].success / stats.successRates[field].total;
        });
        
        return newStats;
      });

    } catch (error) {
      console.error('Błąd podczas analizy:', error);
      alert('Wystąpił błąd podczas analizy dokumentu');
    } finally {
      setIsUploading(false);
    }
  };

  // Zaktualizuj obsługę kolorów w renderowaniu pól
  const renderField = (field: typeof availableFields[0], value: string | null) => {
    const domain = getSupplierDomain(currentAnalysis?.supplierName || '');
    const colors = supplierColors[domain];
    const color = colors?.primary || '#374151';
    
    return (
      <div key={field.key} className="flex items-baseline">
        <span className="text-gray-500 mr-2">{field.label}</span>
        <div className="flex-1 mx-2 border-b border-dotted border-gray-300" />
        {value ? (
          <span 
            className="font-mono"
            style={{ color }}
          >
            {value}
          </span>
        ) : (
          <span className="font-mono text-gray-300">
            Nie znaleziono
          </span>
        )}
      </div>
    );
  };

  return (
    <main className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header z uploadem */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <BarChart2 className="w-6 h-6 text-gray-700" />
              <h1 className="text-2xl font-bold text-gray-900">
                Analiza pól dokumentów
              </h1>
            </div>
            
            <div className="flex items-center gap-4 flex-1">
              {/* Uploader */}
              <div className="flex-1 max-w-md relative">
                {isUploading ? (
                  <div className="h-12 bg-gray-100 rounded-lg overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${processingProgress}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-sm transition-colors ${
                        processingProgress > 45 ? 'text-white' : 'text-gray-600'
                      }`}>
                        {processingProgress}%
                      </span>
                    </div>
                  </div>
                ) : (
                  <div 
                    className="border-2 border-dashed border-gray-300 rounded-lg transition-colors"
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.add('border-blue-500', 'bg-blue-50');
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
                    }}
                    onDrop={async (e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files[0];
                      if (file && file.type === 'application/pdf') {
                        await handleFileUpload(file);
                      }
                    }}
                  >
                    <input
                      type="file"
                      id="file-upload"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          await handleFileUpload(file);
                          e.target.value = '';
                        }
                      }}
                      accept=".pdf"
                      className="hidden"
                    />
                    <label 
                      htmlFor="file-upload"
                      className="flex items-center justify-center p-3 cursor-pointer"
                    >
                      <FileText className="w-5 h-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-500">
                        Przeciągnij plik PDF lub <span className="text-blue-500">wybierz z dysku</span>
                      </span>
                    </label>
                  </div>
                )}
              </div>

              {/* Nazwa pliku i podgląd */}
              {currentFileName && (
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 max-w-[200px] truncate">
                    {currentFileName}
                  </span>
                  {currentFileUrl && (
                    <a
                      href={currentFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-6 h-6 flex items-center justify-center bg-gray-900 hover:bg-gray-800 text-white rounded-full transition-colors"
                      title="Podgląd dokumentu"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sekcja statystyk per dostawca */}
        {Object.entries(supplierStats).length > 0 && (
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Statystyki per dostawca</h3>
            <div className="divide-y divide-gray-100">
              {Object.entries(supplierStats).map(([supplier, stats]) => {
                const domain = getSupplierDomain(supplier);
                const colors = supplierColors[domain] || { primary: '#374151' };
                const successRate = calculateSuccessRate(stats);
                
                return (
                  <div key={supplier} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-6">
                      {/* Logo i nazwa */}
                      <div className="flex items-center gap-3 min-w-[200px]">
                        <SupplierLogo supplierName={supplier} size={32} />
                        <div>
                          <h4 className="font-medium text-gray-900">{supplier}</h4>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-500">
                              Dokumenty: {stats.totalDocuments}
                            </span>
                            {stats.contractReadyDocuments > 0 && (
                              <span className="text-green-500 font-medium flex items-center gap-1">
                                <CheckCircle className="w-4 h-4" />
                                Kompletne: {stats.contractReadyDocuments} ({((stats.contractReadyDocuments / stats.totalDocuments) * 100).toFixed(1)}%)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Statystyki inline */}
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">Skuteczność:</span>
                          <span className="font-medium" style={{ color: colors.primary }}>
                            {successRate.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">Azure:</span>
                          <span className="font-medium" style={{ color: colors.primary }}>
                            {stats.avgAzureResponseTime.toFixed(0)}ms
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">Przetwarzanie:</span>
                          <span className="font-medium" style={{ color: colors.primary }}>
                            {stats.avgProcessingTime.toFixed(0)}ms
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Sekcja przetwarzania */}
        {(isUploading || currentAnalysis) && (
          <div className="bg-gray-900 p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Przetwarzanie</h3>
              <div className="flex items-center gap-2 text-gray-400">
                <FileText className="w-4 h-4" />
                <span>Przetworzone pliki: {analysisLogs.length}</span>
              </div>
            </div>
            
            {/* Czasy z wartościami średnimi i medianą */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <TimeCard
                title="Czas obróbki"
                icon={Clock}
                currentValue={currentTotalTime}
                lastValue={currentAnalysis?.timings.totalTime || 0}
                avgValue={analysisLogs.reduce((acc, log) => acc + log.timings.totalTime, 0) / Math.max(analysisLogs.length, 1)}
                medianValue={calculateMedian(analysisLogs.map(log => log.timings.totalTime))}
                recordValue={analysisLogs.length > 0 ? Math.min(...analysisLogs.map(log => log.timings.totalTime)) : Infinity}
              />
              <TimeCard
                title="Reakcja Azure"
                icon={Server}
                currentValue={currentAzureTime}
                lastValue={currentAnalysis?.timings.azureResponseTime || 0}
                avgValue={analysisLogs.reduce((acc, log) => acc + log.timings.azureResponseTime, 0) / Math.max(analysisLogs.length, 1)}
                medianValue={calculateMedian(analysisLogs.map(log => log.timings.azureResponseTime))}
                recordValue={analysisLogs.length > 0 ? Math.min(...analysisLogs.map(log => log.timings.azureResponseTime)) : Infinity}
              />
              <TimeCard
                title="Przetwarzanie"
                icon={Cpu}
                currentValue={0}
                lastValue={currentAnalysis?.timings.processingTime || 0}
                avgValue={analysisLogs.reduce((acc, log) => acc + log.timings.processingTime, 0) / Math.max(analysisLogs.length, 1)}
                medianValue={calculateMedian(analysisLogs.map(log => log.timings.processingTime))}
                recordValue={analysisLogs.length > 0 ? Math.min(...analysisLogs.map(log => log.timings.processingTime)) : Infinity}
              />
            </div>

            {/* Wyodrębnione pola */}
            {currentAnalysis && (
              <div className="space-y-4 bg-white -mx-6 -mb-6 p-6 rounded-b-lg">
                {/* Sprzedawca i Produkt w jednym rzędzie */}
                <div className="grid grid-cols-2 gap-6">
                  {['Sprzedawca', 'Produkt'].map(category => (
                    <div key={category}>
                      <h4 className="text-sm font-bold text-gray-900 mb-2">{category}</h4>
                      <div className="space-y-2">
                        {availableFields
                          .filter(field => field.category === category)
                          .map(field => renderField(field, currentAnalysis.extractedFields[field.key]))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pozostałe sekcje */}
                {['Punkt dostawy', 'Dane ogólne', 'Płatnik', 'Faktura', 'Zużycie'].map(category => (
                  <div key={category} className="border-t pt-4">
                    <h4 className="text-sm font-bold text-gray-900 mb-2">{category}</h4>
                    <div className="grid grid-cols-3 gap-x-4 gap-y-2">
                      {availableFields
                        .filter(field => field.category === category)
                        .map(field => renderField(field, currentAnalysis.extractedFields[field.key]))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
} 
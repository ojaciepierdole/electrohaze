'use client';

import * as React from 'react';
import { ModelSelector } from '@/components/ModelSelector';
import { FileUpload } from '@/components/FileUpload';
import { BatchProcessingResults } from '@/components/BatchProcessingResults';
import { ProcessingSummary } from '@/components/ProcessingSummary';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Clock, Server, Cpu } from 'lucide-react';
import type { 
  ModelDefinition, 
  ProcessingResult, 
  BatchProcessingStatus,
  AnalysisLogEntry,
  AnalysisResult
} from '@/types/processing';
import { useDocumentIntelligenceModels } from '@/hooks/useDocumentIntelligenceModels';
import { calculateMedian, calculateConfidence } from '@/utils';
import { TimeCard } from './TimeCard';
import { AnalysisResultCard } from '@/components/AnalysisResultCard';
import { exportToCSV } from '@/utils/export';
import { insertDocumentWithData } from '@/lib/supabase/document-helpers';
import type { DocumentInsertData } from '@/lib/supabase/document-helpers';
import { useDocumentProcessing } from '@/hooks/useDocumentProcessing';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function ProcessingClient() {
  const [selectedModels, setSelectedModels] = React.useState<string[]>([]);
  const [results, setResults] = React.useState<ProcessingResult[]>([]);
  const [batchId, setBatchId] = React.useState<string>('');
  const [isUploading, setIsUploading] = React.useState(false);
  const [currentAnalysis, setCurrentAnalysis] = React.useState<AnalysisLogEntry | null>(null);
  const [analysisLogs, setAnalysisLogs] = React.useState<AnalysisLogEntry[]>([]);
  const [currentTotalTime, setCurrentTotalTime] = React.useState(0);
  const [currentAzureTime, setCurrentAzureTime] = React.useState(0);
  const [processingStatus, setProcessingStatus] = React.useState<BatchProcessingStatus>({
    isProcessing: false,
    currentFileIndex: 0,
    currentFileName: null,
    currentModelIndex: 0,
    currentModelId: null,
    fileProgress: 0,
    totalProgress: 0,
    totalFiles: 0,
    results: [],
    error: null
  });

  const { data: models = [], isLoading, error } = useDocumentIntelligenceModels();
  const { isProcessing, progress, saveDocument } = useDocumentProcessing();

  // Obliczamy całkowity postęp na podstawie plików i modeli
  const calculateProgress = React.useCallback((fileIndex: number, modelIndex: number, totalFiles: number, totalModels: number) => {
    // Całkowita liczba operacji to liczba plików * liczba modeli
    const totalOperations = totalFiles * totalModels;
    // Aktualny numer operacji to (fileIndex * totalModels) + modelIndex
    const currentOperation = (fileIndex * totalModels) + modelIndex;
    // Obliczamy procent postępu
    return (currentOperation / totalOperations) * 100;
  }, []);

  const handleProcessingStart = React.useCallback(() => {
    console.log('Rozpoczynam przetwarzanie');
    setResults([]);
    setBatchId(Date.now().toString());
  }, []);

  const handleProcessingComplete = React.useCallback((newResults: ProcessingResult[]) => {
    console.log('Zakończono przetwarzanie', newResults);
    setResults((prev: ProcessingResult[]) => {
      const existingFileNames = new Set(newResults.map(r => r.fileName));
      const filteredPrev = prev.filter(r => !existingFileNames.has(r.fileName));
      return [...filteredPrev, ...newResults];
    });
  }, []);

  const handleExport = React.useCallback(() => {
    if (!results.length) return;

    const exportData = results.map(result => {
      // Bezpieczne pobieranie pól
      const modelResults = result.modelResults || [];
      const firstModel = modelResults[0] || {};
      const fields = firstModel.fields || {};

      const data = {
        // Metadane
        Plik: result.fileName || '',
        'Czas przetwarzania (ms)': result.processingTime || 0,
        'Pewność modelu': firstModel.confidence || 0,
        'Liczba stron': firstModel.pageCount || 1,

        // Dane sprzedawcy
        'Nazwa sprzedawcy': fields.supplierName?.content || '',
        'NIP sprzedawcy': fields.supplierTaxID?.content || '',
        'Adres sprzedawcy': [
          fields.supplierStreet?.content,
          fields.supplierBuilding?.content,
          fields.supplierUnit?.content
        ].filter(Boolean).join(' ') || '',
        'Kod pocztowy sprzedawcy': fields.supplierPostalCode?.content || '',
        'Miasto sprzedawcy': fields.supplierCity?.content || '',
        'Nazwa OSD': fields.OSD_name?.content || '',
        'Region OSD': fields.OSD_region?.content || '',

        // Dane PPE
        'Numer PPE': fields.ppeNum?.content || '',
        'Numer licznika': fields.MeterNumber?.content || '',
        'Grupa taryfowa': fields.TariffGroup?.content || '',
        'Numer umowy': fields.ContractNumber?.content || '',
        'Typ umowy': fields.ContractType?.content || '',
        'Adres PPE': [
          fields.Street?.content,
          fields.Building?.content,
          fields.Unit?.content
        ].filter(Boolean).join(' ') || '',
        'Kod pocztowy PPE': fields.PostalCode?.content || '',
        'Miasto PPE': fields.City?.content || '',
        'Gmina': fields.Municipality?.content || '',
        'Powiat': fields.District?.content || '',
        'Województwo': fields.Province?.content || '',

        // Dane klienta
        'Imię klienta': fields.FirstName?.content || '',
        'Nazwisko klienta': fields.LastName?.content || '',
        'Nazwa firmy': fields.BusinessName?.content || '',
        'NIP': fields.taxID?.content || '',

        // Dane korespondencyjne
        'Imię (korespondencja)': fields.paFirstName?.content || '',
        'Nazwisko (korespondencja)': fields.paLastName?.content || '',
        'Nazwa firmy (korespondencja)': fields.paBusinessName?.content || '',
        'Tytuł (korespondencja)': fields.paTitle?.content || '',
        'Adres korespondencyjny': [
          fields.paStreet?.content,
          fields.paBuilding?.content,
          fields.paUnit?.content
        ].filter(Boolean).join(' ') || '',
        'Kod pocztowy (korespondencja)': fields.paPostalCode?.content || '',
        'Miasto (korespondencja)': fields.paCity?.content || '',

        // Dane rozliczeniowe
        'Data rozpoczęcia': fields.BillingStartDate?.content || '',
        'Data zakończenia': fields.BillingEndDate?.content || '',
        'Nazwa produktu': fields.ProductName?.content || '',
        'Taryfa': fields.Tariff?.content || '',
        'Zużycie': fields.BilledUsage?.content || '',
        'Typ odczytu': fields.ReadingType?.content || '',
        'Zużycie 12m': fields.usage12m?.content || '',
        'Typ faktury': fields.InvoiceType?.content || '',
      };

      return data;
    });

    exportToCSV(exportData, `analiza-faktur-${new Date().toISOString().split('T')[0]}.csv`);
  }, [results]);

  const handleAnalyzeComplete = async (results: AnalysisResult) => {
    const documentData: DocumentInsertData = {
      document: {
        status: 'completed' as const,
        confidence: results.confidence || 0,
        original_filename: results.fileName || '',
        file_url: results.fileUrl || '',
      },
      ppeData: {
        ppe_number: results.ppeData?.ppeNumber || null,
        meter_number: results.ppeData?.meterNumber || null,
        tariff_group: results.ppeData?.tariffGroup || null,
        contract_number: results.ppeData?.contractNumber || null,
        contract_type: results.ppeData?.contractType || null,
        street: results.ppeData?.street || null,
        building: results.ppeData?.building || null,
        unit: results.ppeData?.unit || null,
        postal_code: results.ppeData?.postalCode || null,
        city: results.ppeData?.city || null,
        municipality: results.ppeData?.municipality || null,
        district: results.ppeData?.district || null,
        province: results.ppeData?.province || null,
        confidence: results.ppeData?.confidence || 0,
      },
      correspondenceData: {
        first_name: results.correspondenceData?.firstName || null,
        last_name: results.correspondenceData?.lastName || null,
        business_name: results.correspondenceData?.businessName || null,
        title: results.correspondenceData?.title || null,
        street: results.correspondenceData?.street || null,
        building: results.correspondenceData?.building || null,
        unit: results.correspondenceData?.unit || null,
        postal_code: results.correspondenceData?.postalCode || null,
        city: results.correspondenceData?.city || null,
        confidence: results.correspondenceData?.confidence || 0,
      },
      supplierData: {
        supplier_name: results.supplierData?.supplierName || null,
        tax_id: results.supplierData?.taxId || null,
        street: results.supplierData?.street || null,
        building: results.supplierData?.building || null,
        unit: results.supplierData?.unit || null,
        postal_code: results.supplierData?.postalCode || null,
        city: results.supplierData?.city || null,
        bank_account: results.supplierData?.bankAccount || null,
        bank_name: results.supplierData?.bankName || null,
        email: results.supplierData?.email || null,
        phone: results.supplierData?.phone || null,
        website: results.supplierData?.website || null,
        osd_name: results.supplierData?.osdName || null,
        osd_region: results.supplierData?.osdRegion || null,
        confidence: results.supplierData?.confidence || 0,
      },
      billingData: {
        billing_start_date: results.billingData?.billingStartDate || null,
        billing_end_date: results.billingData?.billingEndDate || null,
        billed_usage: results.billingData?.billedUsage || null,
        usage_12m: results.billingData?.usage12m || null,
        confidence: results.billingData?.confidence || 0,
      },
      customerData: {
        first_name: results.customerData?.firstName || null,
        last_name: results.customerData?.lastName || null,
        business_name: results.customerData?.businessName || null,
        tax_id: results.customerData?.taxId || null,
        confidence: results.customerData?.confidence || 0,
      },
    };

    try {
      await saveDocument(documentData);
    } catch (error) {
      // Błąd jest już obsługiwany przez hook
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white border">
        <CardHeader className="border-b">
          <CardTitle>Przygotowanie analizy</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div>
            <ModelSelector
              models={models}
              selectedModels={selectedModels}
              onModelSelect={setSelectedModels}
              disabled={isLoading || processingStatus.isProcessing}
              isLoading={isLoading}
              error={error}
            />
          </div>

          <div>
            <FileUpload
              modelIds={selectedModels}
              disabled={isLoading}
              onStart={handleProcessingStart}
              onComplete={handleProcessingComplete}
              batchId={batchId}
              status={processingStatus}
              onStatusUpdate={(status) => {
                if ('currentFileIndex' in status || 'currentModelIndex' in status) {
                  const fileIndex = status.currentFileIndex ?? processingStatus.currentFileIndex;
                  const modelIndex = status.currentModelIndex ?? processingStatus.currentModelIndex;
                  const totalFiles = processingStatus.totalFiles;
                  const totalModels = selectedModels.length;

                  const totalProgress = calculateProgress(fileIndex, modelIndex, totalFiles, totalModels);
                  const fileProgress = ((modelIndex ?? 0) + 1) / totalModels * 100;

                  setProcessingStatus(prev => ({
                    ...prev,
                    ...status,
                    totalProgress,
                    fileProgress
                  }));
                } else {
                  setProcessingStatus(prev => ({ ...prev, ...status }));
                }
              }}
            />
          </div>
        </CardContent>
      </Card>
      
      {!processingStatus.isProcessing && results.length > 0 && (
        <div className="space-y-4">
          <Card className="bg-white border">
            <CardHeader className="border-b">
              <CardTitle>Podsumowanie analizy</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ProcessingSummary
                fileCount={results.length}
                totalTime={results.reduce((sum, r) => sum + (r.processingTime || 0), 0)}
                averageConfidence={results.reduce((sum, r) => {
                  if (!r.modelResults || r.modelResults.length === 0) return sum;
                  // Oblicz średnią pewność dla każdego modelu
                  const modelConfidences = r.modelResults.map(mr => {
                    // Jeśli model ma pola, oblicz średnią pewność pól
                    if (mr.fields && Object.keys(mr.fields).length > 0) {
                      const fieldConfidences = Object.values(mr.fields)
                        .filter(f => typeof f.confidence === 'number')
                        .map(f => f.confidence);
                      return fieldConfidences.length > 0 
                        ? fieldConfidences.reduce((a, b) => a + b, 0) / fieldConfidences.length 
                        : 0;
                    }
                    // Jeśli nie ma pól, użyj ogólnej pewności modelu
                    return mr.confidence || 0;
                  });
                  // Oblicz średnią z wszystkich modeli
                  return sum + (modelConfidences.reduce((a, b) => a + b, 0) / modelConfidences.length);
                }, 0) / Math.max(results.length, 1)}
                onExport={handleExport}
              />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4">
            {results.map((result, index) => (
              <AnalysisResultCard key={`${result.fileName}-${index}`} result={result} />
            ))}
          </div>
        </div>
      )}
      
      {(isUploading || currentAnalysis) && (
        <div className="bg-gray-900 p-6 rounded-lg shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-white">Przetwarzanie</h3>
            <div className="flex items-center gap-2 text-gray-400">
              <FileText className="w-4 h-4" />
              <span>Przetworzone pliki: {Math.ceil(analysisLogs.length / selectedModels.length)}</span>
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
        </div>
      )}
      
      {isProcessing && (
        <div className="mt-4">
          <Progress value={progress} className="w-full" />
          <p className="text-sm text-muted-foreground mt-2">
            Zapisywanie wyników analizy...
          </p>
        </div>
      )}
      
      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
} 
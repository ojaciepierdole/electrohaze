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
import { findMissingFields, MissingFields } from '../utils/document-mapping';
import type { DocumentAnalysisResult } from '@/types/documentTypes';
import { calculateOptimalColumns } from '@/utils/text-formatting';

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
      const modelResults = result.modelResults || [];
      const firstModel = modelResults[0] || {};
      const fields = firstModel.fields || {};

      return {
        // Metadane
        'Plik': result.fileName || '',
        'Czas przetwarzania (ms)': result.processingTime || 0,
        'Pewność modelu': firstModel.confidence || 0,
        'Liczba stron': firstModel.pageCount || 1,

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
        'Gmina PPE': fields.Municipality?.content || '',
        'Powiat PPE': fields.District?.content || '',
        'Województwo PPE': fields.Province?.content || '',
        'Nazwa OSD': fields.OSD_name?.content || '',
        'Region OSD': fields.OSD_region?.content || '',

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
        'Konto bankowe': fields.supplierBankAccount?.content || '',
        'Nazwa banku': fields.supplierBankName?.content || '',
        'Email sprzedawcy': fields.supplierEmail?.content || '',
        'Telefon sprzedawcy': fields.supplierPhone?.content || '',
        'Strona WWW sprzedawcy': fields.supplierWebsite?.content || '',

        // Dane rozliczeniowe
        'Data rozpoczęcia': fields.BillingStartDate?.content || '',
        'Data zakończenia': fields.BillingEndDate?.content || '',
        'Zużycie rozliczeniowe': fields.BilledUsage?.content || '',
        'Zużycie 12m': fields.usage12m?.content || '',
      };
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
        file_name: results.fileName || '',
        file_type: 'pdf',
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
        city: results.ppeData?.city || null,
        confidence: results.ppeData?.confidence || null,
        osd_name: results.ppeData?.osdName || null,
        osd_region: results.ppeData?.osdRegion || null,
      },
      supplierData: {
        supplier_name: results.supplierData?.supplierName || null,
        supplier_tax_id: results.supplierData?.taxId || null,
        supplier_street: results.supplierData?.street || null,
        supplier_building: results.supplierData?.building || null,
        supplier_unit: results.supplierData?.unit || null,
        supplier_postal_code: results.supplierData?.postalCode || null,
        supplier_city: results.supplierData?.city || null,
        supplier_bank_account: results.supplierData?.bankAccount || null,
        supplier_bank_name: results.supplierData?.bankName || null,
        supplier_email: results.supplierData?.email || null,
        supplier_phone: results.supplierData?.phone || null,
        supplier_website: results.supplierData?.website || null,
        confidence: results.supplierData?.confidence || 0,
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

  const MissingFieldsSection: React.FC<{ data: DocumentAnalysisResult }> = ({ data }) => {
    const missingFields: MissingFields = findMissingFields(data);
    
    return (
      <div className="mt-4">
        <h3 className="text-lg font-semibold">Brakujące dane:</h3>
        
        {Object.entries(missingFields).map(([section, fields]) => {
          if (fields.length === 0) return null;
          
          // Przygotuj dane dla calculateOptimalColumns
          const fieldsForColumns = fields.map((field: string) => ({
            key: field,
            label: field
          }));
          
          // Oblicz optymalny układ kolumn
          const { columns, gridClass } = React.useMemo(
            () => calculateOptimalColumns(fieldsForColumns),
            [fieldsForColumns]
          );

          return (
            <div key={section} className="mt-4">
              <h4 className="font-medium mb-2">{getSectionLabel(section)}:</h4>
              <div className={`grid gap-x-12 gap-y-2 ${gridClass}`}>
                {columns.map((column, columnIndex) => (
                  <div key={columnIndex} className="space-y-2">
                    {column.map(({ label }) => (
                      <div key={label} className="flex items-center gap-2">
                        <span className="text-sm text-gray-400">{label}</span>
                        <span className="text-sm text-gray-300">—</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  function getSectionLabel(section: string): string {
    const labels = {
      customerData: 'Dane klienta',
      ppeData: 'Dane PPE',
      correspondenceData: 'Dane korespondencyjne',
      billingData: 'Dane rozliczeniowe',
      supplierData: 'Dane dostawcy'
    };
    return labels[section as keyof typeof labels] || section;
  }

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
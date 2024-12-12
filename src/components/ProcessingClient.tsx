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
  DocumentAnalysisResult
} from '@/types/processing';
import { useDocumentIntelligenceModels } from '@/hooks/useDocumentIntelligenceModels';
import { calculateMedian } from '@/utils';
import { TimeCard } from './TimeCard';
import { AnalysisResultCard } from '@/components/AnalysisResultCard';
import { exportToCSV } from '@/utils/export';
import { insertDocumentWithData } from '@/lib/supabase/document-helpers';
import type { DocumentInsertData } from '@/lib/supabase/document-helpers';
import { useDocumentProcessing } from '@/hooks/useDocumentProcessing';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { findMissingFields, MissingFields } from '../utils/document-mapping';
import { calculateOptimalColumns } from '@/utils/text-formatting';
import { DateHelpers } from '@/types/common';

interface TimeCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  description: string;
}

interface ModelSelectorProps {
  models: ModelDefinition[];
  selectedModels: string[];
  onSelectionChange: (models: string[]) => void;
  isLoading: boolean;
  error?: string;
}

interface FileUploadProps {
  onUploadStart: () => void;
  onUploadComplete: (results: ProcessingResult[]) => void;
  selectedModels: string[];
  isProcessing: boolean;
  progress: number;
}

interface ProcessingSummaryProps {
  fileCount: number;
  totalTime: number;
  averageConfidence: number;
  onExport: () => void;
}

interface BatchProcessingResultsProps {
  results: ProcessingResult[];
  onExport: () => void;
}

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

  // Obliczamy statystyki dokumentów
  const documentStats = React.useMemo(() => {
    if (!results.length) return { averageConfidence: 0 };

    const confidences = results.map(result => {
      const modelResults = result.modelResults || [];
      return modelResults.reduce((acc, model) => acc + (model.confidence || 0), 0) / modelResults.length;
    });

    const averageConfidence = confidences.reduce((acc, conf) => acc + conf, 0) / confidences.length;

    return {
      averageConfidence
    };
  }, [results]);

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
        'Data rozpoczęcia': fields.BillingStartDate?.content 
          ? DateHelpers.formatForDisplay(DateHelpers.toISOString(fields.BillingStartDate.content))
          : '',
        'Data zakończenia': fields.BillingEndDate?.content
          ? DateHelpers.formatForDisplay(DateHelpers.toISOString(fields.BillingEndDate.content))
          : '',
        'Zużycie rozliczeniowe': fields.BilledUsage?.content || '',
        'Zużycie 12m': fields.usage12m?.content || '',
      };
    });

    exportToCSV(exportData, `analiza-faktur-${new Date().toISOString().split('T')[0]}.csv`);
  }, [results]);

  const handleAnalyzeComplete = async (results: DocumentAnalysisResult) => {
    const documentData: DocumentInsertData = {
      document: {
        status: 'completed' as const,
        confidence: results.ppeData?.confidence || 0,
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
          
          const { columns, gridClass } = calculateOptimalColumns(fieldsForColumns);
          
          return (
            <div key={section} className="mt-2">
              <h4 className="text-md font-medium">{section}:</h4>
              <div className={`grid gap-2 ${gridClass}`}>
                {fields.map((field: string) => (
                  <div key={field} className="text-sm text-gray-600">
                    • {field}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <TimeCard
          title="Całkowity czas"
          value={currentTotalTime}
          icon={Clock}
          description="Od rozpoczęcia do zakończenia"
        />
        <TimeCard
          title="Czas Azure"
          value={currentAzureTime}
          icon={Server}
          description="Czas odpowiedzi Azure"
        />
        <TimeCard
          title="Czas przetwarzania"
          value={currentTotalTime - currentAzureTime}
          icon={Cpu}
          description="Czas lokalnego przetwarzania"
        />
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Przetworzone pliki
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{results.length}</div>
            <p className="text-xs text-muted-foreground">
              Liczba przeanalizowanych dokumentów
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Przetwarzanie dokumentów</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              <ModelSelector
                models={models}
                selectedModels={selectedModels}
                onSelectionChange={setSelectedModels}
                isLoading={isLoading}
                error={error}
              />
              
              <FileUpload
                onUploadStart={handleProcessingStart}
                onUploadComplete={handleProcessingComplete}
                selectedModels={selectedModels}
                isProcessing={isProcessing}
                progress={progress}
              />

              {processingStatus.isProcessing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>
                      Plik {processingStatus.currentFileIndex + 1} z {processingStatus.totalFiles}
                    </span>
                    <span>{processingStatus.currentFileName}</span>
                  </div>
                  <Progress value={processingStatus.totalProgress} />
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Podsumowanie</CardTitle>
          </CardHeader>
          <CardContent>
            <ProcessingSummary
              fileCount={results.length}
              totalTime={currentTotalTime}
              averageConfidence={documentStats.averageConfidence}
              onExport={handleExport}
            />
          </CardContent>
        </Card>
      </div>

      <BatchProcessingResults
        results={results}
        onExport={handleExport}
      />
    </div>
  );
} 
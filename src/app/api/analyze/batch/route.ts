import { NextResponse } from 'next/server';
import { DocumentAnalysisClient } from '@azure/ai-form-recognizer';
import type { 
  ProcessingResult, 
  PollOptions, 
  ProcessedField, 
  FieldGroupKey, 
  FieldWithConfidence,
  DocumentField
} from '@/types/processing';
import type { DocumentAnalysisResult } from '@/types/documentAnalysis';
import { cacheManager } from '@/lib/cache-manager';
import { decompressData } from '@/utils/compression';
import { sendProgress } from '@/lib/progress-emitter';
import { mapDocumentAnalysisResult } from '@/utils/document-mapping';
import { FIELD_GROUPS, FIELD_NAME_MAP } from '@/config/fields';

// Azure Document Intelligence pozwala na maksymalnie 15 równoległych żądań
const MAX_CONCURRENT_REQUESTS = 15;

// Funkcja pomocnicza do mapowania nazwy pola
function mapFieldName(fieldName: string): string {
  return FIELD_NAME_MAP[fieldName as keyof typeof FIELD_NAME_MAP] || fieldName;
}

// Funkcja pomocnicza do określania grupy pola
function determineFieldGroup(fieldName: string): FieldGroupKey {
  // Sprawdź każdą grupę pól
  for (const [groupKey, group] of Object.entries(FIELD_GROUPS)) {
    if (group.fields.includes(fieldName)) {
      return groupKey as FieldGroupKey;
    }
  }

  // Jeśli pole nie zostało znalezione w żadnej grupie, użyj heurystyki
  const normalizedField = fieldName.toLowerCase();

  // Punkt Poboru Energii
  if (normalizedField.startsWith('dp') || 
      normalizedField === 'ppenum' || 
      normalizedField === 'meternumber' || 
      normalizedField.includes('tariff') || 
      normalizedField.includes('contract') || 
      normalizedField === 'osd_name' || 
      normalizedField === 'osd_region') {
    return 'delivery_point';
  }

  // Adres korespondencyjny
  if (normalizedField.startsWith('pa')) {
    return 'postal_address';
  }

  // Dane sprzedawcy
  if (normalizedField.startsWith('supplier')) {
    return 'supplier';
  }

  // Dane rozliczeniowe
  if (normalizedField.startsWith('billing') || 
      normalizedField.includes('invoice') || 
      normalizedField.includes('amount') || 
      normalizedField.includes('vat') || 
      normalizedField === 'currency') {
    return 'billing';
  }

  // Informacje o zużyciu
  if (normalizedField.includes('usage') || 
      normalizedField.includes('consumption') || 
      normalizedField.includes('reading')) {
    return 'consumption_info';
  }

  // Domyślnie - dane nabywcy
  return 'buyer_data';
}

async function analyzeDocument(
  client: DocumentAnalysisClient,
  file: File | Blob,
  modelId: string,
  index: number,
  sessionId: string,
  isSingleFile: boolean = false
): Promise<ProcessingResult> {
  const startTime = Date.now();
  const fileName = file instanceof File ? file.name : 'blob';
  console.log(`[${index}] Rozpoczynam analizę pliku ${fileName} modelem ${modelId}`);

  // Czasy przetwarzania
  let uploadTime = 0;
  let ocrTime = 0;

  // Sprawdź cache
  if (file instanceof File) {
    const cachedResult = cacheManager.get(file.name, modelId);
    if (cachedResult) {
      console.log(`[${index}] Znaleziono w cache: ${file.name} (zaoszczędzono ${cachedResult.processingTime}ms)`);
      
      // Wyślij informację o postępie dla pliku z cache
      if (isSingleFile) {
        sendProgress(sessionId, {
          currentFileIndex: 0,
          currentFileName: fileName,
          currentModelIndex: 0,
          currentModelId: modelId,
          fileProgress: 100,
          totalProgress: 100,
          totalFiles: 1,
          results: [cachedResult]
        });
      }
      
      return cachedResult;
    }
  }

  // Mierz czas uploadu
  const uploadStartTime = Date.now();
  const arrayBuffer = await file.arrayBuffer();
  const fileSize = Math.round(arrayBuffer.byteLength / 1024);
  uploadTime = Date.now() - uploadStartTime;
  console.log(`[${index}] Przygotowano dane do wysłania (${fileSize}KB) w ${uploadTime}ms`);
  
  // Jeśli plik jest skompresowany, rozpakuj go
  const fileData = file.type === 'application/octet-stream' 
    ? decompressData<ArrayBuffer>(new Uint8Array(arrayBuffer))
    : arrayBuffer;

  console.log(`[${index}] Wysyłam żądanie do Azure`);
  const azureStartTime = Date.now();
  
  // Dla pojedynczego pliku, użyj krótszego interwału pollowania
  const poller = await client.beginAnalyzeDocument(modelId, fileData);
  const pollingInterval = isSingleFile ? 1000 : 2000;
  
  // Mierz czas OCR (od rozpoczęcia do pierwszego poll)
  ocrTime = Date.now() - azureStartTime;
  console.log(`[${index}] Rozpoczęto przetwarzanie OCR w Azure (${ocrTime}ms)`);

  console.log(`[${index}] Rozpoczęto przetwarzanie w Azure (${Date.now() - azureStartTime}ms)`);

  // Funkcja do aktualizacji postępu podczas pollowania
  let pollCount = 0;
  const updateProgress = () => {
    if (isSingleFile) {
      pollCount++;
      // Oszacuj postęp na podstawie liczby zapytań (max 20 zapytań)
      const estimatedProgress = Math.min(95, (pollCount / 20) * 100);
      sendProgress(sessionId, {
        currentFileIndex: 0,
        currentFileName: fileName,
        currentModelIndex: 0,
        currentModelId: modelId,
        fileProgress: estimatedProgress,
        totalProgress: estimatedProgress,
        totalFiles: 1,
        results: []
      });
    }
  };
  
  // Ustaw interwał aktualizacji postępu
  const progressInterval = setInterval(updateProgress, pollingInterval);
  
  try {
    const pollOptions: PollOptions = {
      intervalInMs: pollingInterval
    };
    
    const result = await poller.pollUntilDone(pollOptions);
    
    const azureTime = Date.now() - azureStartTime;
    console.log(`[${index}] Zakończono przetwarzanie w Azure (${azureTime}ms)`);

    if (!result.documents?.[0]?.fields) {
      const emptyResult: ProcessingResult = {
        fileName: fileName,
        modelResults: [{
          modelId,
          fields: {},
          confidence: 0,
          pageCount: result.pages?.length || 1
        }],
        processingTime: Date.now() - startTime,
        uploadTime,
        ocrTime,
        analysisTime: Date.now() - (azureStartTime + ocrTime),
        mappedData: {
          metadata: {
            technicalData: {
              content: '',
              pages: result.pages?.map(page => ({
                pageNumber: page.pageNumber,
                width: page.width || 0,
                height: page.height || 0,
                unit: page.unit || 'pixel'
              }))
            }
          }
        },
        confidence: 0,
        cacheStats: {
          size: 0,
          maxSize: 1000,
          ttl: 3600
        },
        performanceStats: [{
          name: 'azure_processing',
          duration: azureTime,
          timestamp: new Date().toISOString()
        }],
        mimeType: file instanceof File ? file.type : 'application/octet-stream'
      };
      
      if (file instanceof File) {
        cacheManager.set(file.name, modelId, emptyResult);
      }
      
      return emptyResult;
    }

    const convertedFields: Record<string, DocumentField> = {};
    for (const [key, field] of Object.entries(result.documents[0].fields)) {
      if (!modelId.startsWith('prebuilt-') && (key.startsWith('_') || key === 'Locale')) {
        continue;
      }

      const mappedKey = mapFieldName(key);
      const group = determineFieldGroup(mappedKey);
      console.log(`[${index}] Mapowanie pola: ${key} -> ${mappedKey} (grupa: ${group})`);

      convertedFields[mappedKey] = {
        content: field.content || '',
        confidence: field.confidence || 0,
        metadata: {
          fieldType: field.kind || 'text',
          transformationType: 'initial',
          source: 'azure',
          group,
          originalKey: key,
          boundingRegions: field.boundingRegions?.map(region => ({
            pageNumber: region.pageNumber,
            polygon: region.polygon?.map(point => ({
              x: point.x,
              y: point.y
            })) || []
          })) || [],
          spans: field.spans || []
        }
      };
    }

    const finalResult: ProcessingResult = {
      fileName: fileName,
      modelResults: [{
        modelId,
        fields: convertedFields,
        confidence: result.documents[0].confidence,
        pageCount: result.pages?.length || 1
      }],
      processingTime: Date.now() - startTime,
      uploadTime,
      ocrTime,
      analysisTime: Date.now() - (azureStartTime + ocrTime),
      mappedData: mapDocumentAnalysisResult(result.documents[0].fields),
      confidence: result.documents[0].confidence,
      cacheStats: {
        size: 0,
        maxSize: 1000,
        ttl: 3600
      },
      performanceStats: [{
        name: 'azure_processing',
        duration: azureTime,
        timestamp: new Date().toISOString()
      }],
      mimeType: file instanceof File ? file.type : 'application/octet-stream',
      timing: {
        uploadTime,
        ocrTime,
        analysisTime: Date.now() - (azureStartTime + ocrTime),
        totalTime: Date.now() - startTime
      },
      usability: result.documents[0].confidence > 0.95
    };

    if (file instanceof File) {
      console.log(`[${index}] Zapisuję wynik do cache: ${file.name}`);
      cacheManager.set(file.name, modelId, finalResult);
    }

    return finalResult;
  } finally {
    clearInterval(progressInterval);
  }
}

// Funkcja do przetwarzania dokumentów z wieloma modelami
async function processDocumentsWithModels(
  client: DocumentAnalysisClient,
  files: File[],
  modelIds: string[],
  sessionId: string
): Promise<ProcessingResult[]> {
  console.log(`\n=== INICJALIZACJA PRZETWARZANIA WSADOWEGO ===`);
  console.log(`Sesja: ${sessionId}`);
  console.log(`Liczba plików: ${files.length}`);
  console.log(`Modele: ${modelIds.join(', ')}`);
  console.log(`Maksymalna liczba równoległych żądań: ${MAX_CONCURRENT_REQUESTS}`);
  console.log(`Timestamp rozpoczęcia: ${new Date().toISOString()}`);
  
  const results: ProcessingResult[] = [];
  const startTime = Date.now();
  
  // Przygotuj wszystkie kombinacje plik-model
  const tasks = files.flatMap((file, fileIndex) =>
    modelIds.map((modelId, modelIndex) => ({
      file,
      modelId,
      index: fileIndex * modelIds.length + modelIndex,
      fileIndex
    }))
  );

  console.log(`\nPrzygotowano ${tasks.length} zadań do przetworzenia`);
  console.log(`Szacowany czas: ${(tasks.length * 5000 / MAX_CONCURRENT_REQUESTS / 1000).toFixed(1)}s\n`);

  const totalTasks = tasks.length;
  const processedFiles = new Set<number>();
  const isSingleFile = files.length === 1;

  // Przetwarzaj zadania w grupach po MAX_CONCURRENT_REQUESTS
  for (let i = 0; i < tasks.length; i += MAX_CONCURRENT_REQUESTS) {
    const batchStartTime = Date.now();
    const batch = tasks.slice(i, i + MAX_CONCURRENT_REQUESTS);
    console.log(`\nPrzetwarzam grupę ${Math.floor(i/MAX_CONCURRENT_REQUESTS) + 1} (${batch.length} zadań)`);
    
    const batchPromises = batch.map(({ file, modelId, index, fileIndex }) => {
      // Wyślij informację o rozpoczęciu przetwarzania pliku
      const startProgress = {
        currentFileIndex: fileIndex,
        currentFileName: file.name,
        currentModelIndex: index % modelIds.length,
        currentModelId: modelId,
        fileProgress: 0,
        totalProgress: (processedFiles.size / files.length) * 100,
        totalFiles: files.length,
        results
      };
      console.log('Sending start progress:', startProgress);
      sendProgress(sessionId, startProgress);

      return analyzeDocument(client, file, modelId, index, sessionId, isSingleFile).then(result => {
        // Wyślij informację o zakończeniu przetwarzania pliku
        results.push(result);
        processedFiles.add(fileIndex);
        const endProgress = {
          currentFileIndex: fileIndex,
          currentFileName: file.name,
          currentModelIndex: index % modelIds.length,
          currentModelId: modelId,
          fileProgress: 100,
          totalProgress: (processedFiles.size / files.length) * 100,
          totalFiles: files.length,
          results
        };
        console.log('Sending end progress:', endProgress);
        sendProgress(sessionId, endProgress);
        return result;
      });
    });

    const batchResults = await Promise.all(batchPromises);
    console.log(`Zakończono grupę w ${Date.now() - batchStartTime}ms, przetworzono ${batchResults.length} plików`);
  }
  
  const totalTime = Date.now() - startTime;
  console.log(`\n=== ZAKOŃCZONO PRZETWARZANIE WSADOWE ===`);
  console.log(`Timestamp zakończenia: ${new Date().toISOString()}`);
  console.log(`Całkowity czas: ${totalTime}ms`);
  console.log(`Średni czas na zadanie: ${Math.round(totalTime / totalTasks)}ms`);
  console.log(`Liczba przetworzonych plików: ${processedFiles.size}`);
  console.log(`Średnia pewność: ${(results.reduce((sum, r) => sum + r.confidence, 0) / results.length * 100).toFixed(1)}%\n`);
  
  return results;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const modelIds = formData.getAll('modelId') as string[];
    const sessionId = formData.get('sessionId') as string;

    if (!files.length || !modelIds.length) {
      return NextResponse.json(
        { error: 'Brak plików lub ID modeli' },
        { status: 400 }
      );
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Brak ID sesji' },
        { status: 400 }
      );
    }

    const client = new DocumentAnalysisClient(
      process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT!,
      { key: process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY! }
    );

    const results = await processDocumentsWithModels(client, files, modelIds, sessionId);
    return NextResponse.json(results);

  } catch (error) {
    console.error('Error processing batch:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Błąd przetwarzania wsadu' },
      { status: 500 }
    );
  }
} 
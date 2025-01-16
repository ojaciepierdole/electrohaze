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

// Azure Document Intelligence pozwala na maksymalnie 15 równoległych żądań
const MAX_CONCURRENT_REQUESTS = 15;

// Funkcja pomocnicza do określania grupy pola
function determineFieldGroup(fieldName: string): FieldGroupKey {
  if (fieldName.startsWith('dp') || fieldName === 'ppeNum' || fieldName === 'MeterNumber' || fieldName === 'Tariff' || 
      fieldName === 'ContractNumber' || fieldName === 'ContractType' || fieldName === 'OSD_name' || fieldName === 'OSD_region') {
    return 'delivery_point';
  }
  if (fieldName.startsWith('pa')) {
    return 'postal_address';
  }
  if (fieldName.startsWith('supplier')) {
    return 'supplier';
  }
  if (fieldName.startsWith('Billing') || fieldName.includes('Usage')) {
    return 'billing';
  }
  return 'buyer_data';
}

async function analyzeDocument(
  client: DocumentAnalysisClient,
  fileData: Buffer | ArrayBuffer,
  fileName: string,
  modelId: string,
  index: number,
  sessionId: string,
  isSingleFile: boolean = false
): Promise<ProcessingResult> {
  const startTime = Date.now();
  console.log(`[${index}] Rozpoczynam analizę pliku ${fileName} modelem ${modelId}`);

  // Czasy przetwarzania
  let uploadTime = 0;
  let ocrTime = 0;

  // Sprawdź cache
  const cachedResult = cacheManager.get(fileName, modelId);
  if (cachedResult) {
    console.log(`[${index}] Znaleziono w cache: ${fileName} (zaoszczędzono ${cachedResult.processingTime}ms)`);
    
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
    
    return {
      ...cachedResult,
      processingTime: 0,
      uploadTime: 0,
      ocrTime: 0,
      analysisTime: 0
    };
  }

  // Mierz czas uploadu
  const uploadStartTime = Date.now();
  const fileSize = Math.round(fileData.byteLength / 1024);
  uploadTime = Date.now() - uploadStartTime;
  console.log(`[${index}] Przygotowano dane do wysłania (${fileSize}KB) w ${uploadTime}ms`);

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
          modelId: modelId,
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
        mimeType: 'application/pdf'
      };
      
      cacheManager.set(fileName, modelId, emptyResult);
      return emptyResult;
    }

    const fields: Record<string, ProcessedField> = {};
    const documentFields = result.documents[0].fields;
    const isCustomModel = !modelId.startsWith('prebuilt-');

    for (const [key, field] of Object.entries(documentFields)) {
      if (!isCustomModel && (key.startsWith('_') || key === 'Locale')) {
        continue;
      }

      fields[key] = {
        confidence: field.confidence || 0,
        fieldType: field.kind || 'unknown',
        content: field.content || '',
        page: field.boundingRegions?.[0]?.pageNumber || 1,
        name: key,
        type: field.kind || 'unknown',
        description: key,
        definition: {
          name: key,
          type: field.kind || 'unknown',
          isRequired: false,
          description: key,
          group: determineFieldGroup(key)
        }
      };
    }

    const convertedFields: Record<string, DocumentField> = {};
    for (const [key, field] of Object.entries(documentFields)) {
      if (!isCustomModel && (key.startsWith('_') || key === 'Locale')) {
        continue;
      }

      convertedFields[key] = {
        content: field.content || '',
        confidence: field.confidence || 0,
        kind: field.kind || 'string',
        boundingRegions: field.boundingRegions?.map(region => ({
          pageNumber: region.pageNumber,
          polygon: region.polygon?.map(point => ({
            x: point.x,
            y: point.y
          })) || []
        })) || [],
        spans: field.spans || [],
        metadata: {
          fieldType: field.kind || 'text',
          transformationType: 'initial',
          source: 'azure'
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
      mappedData: mapDocumentAnalysisResult(documentFields),
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
      mimeType: 'application/pdf'
    };

    cacheManager.set(fileName, modelId, finalResult);
    return finalResult;
  } finally {
    clearInterval(progressInterval);
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files');
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

    // Przygotuj wszystkie kombinacje plik-model
    const tasks = files.flatMap((file, fileIndex) =>
      modelIds.map((modelId, modelIndex) => ({
        file,
        modelId,
        index: fileIndex * modelIds.length + modelIndex,
        fileIndex
      }))
    );

    console.log(`\n=== INICJALIZACJA PRZETWARZANIA WSADOWEGO ===`);
    console.log(`Sesja: ${sessionId}`);
    console.log(`Liczba plików: ${files.length}`);
    console.log(`Modele: ${modelIds.join(', ')}`);
    console.log(`Maksymalna liczba równoległych żądań: ${MAX_CONCURRENT_REQUESTS}`);
    console.log(`Timestamp rozpoczęcia: ${new Date().toISOString()}`);
    
    console.log(`\nPrzygotowano ${tasks.length} zadań do przetworzenia`);
    console.log(`Szacowany czas: ${(tasks.length * 5000 / MAX_CONCURRENT_REQUESTS / 1000).toFixed(1)}s\n`);

    const results: ProcessingResult[] = [];
    const processedFiles = new Set<number>();
    const isSingleFile = files.length === 1;

    // Przetwarzaj zadania w grupach po MAX_CONCURRENT_REQUESTS
    for (let i = 0; i < tasks.length; i += MAX_CONCURRENT_REQUESTS) {
      const batchStartTime = Date.now();
      const batch = tasks.slice(i, i + MAX_CONCURRENT_REQUESTS);
      console.log(`\nPrzetwarzam grupę ${Math.floor(i/MAX_CONCURRENT_REQUESTS) + 1} (${batch.length} zadań)`);

      const batchPromises = batch.map(async ({ file, modelId, index, fileIndex }) => {
        // Wyślij informację o rozpoczęciu przetwarzania pliku
        const fileName = typeof file === 'object' && 'name' in file ? file.name : 'unknown';
        const startProgress = {
          currentFileIndex: fileIndex,
          currentFileName: fileName,
          currentModelIndex: index % modelIds.length,
          currentModelId: modelId,
          fileProgress: 0,
          totalProgress: (processedFiles.size / files.length) * 100,
          totalFiles: files.length,
          results
        };
        console.log('Sending start progress:', startProgress);
        sendProgress(sessionId, startProgress);

        // Konwertuj plik na ArrayBuffer
        let buffer: ArrayBuffer;
        if (file instanceof Blob) {
          buffer = await file.arrayBuffer();
        } else if (typeof file === 'string') {
          // Jeśli to string base64, konwertuj na ArrayBuffer
          const binaryString = Buffer.from(file, 'base64');
          buffer = binaryString.buffer.slice(
            binaryString.byteOffset,
            binaryString.byteOffset + binaryString.byteLength
          );
        } else {
          throw new Error('Nieobsługiwany format pliku');
        }

        const result = await analyzeDocument(
          client,
          buffer,
          fileName,
          modelId,
          index,
          sessionId,
          isSingleFile
        );

        // Wyślij informację o zakończeniu przetwarzania pliku
        results.push(result);
        processedFiles.add(fileIndex);
        const endProgress = {
          currentFileIndex: fileIndex,
          currentFileName: fileName,
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

      const batchResults = await Promise.all(batchPromises);
      console.log(`Zakończono grupę w ${Date.now() - batchStartTime}ms, przetworzono ${batchResults.length} plików`);
    }

    return NextResponse.json(results);

  } catch (error) {
    console.error('Error processing batch:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Błąd przetwarzania wsadu' },
      { status: 500 }
    );
  }
} 
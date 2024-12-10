import { NextResponse } from 'next/server';
import { DocumentAnalysisClient } from '@azure/ai-form-recognizer';
import type { ProcessingResult, ProcessedField } from '@/types/processing';
import { determineFieldGroup } from '@/utils/fields';
import { cacheManager } from '@/lib/cache-manager';
import { decompressData } from '@/utils/compression';

// Azure Document Intelligence pozwala na maksymalnie 15 równoległych żądań
const MAX_CONCURRENT_REQUESTS = 15;

interface AzureDocumentField {
  value: string | null;
  content?: string;
  confidence: number;
  type: string;
  boundingRegions?: Array<{
    pageNumber: number;
  }>;
}

async function analyzeDocument(
  client: DocumentAnalysisClient,
  file: File | Blob,
  modelId: string,
  index: number
): Promise<ProcessingResult> {
  const startTime = Date.now();
  console.log(`[${index}] Rozpoczynam analizę pliku ${file instanceof File ? file.name : 'blob'} modelem ${modelId}`);

  // Sprawdź cache
  if (file instanceof File) {
    const cachedResult = cacheManager.get(file.name, modelId);
    if (cachedResult) {
      console.log(`[${index}] Znaleziono w cache: ${file.name}`);
      return cachedResult;
    }
  }

  const arrayBuffer = await file.arrayBuffer();
  console.log(`[${index}] Przygotowano dane do wysłania (${Math.round(arrayBuffer.byteLength / 1024)}KB)`);
  
  // Jeśli plik jest skompresowany, rozpakuj go
  const fileData = file.type === 'application/octet-stream' 
    ? decompressData<ArrayBuffer>(new Uint8Array(arrayBuffer))
    : arrayBuffer;

  console.log(`[${index}] Wysyłam żądanie do Azure`);
  const poller = await client.beginAnalyzeDocument(modelId, fileData);
  console.log(`[${index}] Rozpoczęto przetwarzanie w Azure`);
  
  const result = await poller.pollUntilDone();
  console.log(`[${index}] Zakończono przetwarzanie w Azure (${Date.now() - startTime}ms)`);

  if (!result.documents?.[0]?.fields) {
    const emptyResult = {
      fileName: file instanceof File ? file.name : 'unknown',
      modelResults: [{
        modelId,
        fields: {},
        confidence: 0,
        pageCount: result.pages?.length || 1
      }],
      processingTime: Date.now() - startTime
    };
    
    if (file instanceof File) {
      cacheManager.set(file.name, modelId, emptyResult);
    }
    
    return emptyResult;
  }

  const fields: Record<string, ProcessedField> = {};
  const documentFields = result.documents[0].fields as Record<string, AzureDocumentField>;
  const isCustomModel = !modelId.startsWith('prebuilt-');

  for (const [key, field] of Object.entries(documentFields)) {
    if (!isCustomModel && (key.startsWith('_') || key === 'Locale')) {
      continue;
    }

    fields[key] = {
      content: field.value || field.content || null,
      confidence: field.confidence,
      type: field.type,
      page: field.boundingRegions?.[0]?.pageNumber || 1,
      definition: {
        name: key,
        type: field.type,
        isRequired: false,
        description: key,
        group: determineFieldGroup(key)
      }
    };
  }

  const finalResult = {
    fileName: file instanceof File ? file.name : 'unknown',
    modelResults: [{
      modelId,
      fields,
      confidence: result.documents[0].confidence,
      pageCount: result.pages?.length || 1
    }],
    processingTime: Date.now() - startTime
  };

  if (file instanceof File) {
    cacheManager.set(file.name, modelId, finalResult);
  }
  
  return finalResult;
}

// Funkcja do przetwarzania dokumentów z wieloma modelami
async function processDocumentsWithModels(
  client: DocumentAnalysisClient,
  files: File[],
  modelIds: string[]
): Promise<ProcessingResult[]> {
  console.log(`\n=== Rozpoczynam wsadową analizę ${files.length} plików przez ${modelIds.length} modeli ===`);
  console.log(`Maksymalna liczba równoległych żądań: ${MAX_CONCURRENT_REQUESTS}`);
  
  const results: ProcessingResult[] = [];
  const startTime = Date.now();
  
  // Przygotuj wszystkie kombinacje plik-model
  const tasks = files.flatMap((file, fileIndex) =>
    modelIds.map((modelId, modelIndex) => ({
      file,
      modelId,
      index: fileIndex * modelIds.length + modelIndex
    }))
  );
  
  // Przetwarzaj zadania w grupach po MAX_CONCURRENT_REQUESTS
  for (let i = 0; i < tasks.length; i += MAX_CONCURRENT_REQUESTS) {
    const batchStartTime = Date.now();
    const batch = tasks.slice(i, i + MAX_CONCURRENT_REQUESTS);
    console.log(`\nPrzetwarzam grupę ${Math.floor(i/MAX_CONCURRENT_REQUESTS) + 1} (${batch.length} zadań)`);
    
    const batchPromises = batch.map(({ file, modelId, index }) => 
      analyzeDocument(client, file, modelId, index)
    );
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    console.log(`Zakończono grupę w ${Date.now() - batchStartTime}ms`);
  }
  
  const totalTime = Date.now() - startTime;
  console.log(`\n=== Zakończono analizę wsadową ===`);
  console.log(`Całkowity czas: ${totalTime}ms`);
  console.log(`Średni czas na zadanie: ${Math.round(totalTime / (files.length * modelIds.length))}ms\n`);
  
  return results;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const modelIds = formData.getAll('modelId') as string[];

    if (!files.length || !modelIds.length) {
      return NextResponse.json(
        { error: 'Brak plików lub ID modeli' },
        { status: 400 }
      );
    }

    const client = new DocumentAnalysisClient(
      process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT!,
      { key: process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY! }
    );

    const results = await processDocumentsWithModels(client, files, modelIds);
    return NextResponse.json({ results });

  } catch (error) {
    console.error('Error processing batch:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Błąd przetwarzania wsadu' },
      { status: 500 }
    );
  }
} 
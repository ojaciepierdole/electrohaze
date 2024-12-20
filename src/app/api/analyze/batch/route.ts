import { NextResponse } from 'next/server';
import { DocumentAnalysisClient } from '@azure/ai-form-recognizer';
import type { 
  ProcessingResult, 
  PollOptions, 
  DocumentField,
  DocumentConfidence,
  GroupConfidence,
  DocumentFieldsMap,
  ProcessingTiming
} from '@/types/processing';
import type { FieldGroupKey } from '@/types/fields';
import { cacheManager } from '@/lib/cache-manager';
import { decompressData } from '@/utils/compression';
import { sendProgress } from '@/lib/progress-emitter';
import { FIELD_GROUPS } from '@/config/fields';

// Azure Document Intelligence pozwala na maksymalnie 15 równoległych żądań
const MAX_CONCURRENT_REQUESTS = 15;

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

// Funkcja pomocnicza do obliczania pewności dokumentu
function calculateDocumentConfidence(fields: Record<string, DocumentField>): DocumentConfidence {
  const groups: Record<string, { 
    required: Array<[string, DocumentField]>,
    optional: Array<[string, DocumentField]>
  }> = {};

  // Grupuj pola według ich grup
  for (const [fieldName, field] of Object.entries(fields)) {
    const group = determineFieldGroup(fieldName);
    if (!groups[group]) {
      groups[group] = { required: [], optional: [] };
    }
    
    // Sprawdź czy pole jest wymagane na podstawie konfiguracji
    const isRequired = FIELD_GROUPS[group]?.requiredFields.includes(fieldName) || false;
    if (isRequired) {
      groups[group].required.push([fieldName, field]);
    } else {
      groups[group].optional.push([fieldName, field]);
    }
  }

  // Oblicz pewność dla każdej grupy
  const groupConfidences = Object.entries(groups).reduce((acc, [groupKey, group]) => {
    const filledRequired = group.required.filter(([_, field]) => field.content).length;
    const filledOptional = group.optional.filter(([_, field]) => field.content).length;
    
    const totalRequired = group.required.length;
    const totalOptional = group.optional.length;
    
    // Oblicz średnią pewność dla wypełnionych pól
    const filledFields = [...group.required, ...group.optional]
      .filter(([_, field]) => field.content);
    
    const avgConfidence = filledFields.length > 0
      ? filledFields.reduce((sum, [_, field]) => sum + field.confidence, 0) / filledFields.length
      : 0;

    // Oblicz kompletność jako stosunek wypełnionych pól wymaganych do wszystkich wymaganych
    const completeness = totalRequired > 0 
      ? filledRequired / totalRequired 
      : 1;

    acc[groupKey as FieldGroupKey] = {
      completeness,
      confidence: avgConfidence,
      filledRequired,
      totalRequired,
      filledOptional,
      totalOptional
    };

    return acc;
  }, {} as Record<FieldGroupKey, GroupConfidence>);

  // Oblicz średnią pewność dla całego dokumentu
  const allFilledFields = Object.values(fields).filter(field => field.content);
  const documentConfidence = allFilledFields.length > 0
    ? allFilledFields.reduce((sum, field) => sum + field.confidence, 0) / allFilledFields.length
    : 0;

  return {
    overall: documentConfidence,
    confidence: documentConfidence,
    groups: groupConfidences
  };
}

// Funkcja pomocnicza do mapowania pól na grupy
function mapFieldsToGroups(fields: Record<string, DocumentField>): DocumentFieldsMap {
  const result: DocumentFieldsMap = {
    delivery_point: {},
    ppe: {},
    postal_address: {},
    buyer_data: {},
    supplier: {},
    consumption_info: {},
    billing: {}
  };

  for (const [fieldName, field] of Object.entries(fields)) {
    const group = determineFieldGroup(fieldName);
    result[group][fieldName] = {
      content: field.content,
      confidence: field.confidence,
      kind: field.kind,
      value: field.value,
      metadata: field.metadata
    };
  }

  return result;
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
  let analysisTime = 0;

  // Sprawdź cache
  if (file instanceof File) {
    const cachedResult = cacheManager.get(file.name, modelId);
    if (cachedResult) {
      console.log(`[${index}] Znaleziono w cache: ${file.name} (zaoszczędzono ${cachedResult.timing.total}ms)`);
      
      // Wyślij informację o postępie dla pliku z cache
      if (isSingleFile) {
        sendProgress(sessionId, {
          currentFileIndex: 0,
          currentFileName: fileName,
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
    analysisTime = Date.now() - (azureStartTime + ocrTime);
    
    const azureTime = Date.now() - azureStartTime;
    console.log(`[${index}] Zakończono przetwarzanie w Azure (${azureTime}ms)`);

    if (!result.documents?.[0]?.fields) {
      throw new Error('Nie znaleziono pól w dokumencie');
    }

    const fields = result.documents[0].fields;
    const documentConfidence = calculateDocumentConfidence(fields as Record<string, DocumentField>);
    const mappedData = mapFieldsToGroups(fields as Record<string, DocumentField>);

    const timing: ProcessingTiming = {
      upload: uploadTime,
      ocr: ocrTime,
      analysis: analysisTime,
      total: Date.now() - startTime
    };

    const processingResult: ProcessingResult = {
      fileName,
      timing,
      documentConfidence,
      usability: documentConfidence.confidence,
      status: 'success',
      mappedData
    };

    // Zapisz wynik do cache
    if (file instanceof File) {
      cacheManager.set(file.name, modelId, processingResult);
    }

    return processingResult;
  } catch (error) {
    console.error(`[${index}] Błąd podczas przetwarzania pliku ${fileName}:`, error);
    return {
      fileName,
      timing: {
        upload: uploadTime,
        ocr: ocrTime,
        analysis: analysisTime,
        total: Date.now() - startTime
      },
      documentConfidence: {
        overall: 0,
        confidence: 0,
        groups: {
          delivery_point: { completeness: 0, confidence: 0, filledRequired: 0, totalRequired: 0, filledOptional: 0, totalOptional: 0 },
          ppe: { completeness: 0, confidence: 0, filledRequired: 0, totalRequired: 0, filledOptional: 0, totalOptional: 0 },
          postal_address: { completeness: 0, confidence: 0, filledRequired: 0, totalRequired: 0, filledOptional: 0, totalOptional: 0 },
          buyer_data: { completeness: 0, confidence: 0, filledRequired: 0, totalRequired: 0, filledOptional: 0, totalOptional: 0 },
          supplier: { completeness: 0, confidence: 0, filledRequired: 0, totalRequired: 0, filledOptional: 0, totalOptional: 0 },
          consumption_info: { completeness: 0, confidence: 0, filledRequired: 0, totalRequired: 0, filledOptional: 0, totalOptional: 0 },
          billing: { completeness: 0, confidence: 0, filledRequired: 0, totalRequired: 0, filledOptional: 0, totalOptional: 0 }
        }
      },
      usability: 0,
      status: 'error',
      error: error instanceof Error ? error.message : 'Nieznany błąd',
      mappedData: {
        delivery_point: {},
        ppe: {},
        postal_address: {},
        buyer_data: {},
        supplier: {},
        consumption_info: {},
        billing: {}
      }
    };
  } finally {
    clearInterval(progressInterval);
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const modelId = formData.get('modelId') as string;
    const sessionId = formData.get('sessionId') as string;

    if (!files.length || !modelId) {
      return NextResponse.json(
        { error: 'Brak plików lub identyfikatora modelu' },
        { status: 400 }
      );
    }

    // Sprawdź czy mamy dostęp do Azure Document Intelligence
    const endpoint = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT;
    const key = process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY;

    if (!endpoint || !key) {
      return NextResponse.json(
        { error: 'Brak konfiguracji Azure Document Intelligence' },
        { status: 500 }
      );
    }

    const client = new DocumentAnalysisClient(endpoint, { key });
    const isSingleFile = files.length === 1;

    // Przetwarzaj pliki równolegle, ale nie więcej niż MAX_CONCURRENT_REQUESTS na raz
    const results: ProcessingResult[] = [];
    for (let i = 0; i < files.length; i += MAX_CONCURRENT_REQUESTS) {
      const batch = files.slice(i, i + MAX_CONCURRENT_REQUESTS);
      const batchResults = await Promise.all(
        batch.map((file, index) => 
          analyzeDocument(client, file, modelId, i + index, sessionId, isSingleFile)
        )
      );
      results.push(...batchResults);

      // Wyślij informację o postępie
      if (!isSingleFile) {
        const progress = Math.round(((i + batch.length) / files.length) * 100);
        sendProgress(sessionId, {
          currentFileIndex: i + batch.length,
          currentFileName: batch[batch.length - 1].name,
          currentModelId: modelId,
          fileProgress: progress,
          totalProgress: progress,
          totalFiles: files.length,
          results
        });
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Błąd podczas przetwarzania żądania:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Nieznany błąd' },
      { status: 500 }
    );
  }
} 
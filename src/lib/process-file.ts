import { DocumentAnalysisClient } from '@azure/ai-form-recognizer';
import { AzureKeyCredential } from '@azure/core-auth';
import type { DocumentFieldsMap, ProcessingResult, ProcessedDocumentField, DocumentField } from '@/types/processing';
import { convertField } from '@/utils/document-conversion';
import { mapDocumentFields } from '@/utils/document-mapping';
import { determineFieldGroup } from '@/utils/processing';
import { Logger } from '@/lib/logger';
import { cacheManager } from '@/lib/cache-manager';
import { updateSessionState } from '@/app/api/analyze/progress/route';

const logger = Logger.getInstance();

export async function processFile(
  input: File | Buffer | ArrayBuffer,
  fileName: string,
  modelId: string,
  sessionId?: string
): Promise<ProcessingResult> {
  const endpoint = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT;
  const key = process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY;

  if (!endpoint || !key) {
    throw new Error('Brak konfiguracji Azure Document Intelligence');
  }

  const client = new DocumentAnalysisClient(
    endpoint,
    new AzureKeyCredential(key)
  );

  // Sprawdź cache przed rozpoczęciem przetwarzania
  if (sessionId) {
    const cachedResult = await cacheManager.get(fileName, modelId, sessionId);
    if (cachedResult) {
      logger.info('Znaleziono wynik w cache', { fileName, modelId });
      return cachedResult;
    }
  }

  // Przygotuj dane do wysłania
  let data: Buffer | ArrayBuffer;
  if (input instanceof Buffer) {
    data = input;
  } else if (input instanceof ArrayBuffer) {
    data = input;
  } else if ('arrayBuffer' in input) {
    data = await input.arrayBuffer();
  } else {
    throw new Error('Nieprawidłowy typ wejściowy');
  }

  // Aktualizuj stan - rozpoczęcie przetwarzania
  if (sessionId) {
    logger.info('Aktualizacja stanu - rozpoczęcie przetwarzania', { 
      sessionId,
      fileName,
      modelId
    });
    updateSessionState(sessionId, {
      status: 'processing',
      progress: 10
    });
  }

  try {
    // Wyślij żądanie do Azure
    const poller = await client.beginAnalyzeDocument(modelId, data);

    // Aktualizuj stan - rozpoczęcie analizy
    if (sessionId) {
      logger.info('Aktualizacja stanu - rozpoczęcie analizy', { 
        sessionId,
        fileName,
        modelId,
        progress: 30
      });
      updateSessionState(sessionId, {
        status: 'processing',
        progress: 30
      });
    }

    const analysisResult = await poller.pollUntilDone();

    // Aktualizuj stan - zakończenie analizy
    if (sessionId) {
      logger.info('Aktualizacja stanu - zakończenie analizy', { 
        sessionId,
        fileName,
        modelId,
        progress: 60
      });
      updateSessionState(sessionId, {
        status: 'processing',
        progress: 60
      });
    }

    if (!analysisResult.documents?.[0]?.fields) {
      throw new Error('Nie znaleziono pól w dokumencie');
    }

    // Konwertuj pola z Azure na nasz format
    const processedFields = Object.entries(analysisResult.documents[0].fields).reduce<Record<string, ProcessedDocumentField>>(
      (acc, [key, field]) => {
        if (field) {
          acc[key] = {
            content: String(field.content || ''),
            confidence: field.confidence || 0,
            value: field.content || null,
            metadata: {
              fieldType: 'string',
              transformationType: 'initial',
              source: 'azure',
              confidence: field.confidence || 0,
              boundingRegions: [],
              spans: []
            }
          };
        }
        return acc;
      },
      {}
    );

    // Konwertuj pola do formatu DocumentField
    const documentFields: Record<string, DocumentField> = {};
    for (const [key, field] of Object.entries(processedFields)) {
      documentFields[key] = {
        content: field.content,
        confidence: field.confidence,
        boundingBox: field.metadata.boundingRegions?.[0]?.polygon.flatMap(point => [point.x, point.y]) ?? []
      };
    }

    // Grupuj pola według ich typu
    const fields: DocumentFieldsMap = {
      delivery_point: {},
      ppe: {},
      postal_address: {},
      buyer_data: {},
      supplier: {},
      consumption_info: {},
      billing: {}
    };

    // Przypisz pola do odpowiednich grup
    for (const [key, field] of Object.entries(documentFields)) {
      const group = determineFieldGroup(key);
      fields[group][key] = field;
    }

    // Mapuj pola do odpowiednich grup
    const mappedData = mapDocumentFields(fields);

    // Oblicz średnią pewność
    const confidences = Object.values(documentFields).map(field => field.confidence);
    const confidence = confidences.length > 0
      ? confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length
      : 0;

    const startTime = Date.now();
    const endTime = Date.now();

    const processingResult: ProcessingResult = {
      fileName,
      modelId,
      status: 'success',
      progress: 100,
      confidence,
      fields,
      mappedData,
      timing: {
        start: startTime,
        end: endTime,
        total: endTime - startTime,
        ocr: 0
      },
      stats: {
        averageConfidence: confidence,
        confidenceRanges: {
          high: Object.values(documentFields).filter(field => field.confidence > 0.9).length,
          medium: Object.values(documentFields).filter(field => field.confidence > 0.7 && field.confidence <= 0.9).length,
          low: Object.values(documentFields).filter(field => field.confidence <= 0.7).length
        },
        processingTime: endTime - startTime,
        mimeType: 'application/pdf', // TODO: Dodać wykrywanie MIME type
        totalFields: Object.keys(documentFields).length
      }
    };

    // Zapisz wynik do cache'u
    if (sessionId) {
      await cacheManager.set(fileName, modelId, processingResult, sessionId);
      logger.info('Zapisano wynik w cache', { fileName, modelId, sessionId });

      // Aktualizuj stan - zakończenie przetwarzania
      updateSessionState(sessionId, {
        status: 'success',
        progress: 100
      });
    }

    return processingResult;

  } catch (error) {
    logger.error('Błąd podczas przetwarzania pliku', { error, fileName, modelId });

    const startTime = Date.now();
    const endTime = Date.now();

    const errorResult: ProcessingResult = {
      fileName,
      modelId,
      status: 'error',
      progress: 0,
      confidence: 0,
      fields: {},
      mappedData: {},
      timing: {
        start: startTime,
        end: endTime,
        total: endTime - startTime,
        ocr: 0
      },
      stats: {
        averageConfidence: 0,
        confidenceRanges: {
          high: 0,
          medium: 0,
          low: 0
        },
        processingTime: endTime - startTime,
        mimeType: 'application/pdf', // TODO: Dodać wykrywanie MIME type
        totalFields: 0
      },
      error: error instanceof Error ? error.message : String(error)
    };

    // Zapisz błąd w cache
    if (sessionId) {
      await cacheManager.set(fileName, modelId, errorResult, sessionId);
      logger.info('Zapisano błąd w cache', { fileName, modelId, sessionId });

      updateSessionState(sessionId, {
        status: 'error',
        error: 'Wystąpił błąd podczas przetwarzania pliku'
      });
    }

    return errorResult;
  }
} 
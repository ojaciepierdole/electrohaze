import { DocumentAnalysisClient } from '@azure/ai-form-recognizer';
import { AzureKeyCredential } from '@azure/core-auth';
import type { DocumentFieldsMap, ProcessingResult } from '@/types/processing';
import { convertField } from '@/utils/document-conversion';
import { mapDocumentFields } from '@/utils/document-mapping';
import { updateSessionState } from '@/app/api/analyze/progress/route';
import { Logger } from '@/lib/logger';

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
      updateSessionState(sessionId, {
        status: 'processing',
        progress: 30
      });
    }

    const result = await poller.pollUntilDone();

    // Aktualizuj stan - zakończenie analizy
    if (sessionId) {
      updateSessionState(sessionId, {
        status: 'processing',
        progress: 60
      });
    }

    if (!result.documents?.[0]?.fields) {
      throw new Error('Nie znaleziono pól w dokumencie');
    }

    // Konwertuj pola z Azure na nasz format
    const fields = Object.entries(result.documents[0].fields).reduce<Record<string, any>>(
      (acc, [key, field]) => {
        if (field) {
          acc[key] = convertField(
            String(field.content || ''),
            field.confidence || 0,
            'string',
            'initial',
            'azure'
          );
        }
        return acc;
      },
      {}
    );

    // Mapuj pola do odpowiednich grup
    const mappedData = mapDocumentFields(fields);

    // Oblicz średnią pewność
    const confidences = Object.values(fields).map(field => field.confidence);
    const confidence = confidences.length > 0
      ? confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length
      : 0;

    // Aktualizuj stan - zakończenie przetwarzania
    if (sessionId) {
      updateSessionState(sessionId, {
        status: 'success',
        progress: 100
      });
    }

    return {
      fileName,
      modelId,
      status: 'success',
      progress: 100,
      confidence,
      mappedData,
      timing: {
        start: Date.now(),
        end: Date.now(),
        total: 0,
        ocr: 0
      }
    };

  } catch (error) {
    logger.error('Błąd podczas przetwarzania pliku', { error, fileName, modelId });

    // Aktualizuj stan - błąd przetwarzania
    if (sessionId) {
      updateSessionState(sessionId, {
        status: 'error',
        error: 'Wystąpił błąd podczas przetwarzania pliku'
      });
    }

    throw error;
  }
} 
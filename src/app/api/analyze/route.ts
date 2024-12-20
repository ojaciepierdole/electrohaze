import { NextRequest, NextResponse } from 'next/server';
import { DocumentAnalysisClient } from '@azure/ai-form-recognizer';
import { AzureKeyCredential } from '@azure/core-auth';
import { Logger } from '@/lib/logger';
import { convertField } from '@/utils/document-conversion';
import { mapDocumentFields } from '@/utils/document-mapping';
import type { DocumentFieldsMap } from '@/types/processing';

const logger = Logger.getInstance();

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const modelId = formData.get('modelId') as string;

    if (!file || !modelId) {
      return NextResponse.json(
        { error: 'Brak pliku lub identyfikatora modelu' },
        { status: 400 }
      );
    }

    const endpoint = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT;
    const key = process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY;

    if (!endpoint || !key) {
      return NextResponse.json(
        { error: 'Brak konfiguracji Azure Document Intelligence' },
        { status: 500 }
      );
    }

    const client = new DocumentAnalysisClient(
      endpoint,
      new AzureKeyCredential(key)
    );

    // Przygotuj dane do wysłania
    const arrayBuffer = await file.arrayBuffer();

    // Wyślij żądanie do Azure
    const poller = await client.beginAnalyzeDocument(modelId, arrayBuffer);
    const result = await poller.pollUntilDone();

    if (!result.documents?.[0]?.fields) {
      return NextResponse.json(
        { error: 'Nie znaleziono pól w dokumencie' },
        { status: 400 }
      );
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
    const mappedFields = mapDocumentFields(fields);

    // Oblicz średnią pewność
    const confidences = Object.values(fields).map(field => field.confidence);
    const confidence = confidences.length > 0
      ? confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length
      : 0;

    return NextResponse.json({
      fields: mappedFields,
      confidence,
      timing: {
        start: Date.now(),
        end: Date.now(),
        total: 0
      }
    });

  } catch (error) {
    logger.error('Błąd podczas analizy dokumentu:', { error });
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas przetwarzania dokumentu' },
      { status: 500 }
    );
  }
} 
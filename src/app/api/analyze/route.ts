import { NextResponse } from 'next/server';
import { DocumentAnalysisClient } from '@azure/ai-form-recognizer';
import type { ProcessingResult, ProcessedField } from '@/types/processing';

interface AzureField {
  content: string | null;
  confidence: number;
  type: string;
  boundingRegions?: Array<{
    pageNumber: number;
  }>;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const modelId = formData.get('modelId') as string;

    if (!file || !modelId) {
      return NextResponse.json({ error: 'Brak pliku lub ID modelu' }, { status: 400 });
    }

    // Utwórz klienta Azure Document Intelligence
    const client = new DocumentAnalysisClient(
      process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT!,
      { key: process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY! }
    );

    // Konwertuj plik na ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Analizuj dokument jednym modelem
    const poller = await client.beginAnalyzeDocument(modelId, arrayBuffer);
    const result = await poller.pollUntilDone();

    // Konwertuj pola do wymaganego formatu
    const fields: Record<string, ProcessedField> = {};
    for (const [key, field] of Object.entries(result.fields || {})) {
      const azureField = field as AzureField;
      fields[key] = {
        content: azureField.content || null,
        confidence: azureField.confidence || 0,
        type: azureField.type || 'unknown',
        page: azureField.boundingRegions?.[0]?.pageNumber || 1
      };
    }

    const processingResult: ProcessingResult = {
      fileName: file.name,
      results: [{
        modelId,
        fields,
        confidence: result.confidence || 0,
        pageCount: result.pages?.length || 1
      }],
      processingTime: Date.now()
    };

    return NextResponse.json(processingResult);

  } catch (error) {
    console.error('Error processing document:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Błąd przetwarzania dokumentu' },
      { status: 500 }
    );
  }
} 
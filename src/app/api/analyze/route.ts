import { NextResponse } from 'next/server';
import { DocumentAnalysisClient } from '@azure/ai-form-recognizer';
import type { ProcessingResult, ProcessedField } from '@/types/processing';

interface AzureField {
  value: string | null;
  confidence: number;
  type: string;
  boundingRegions?: Array<{
    pageNumber: number;
  }>;
  content?: string;
}

interface AzureAnalyzeResponse {
  documents: Array<{
    docType: string;
    fields: Record<string, AzureField>;
    confidence: number;
  }>;
  pages: Array<{
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

    // Sprawdź czy to model niestandardowy
    const isCustomModel = !modelId.startsWith('prebuilt-');
    console.log(`\n=== Rozpoczynam analizę pliku ${file.name} ${isCustomModel ? 'modelem niestandardowym' : 'modelem wbudowanym'} ${modelId} ===`);

    const client = new DocumentAnalysisClient(
      process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT!,
      { key: process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY! }
    );

    const arrayBuffer = await file.arrayBuffer();
    const poller = await client.beginAnalyzeDocument(modelId, arrayBuffer);
    const result = await poller.pollUntilDone() as AzureAnalyzeResponse;

    if (!result.documents?.[0]?.fields) {
      console.log('\nUWAGA: Brak pól w odpowiedzi z Azure!');
      return NextResponse.json({
        fileName: file.name,
        results: [{
          modelId,
          fields: {},
          confidence: 0,
          pageCount: result.pages?.length || 1
        }],
        processingTime: Date.now()
      });
    }

    // Konwertuj pola do wymaganego formatu
    const fields: Record<string, ProcessedField> = {};
    const documentFields = result.documents[0].fields;

    console.log('\nWykryte pola:');
    for (const [key, field] of Object.entries(documentFields)) {
      // Dla modeli niestandardowych wyświetlamy wszystkie pola
      // Dla modeli wbudowanych pomijamy pola systemowe
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
          description: key
        }
      };

      // Loguj informacje o polu
      console.log(`- ${key}: ${field.value || field.content || '(puste)'}`);
      console.log(`  Pewność: ${(field.confidence * 100).toFixed(1)}%`);
      console.log(`  Typ: ${field.type}`);
      if (field.boundingRegions) {
        console.log(`  Strona: ${field.boundingRegions[0].pageNumber}`);
      }
    }

    const processingResult: ProcessingResult = {
      fileName: file.name,
      results: [{
        modelId,
        fields,
        confidence: result.documents[0].confidence,
        pageCount: result.pages?.length || 1
      }],
      processingTime: Date.now()
    };

    console.log(`\nŚrednia pewność: ${(result.documents[0].confidence * 100).toFixed(1)}%`);
    console.log('=== Koniec analizy ===\n');

    return NextResponse.json(processingResult);

  } catch (error) {
    console.error('Error processing document:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Błąd przetwarzania dokumentu' },
      { status: 500 }
    );
  }
} 
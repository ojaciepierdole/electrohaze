import { NextResponse } from 'next/server';
import { DocumentIntelligenceModel, DocumentIntelligenceResponse } from '@/types/documentIntelligence';

export async function GET() {
  try {
    console.log('Pobieranie modeli z Azure...');
    
    if (!process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT || !process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY) {
      throw new Error('Brak wymaganych zmiennych środowiskowych');
    }

    const endpoint = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT.replace(/\/$/, '');
    const apiVersion = '2023-07-31';
    const url = `${endpoint}/formrecognizer/documentModels?includeModelVersions=true&api-version=${apiVersion}`;

    console.log('Wywołuję URL:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Ocp-Apim-Subscription-Key': process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Szczegóły błędu:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }

    const data = await response.json();
    console.log('Odpowiedź z Azure:', data);

    const modelList: DocumentIntelligenceModel[] = (data.models || data.value || [])
      .filter((model: any) => !model.modelId.startsWith('prebuilt-'))
      .map((model: any) => ({
        modelId: model.modelId || model.id,
        description: model.description || `Model ${model.modelId || model.id}`,
        createdOn: model.createdDateTime ? new Date(model.createdDateTime) : new Date()
      }));

    if (modelList.length === 0) {
      console.warn('Nie znaleziono żadnych custom modeli');
      return NextResponse.json(
        { error: 'Nie znaleziono żadnych custom modeli' },
        { status: 404 }
      );
    }

    console.log('Pobrano modele:', modelList);
    return NextResponse.json(modelList);
  } catch (error) {
    console.error('Błąd podczas pobierania modeli:', error);
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas pobierania modeli: ' + (error as Error).message },
      { status: 500 }
    );
  }
} 
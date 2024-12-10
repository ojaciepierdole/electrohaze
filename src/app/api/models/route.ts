import { NextResponse } from 'next/server';
import type { ModelDefinition } from '@/types/processing';

export async function GET() {
  try {
    // Lista predefiniowanych modeli do analizy faktur
    const predefinedModels: ModelDefinition[] = [
      {
        id: 'prebuilt-invoice',
        name: 'Faktury (ogólny)',
        description: 'Model do analizy standardowych faktur',
        fields: []
      },
      {
        id: 'prebuilt-invoice.energy',
        name: 'Faktury energetyczne',
        description: 'Model zoptymalizowany pod faktury za energię',
        fields: []
      }
    ];

    // Pobierz listę dostępnych modeli z Azure
    if (!process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT || !process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY) {
      throw new Error('Brak wymaganych zmiennych środowiskowych');
    }

    const endpoint = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT.replace(/\/$/, '');
    const url = `${endpoint}/formrecognizer/documentModels?api-version=2023-07-31`;

    console.log('Pobieranie modeli z:', url);

    const response = await fetch(url, {
      headers: {
        'Ocp-Apim-Subscription-Key': process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Szczegóły błędu:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        url
      });
      throw new Error(`Błąd pobierania modeli: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Odpowiedź z Azure:', JSON.stringify(data, null, 2));

    // Mapuj modele z Azure
    const azureModels = (data.value || [])
      .filter((model: any) => {
        // Pobierz tylko custom modele (nie prebuilt) i aktywne
        const isPrebuilt = model.modelId?.toLowerCase().startsWith('prebuilt-');
        const isActive = model.expirationDateTime ? new Date(model.expirationDateTime) > new Date() : true;
        return !isPrebuilt && isActive;
      })
      .map((model: any) => ({
        id: model.modelId,
        name: model.description || model.modelId.split('-')[0],
        description: model.description || `Model ${model.modelId}`,
        fields: []
      }));

    console.log('Znalezione modele z Azure:', azureModels);

    // Połącz predefiniowane modele z modelami z Azure
    const allModels = [...predefinedModels, ...azureModels];
    
    console.log('Wszystkie dostępne modele:', allModels);
    return NextResponse.json(allModels);

  } catch (error) {
    console.error('Błąd podczas pobierania modeli:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Nie udało się pobrać listy modeli' },
      { status: 500 }
    );
  }
} 
import { NextResponse } from 'next/server';
import type { ModelDefinition, FieldGroupKey } from '@/types/processing';

export async function GET() {
  try {
    if (!process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT || !process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY) {
      throw new Error('Brak wymaganych zmiennych środowiskowych');
    }

    const endpoint = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT.replace(/\/$/, '');
    const apiVersion = '2023-10-31-preview';
    const headers = {
      'Ocp-Apim-Subscription-Key': process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY,
      'Content-Type': 'application/json'
    };

    console.log('Pobieranie listy modeli...');

    // Pobierz listę modeli
    const listModelsUrl = `${endpoint}/documentintelligence/documentModels?api-version=${apiVersion}`;
    console.log('URL:', listModelsUrl);
    
    const listModelsResponse = await fetch(listModelsUrl, { headers });
    const responseText = await listModelsResponse.text();
    console.log('Response:', {
      status: listModelsResponse.status,
      statusText: listModelsResponse.statusText,
      headers: Object.fromEntries(listModelsResponse.headers.entries()),
      body: responseText
    });

    if (!listModelsResponse.ok) {
      throw new Error(`Błąd pobierania listy modeli: ${listModelsResponse.statusText}\nBody: ${responseText}`);
    }

    const { value: modelsList } = JSON.parse(responseText);
    
    // Filtruj tylko modele niestandardowe
    const customModels = modelsList.filter((model: any) => !model.modelId.startsWith('prebuilt-'));
    console.log('Lista modeli niestandardowych:', customModels);

    // Pobierz szczegóły każdego modelu
    const models = await Promise.all(customModels.map(async (model: any) => {
      try {
        const modelUrl = `${endpoint}/documentintelligence/documentModels/${model.modelId}?api-version=${apiVersion}`;
        console.log(`Pobieranie szczegółów modelu ${model.modelId} z:`, modelUrl);
        
        const modelResponse = await fetch(modelUrl, { headers });
        const modelResponseText = await modelResponse.text();
        
        if (!modelResponse.ok) {
          throw new Error(`Błąd pobierania szczegółów modelu: ${modelResponse.statusText}\nBody: ${modelResponseText}`);
        }

        const modelDetails = JSON.parse(modelResponseText);
        console.log(`Szczegóły modelu ${model.modelId}:`, modelDetails);

        // Konwertuj pola modelu na nasz format
        const fields = Object.entries(modelDetails.properties?.fieldSchema || {}).map(([name, schema]: [string, any]) => ({
          name,
          type: schema.type || 'string',
          isRequired: schema.isRequired || false,
          description: schema.description || name,
          group: determineFieldGroup(name)
        }));

        return {
          id: model.modelId,
          name: model.description || model.modelId,
          description: modelDetails.description || `Model ID: ${model.modelId}`,
          fields
        };
      } catch (err) {
        console.warn(`Nie udało się pobrać szczegółów modelu ${model.modelId}:`, err);
        return {
          id: model.modelId,
          name: model.description || model.modelId,
          description: `Model ID: ${model.modelId}`,
          fields: []
        };
      }
    }));

    console.log('Znalezione modele:', models);
    return NextResponse.json(models);

  } catch (error) {
    console.error('Błąd podczas pobierania modeli:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Błąd pobierania modeli' },
      { status: 500 }
    );
  }
}

function determineFieldGroup(fieldName: string): FieldGroupKey {
  const fieldNameLower = fieldName.toLowerCase();
  
  // Dane faktury
  if (fieldNameLower.includes('invoice') || 
      fieldNameLower.includes('amount') ||
      fieldNameLower.includes('bill') ||
      fieldNameLower.includes('billing') ||
      fieldNameLower.includes('breakdown')) {
    return 'invoice_data';
  }

  // Dane sprzedawcy
  if (fieldNameLower.includes('supplier') || 
      fieldNameLower.includes('vendor') ||
      fieldNameLower.includes('osd_') ||
      fieldNameLower === 'businessname') {
    return 'supplier_data';
  }

  // Dane klienta
  if (fieldNameLower.includes('customer') || 
      fieldNameLower === 'firstname' ||
      fieldNameLower === 'lastname' ||
      fieldNameLower === 'taxid') {
    return 'customer_data';
  }

  // Adres korespondencyjny
  if (fieldNameLower.startsWith('postal') || 
      fieldNameLower.includes('correspondence')) {
    return 'postal_address';
  }

  // Punkt poboru
  if (fieldNameLower.includes('ppe') || 
      fieldNameLower.includes('meter') ||
      fieldNameLower === 'tariff' ||
      fieldNameLower.startsWith('delivery')) {
    return 'delivery_point';
  }

  // Dane zużycia
  if (fieldNameLower.includes('consumption') || 
      fieldNameLower.includes('usage') ||
      fieldNameLower.includes('billed') ||
      fieldNameLower.includes('reading') ||
      fieldNameLower.includes('zużycie')) {
    return 'consumption_data';
  }

  // Dane produktu
  if (fieldNameLower.includes('product') ||
      fieldNameLower.includes('sale')) {
    return 'product_data';
  }
  
  return 'invoice_data'; // domyślna grupa
} 
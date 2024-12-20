import { NextResponse } from 'next/server';
import type { ModelDefinition } from '@/types/processing';
import type { FieldGroupKey } from '@/types/fields';

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
    console.log('Endpoint:', endpoint);

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
    const customModels = modelsList.filter((model: any) => {
      const isCustom = !model.modelId.startsWith('prebuilt-');
      console.log(`Model ${model.modelId}: isCustom=${isCustom}`);
      return isCustom;
    });
    
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
          fields,
          version: modelDetails.version || '1.0',
          isCustom: true,
          status: 'ready'
        };
      } catch (err) {
        console.warn(`Nie udało się pobrać szczegółów modelu ${model.modelId}:`, err);
        return {
          id: model.modelId,
          name: model.description || model.modelId,
          description: `Model ID: ${model.modelId}`,
          fields: [],
          version: '1.0',
          isCustom: true,
          status: 'ready'
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
  
  // Punkt poboru energii
  if (fieldNameLower.includes('ppe') ||
      fieldNameLower.includes('meter') ||
      fieldNameLower.includes('delivery') ||
      fieldNameLower === 'street' ||
      fieldNameLower === 'building' ||
      fieldNameLower === 'unit' ||
      fieldNameLower === 'city' ||
      fieldNameLower === 'postalcode') {
    return 'delivery_point';
  }

  // Dane nabywcy
  if (fieldNameLower.includes('customer') ||
      fieldNameLower.includes('business') ||
      fieldNameLower.includes('taxid') ||
      fieldNameLower.includes('supplier') || 
      fieldNameLower.includes('vendor') ||
      fieldNameLower.includes('osd_')) {
    return 'buyer_data';
  }

  // Adres korespondencyjny
  if (fieldNameLower.startsWith('pa') || 
      fieldNameLower.includes('correspondence') ||
      fieldNameLower.includes('payer')) {
    return 'postal_address';
  }

  // Informacje o zużyciu
  if (fieldNameLower.includes('consumption') ||
      fieldNameLower.includes('usage') ||
      fieldNameLower.includes('reading') ||
      fieldNameLower.includes('billing') ||
      fieldNameLower.includes('period') ||
      fieldNameLower.includes('product') ||
      fieldNameLower.includes('tariff') ||
      fieldNameLower.includes('sale') ||
      fieldNameLower.includes('invoice') ||
      fieldNameLower.includes('amount') ||
      fieldNameLower.includes('vat') ||
      fieldNameLower.includes('net') ||
      fieldNameLower.includes('total') ||
      fieldNameLower.includes('currency') ||
      fieldNameLower.includes('date')) {
    return 'consumption_info';
  }

  // Domyślnie zwracamy dane nabywcy
  return 'buyer_data';
} 
import { NextResponse } from 'next/server';
import type { AnalysisField, FieldGroupKey } from '@/types/processing';
import { FIELD_GROUPS } from '@/config/fields';

export async function GET(
  request: Request,
  { params }: { params: { modelId: string } }
) {
  try {
    const { modelId } = params;
    
    if (!modelId) {
      throw new Error('Nie podano ID modelu');
    }

    // Dla predefiniowanych modeli zwracamy predefiniowane pola
    if (modelId.startsWith('prebuilt-')) {
      const fields: AnalysisField[] = [];
      
      for (const [groupKey, group] of Object.entries(FIELD_GROUPS)) {
        const groupFields = [...group.fields] as string[];
        for (const field of groupFields) {
          fields.push({
            name: field,
            type: 'string',
            isRequired: (group.requiredFields as readonly string[]).includes(field),
            description: field,
            group: groupKey as FieldGroupKey
          });
        }
      }

      return NextResponse.json(fields);
    }

    // Dla custom modeli pobieramy pola z Azure
    if (!process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT || !process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY) {
      throw new Error('Brak wymaganych zmiennych środowiskowych');
    }

    const endpoint = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT.replace(/\/$/, '');
    const url = `${endpoint}/formrecognizer/documentModels/${modelId}?api-version=2023-07-31`;

    console.log('Pobieranie pól modelu z:', url);

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
      throw new Error(`Błąd pobierania pól modelu: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Odpowiedź z Azure:', JSON.stringify(data, null, 2));

    // Mapuj pola z modelu
    const fields: AnalysisField[] = Object.entries(data.fields || {})
      .map(([name, field]: [string, any]) => ({
        name,
        type: field.type || 'string',
        isRequired: field.isRequired || false,
        description: field.description || name,
        group: determineFieldGroup(name)
      }));

    return NextResponse.json(fields);

  } catch (error) {
    console.error('Błąd podczas pobierania pól modelu:', error);
    return NextResponse.json(
      { error: 'Nie udało się pobrać pól modelu' },
      { status: 500 }
    );
  }
}

function determineFieldGroup(fieldName: string): FieldGroupKey {
  const fieldNameLower = fieldName.toLowerCase();
  
  // Mapowanie na podstawie predefiniowanych grup
  for (const [groupKey, group] of Object.entries(FIELD_GROUPS)) {
    const fields = [...group.fields] as string[];
    if (fields.some(field => fieldNameLower.includes(field.toLowerCase()))) {
      return groupKey as FieldGroupKey;
    }
  }
  
  // Mapowanie na podstawie prefiksów
  if (fieldNameLower.startsWith('supplier')) return 'supplier_data';
  if (fieldNameLower.startsWith('customer')) return 'customer_data';
  if (fieldNameLower.startsWith('invoice')) return 'invoice_data';
  
  return 'invoice_data'; // domyślna grupa
} 
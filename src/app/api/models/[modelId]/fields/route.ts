import { NextResponse } from 'next/server';
import { DocumentAnalysisClient } from '@azure/ai-form-recognizer';
import type { AnalysisField, FieldGroupKey } from '@/types/processing';
import { FIELD_GROUPS } from '@/config/fields';

interface FieldGroup {
  name: string;
  icon: any;
  fields: readonly string[];
  requiredFields: readonly string[];
}

interface AzureFieldSchema {
  type?: string;
  isRequired?: boolean;
  description?: string;
  confidence?: number;
}

export async function GET(
  request: Request,
  { params }: { params: { modelId: string } }
) {
  try {
    const { modelId } = params;

    if (!modelId) {
      return NextResponse.json({ error: 'Brak ID modelu' }, { status: 400 });
    }

    // Dla predefiniowanych modeli zwracamy predefiniowane pola
    if (modelId.startsWith('prebuilt-')) {
      const fields: AnalysisField[] = [];
      
      for (const [groupKey, group] of Object.entries(FIELD_GROUPS) as [FieldGroupKey, FieldGroup][]) {
        const groupFields = [...group.fields] as string[];
        for (const field of groupFields) {
          fields.push({
            name: field,
            type: 'string',
            isRequired: group.requiredFields.includes(field),
            description: field,
            group: groupKey
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
    const url = `${endpoint}/documentintelligence/documentModels/${modelId}?api-version=2023-10-31-preview`;

    console.log('Pobieranie pól modelu z:', url);

    const response = await fetch(url, {
      headers: {
        'Ocp-Apim-Subscription-Key': process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Szczegóły błędu:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        url,
        modelId
      });
      throw new Error(`Błąd pobierania pól modelu: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Odpowiedź z Azure:', JSON.stringify(data, null, 2));

    // Mapuj pola z modelu - dostosowane do nowej struktury odpowiedzi
    const fields: AnalysisField[] = Object.entries(data.properties?.fieldDefinitions || {})
      .map(([name, rawSchema]) => {
        if (!isAzureFieldSchema(rawSchema)) {
          console.warn(`Nieprawidłowa schema dla pola ${name}:`, rawSchema);
          return {
            name,
            type: 'string',
            isRequired: false,
            description: name,
            group: determineFieldGroup(name)
          };
        }

        return {
          name,
          type: rawSchema.type || 'string',
          isRequired: rawSchema.isRequired || false,
          description: rawSchema.description || name,
          group: determineFieldGroup(name)
        };
      });

    return NextResponse.json(fields);

  } catch (error) {
    console.error('Błąd podczas pobierania pól modelu:', error);
    const message = error instanceof Error ? error.message : 'Błąd pobierania pól modelu';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function determineFieldGroup(fieldName: string): FieldGroupKey {
  const fieldNameLower = fieldName.toLowerCase();
  
  // Mapowanie na podstawie predefiniowanych grup
  for (const [groupKey, group] of Object.entries(FIELD_GROUPS) as [FieldGroupKey, FieldGroup][]) {
    const fields = [...group.fields] as string[];
    if (fields.some(field => fieldNameLower.includes(field.toLowerCase()))) {
      return groupKey;
    }
  }
  
  // Domyślna grupa
  return 'buyer_data';
}

function isAzureFieldSchema(schema: unknown): schema is AzureFieldSchema {
  if (!schema || typeof schema !== 'object') return false;
  
  const s = schema as Record<string, unknown>;
  return (
    (typeof s.type === 'string' || s.type === undefined) &&
    (typeof s.isRequired === 'boolean' || s.isRequired === undefined) &&
    (typeof s.description === 'string' || s.description === undefined) &&
    (typeof s.confidence === 'number' || s.confidence === undefined)
  );
} 
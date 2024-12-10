import { NextResponse } from 'next/server';
import { client } from '@/lib/document-intelligence';
import type { AnalysisField, FieldGroupKey } from '@/types/processing';
import { FIELD_GROUPS } from '@/config/fields';

export async function GET(
  request: Request,
  { params }: { params: { modelId: string } }
) {
  try {
    const { modelId } = params;
    
    // Pobierz definicję modelu z Azure
    const modelResponse = await client.beginAnalyzeDocument(
      modelId,
      new ArrayBuffer(0) // Pusty bufor do pobrania tylko definicji modelu
    );
    const modelResult = await modelResponse.pollUntilDone();
    
    if (!modelResult.fields) {
      throw new Error('Model nie zawiera definicji pól');
    }
    
    // Mapuj pola z modelu na nasz format
    const fields: AnalysisField[] = Object.entries(modelResult.fields)
      .map(([name, field]: [string, any]) => ({
        name,
        type: field.valueType || 'string',
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
    const fields = Array.isArray(group.fields) ? group.fields : [];
    if (fields.some(field => typeof field === 'string' && fieldNameLower.includes(field.toLowerCase()))) {
      return groupKey as FieldGroupKey;
    }
  }
  
  // Mapowanie na podstawie prefiksów
  if (fieldNameLower.startsWith('supplier')) return 'supplier_data';
  if (fieldNameLower.startsWith('customer')) return 'customer_data';
  if (fieldNameLower.startsWith('invoice')) return 'invoice_data';
  
  return 'invoice_data'; // domyślna grupa
} 
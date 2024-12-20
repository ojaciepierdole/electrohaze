import { NextResponse } from 'next/server';
import { DocumentAnalysisClient, type DocumentField as AzureDocumentField } from '@azure/ai-form-recognizer';
import type { 
  ProcessingResult, 
  DocumentField,
  DocumentConfidence,
  DocumentFieldsMap,
  FieldType,
  DataSource,
  TransformationType,
  FieldMetadata
} from '@/types/processing';
import type { FieldGroupKey } from '@/types/fields';
import { cacheManager } from '@/lib/cache-manager';
import { decompressData } from '@/utils/compression';
import { FIELD_GROUPS } from '@/config/fields';

// Funkcja pomocnicza do określania grupy pola
function determineFieldGroup(fieldName: string): FieldGroupKey {
  // Sprawdź każdą grupę pól
  for (const [groupKey, group] of Object.entries(FIELD_GROUPS)) {
    if (group.fields.includes(fieldName)) {
      return groupKey as FieldGroupKey;
    }
  }

  // Jeśli pole nie zostało znalezione w żadnej grupie, użyj heurystyki
  const normalizedField = fieldName.toLowerCase();

  // Punkt Poboru Energii
  if (normalizedField.startsWith('dp') || 
      normalizedField === 'ppenum' || 
      normalizedField === 'meternumber' || 
      normalizedField.includes('tariff') || 
      normalizedField.includes('contract') || 
      normalizedField === 'osd_name' || 
      normalizedField === 'osd_region') {
    return 'delivery_point';
  }

  // Adres korespondencyjny
  if (normalizedField.startsWith('pa')) {
    return 'postal_address';
  }

  // Dane sprzedawcy
  if (normalizedField.startsWith('supplier')) {
    return 'supplier';
  }

  // Dane rozliczeniowe
  if (normalizedField.startsWith('billing') || 
      normalizedField.includes('invoice') || 
      normalizedField.includes('amount') || 
      normalizedField.includes('vat') || 
      normalizedField === 'currency') {
    return 'billing';
  }

  // Informacje o zużyciu
  if (normalizedField.includes('usage') || 
      normalizedField.includes('consumption') || 
      normalizedField.includes('reading')) {
    return 'consumption_info';
  }

  // Domyślnie - dane nabywcy
  return 'buyer_data';
}

// Funkcja konwertująca pole z Azure na nasz format
function convertAzureField(azureField: AzureDocumentField): DocumentField {
  // Domyślnie traktujemy jako string
  const kind = 'string' as FieldType;
  const metadata: FieldMetadata = {
    fieldType: kind,
    transformationType: 'initial',
    source: 'azure',
    boundingRegions: [],
    spans: []
  };

  const field: DocumentField = {
    content: '',
    confidence: 0,
    kind,
    value: null,
    metadata
  };

  // Bezpieczne przypisanie wartości
  if ('content' in azureField) {
    field.content = String(azureField.content || '');
  }

  if ('confidence' in azureField) {
    field.confidence = Number(azureField.confidence || 0);
  }

  if ('boundingRegions' in azureField && Array.isArray(azureField.boundingRegions)) {
    metadata.boundingRegions = azureField.boundingRegions.map(region => ({
      pageNumber: region.pageNumber,
      polygon: Array.isArray(region.polygon) 
        ? region.polygon.map(point => ({ x: point.x, y: point.y }))
        : []
    }));
  }

  if ('spans' in azureField && Array.isArray(azureField.spans)) {
    metadata.spans = azureField.spans.map(span => ({
      offset: span.offset,
      length: span.length,
      text: ''
    }));
  }

  // Konwersja wartości
  if ('content' in azureField) {
    const content = azureField.content || '';
    
    switch (kind) {
      case 'number':
      case 'currency':
      case 'integer':
        field.value = Number(content);
        break;
      case 'date':
        field.value = content ? new Date(content) : null;
        break;
      case 'object':
        try {
          field.value = content ? JSON.parse(content) : {};
        } catch {
          field.value = {};
        }
        break;
      case 'array':
        try {
          field.value = content ? JSON.parse(content) : [];
        } catch {
          field.value = [];
        }
        break;
      case 'selectionMark':
        field.value = content === 'selected';
        break;
      default:
        field.value = content;
    }
  }

  return field;
}

export async function POST(request: Request) {
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

    // Sprawdź czy mamy dostęp do Azure Document Intelligence
    const endpoint = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT;
    const key = process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY;

    if (!endpoint || !key) {
      return NextResponse.json(
        { error: 'Brak konfiguracji Azure Document Intelligence' },
        { status: 500 }
      );
    }

    const client = new DocumentAnalysisClient(endpoint, { key });

    // Przygotuj dane do wysłania
    const arrayBuffer = await file.arrayBuffer();
    const fileData = file.type === 'application/octet-stream' 
      ? decompressData<ArrayBuffer>(new Uint8Array(arrayBuffer))
      : arrayBuffer;

    // Wyślij żądanie do Azure
    const poller = await client.beginAnalyzeDocument(modelId, fileData);
    const result = await poller.pollUntilDone();

    if (!result.documents?.[0]?.fields) {
      throw new Error('Nie znaleziono pól w dokumencie');
    }

    // Konwertuj pola z Azure na nasz format
    const fields = Object.entries(result.documents[0].fields).reduce<Record<string, DocumentField>>(
      (acc, [key, field]) => {
        if (field) {
          acc[key] = convertAzureField(field);
        }
        return acc;
      },
      {}
    );

    // Mapuj pola na grupy
    const mappedData: DocumentFieldsMap = {
      delivery_point: {},
      ppe: {},
      postal_address: {},
      buyer_data: {},
      supplier: {},
      consumption_info: {},
      billing: {}
    };

    // Grupuj pola według ich grup
    for (const [fieldName, field] of Object.entries(fields)) {
      const group = determineFieldGroup(fieldName);
      mappedData[group][fieldName] = field;
    }

    // Oblicz pewność dla każdej grupy
    const documentConfidence: DocumentConfidence = {
      overall: 0,
      confidence: 0,
      groups: {
        delivery_point: { completeness: 0, confidence: 0, filledRequired: 0, totalRequired: 0, filledOptional: 0, totalOptional: 0 },
        ppe: { completeness: 0, confidence: 0, filledRequired: 0, totalRequired: 0, filledOptional: 0, totalOptional: 0 },
        postal_address: { completeness: 0, confidence: 0, filledRequired: 0, totalRequired: 0, filledOptional: 0, totalOptional: 0 },
        buyer_data: { completeness: 0, confidence: 0, filledRequired: 0, totalRequired: 0, filledOptional: 0, totalOptional: 0 },
        supplier: { completeness: 0, confidence: 0, filledRequired: 0, totalRequired: 0, filledOptional: 0, totalOptional: 0 },
        consumption_info: { completeness: 0, confidence: 0, filledRequired: 0, totalRequired: 0, filledOptional: 0, totalOptional: 0 },
        billing: { completeness: 0, confidence: 0, filledRequired: 0, totalRequired: 0, filledOptional: 0, totalOptional: 0 }
      }
    };

    // Oblicz pewność dla każdej grupy
    for (const [groupKey, group] of Object.entries(mappedData)) {
      const groupFields = Object.values(group) as DocumentField[];
      if (groupFields.length > 0) {
        const groupConfidence = groupFields.reduce((sum, field) => sum + field.confidence, 0) / groupFields.length;
        const fieldGroup = FIELD_GROUPS[groupKey as FieldGroupKey];
        const requiredFields = fieldGroup.requiredFields;
        const optionalFields = fieldGroup.fields.filter(field => !requiredFields.includes(field));
        
        const filledRequired = requiredFields.filter(fieldName => {
          const field = group[fieldName] as DocumentField | undefined;
          return field?.content;
        }).length;

        const filledOptional = optionalFields.filter(fieldName => {
          const field = group[fieldName] as DocumentField | undefined;
          return field?.content;
        }).length;

        const completeness = requiredFields.length > 0 ? filledRequired / requiredFields.length : 1;

        documentConfidence.groups[groupKey as FieldGroupKey] = {
          completeness,
          confidence: groupConfidence,
          filledRequired,
          totalRequired: requiredFields.length,
          filledOptional,
          totalOptional: optionalFields.length
        };
      }
    }

    // Oblicz ogólną pewność dokumentu
    const allFields = Object.values(fields) as DocumentField[];
    if (allFields.length > 0) {
      const overallConfidence = allFields.reduce((sum, field) => sum + field.confidence, 0) / allFields.length;
      documentConfidence.overall = overallConfidence;
      documentConfidence.confidence = overallConfidence;
    }

    const processingResult: ProcessingResult = {
      fileName: file.name,
      timing: {
        upload: 0,
        ocr: 0,
        analysis: 0,
        total: 0
      },
      documentConfidence,
      usability: documentConfidence.confidence,
      status: 'success',
      mappedData
    };

    // Zapisz wynik do cache
    cacheManager.set(file.name, modelId, processingResult);

    return NextResponse.json(processingResult);
  } catch (error) {
    console.error('Błąd podczas przetwarzania żądania:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Nieznany błąd' },
      { status: 500 }
    );
  }
} 
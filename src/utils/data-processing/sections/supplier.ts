import type { DocumentField } from '@/types/processing';
import type { SupplierData } from '@/types/fields';
import { cleanOSDName, cleanOSDRegion } from '@/utils/data-processing/text-formatting';

export function processSupplierData(data: Partial<SupplierData>): Record<string, DocumentField | undefined> {
  const processedData: Record<string, DocumentField | undefined> = {};

  // Przetwórz nazwę OSD
  if (data.OSD_name?.content) {
    processedData.OSD_name = {
      ...data.OSD_name,
      content: cleanOSDName(data.OSD_name.content)
    };
  }

  // Przetwórz region OSD
  if (data.OSD_region?.content) {
    processedData.OSD_region = {
      ...data.OSD_region,
      content: cleanOSDRegion(data.OSD_region.content)
    };
  }

  // Skopiuj pozostałe pola bez zmian
  Object.entries(data).forEach(([key, value]) => {
    if (!['OSD_name', 'OSD_region'].includes(key) && value) {
      processedData[key] = value;
    }
  });

  return processedData;
}

// Oblicz średnią pewność dla pól z danymi
export function calculateSupplierConfidence(data: Record<string, DocumentField | undefined>): number {
  const fieldsWithConfidence = Object.values(data)
    .filter((field): field is DocumentField => field?.confidence !== undefined);
  
  return fieldsWithConfidence.length > 0
    ? fieldsWithConfidence.reduce((acc, field) => acc + field.confidence, 0) / fieldsWithConfidence.length
    : 0;
}

// Oblicz kompletność danych dostawcy
export function calculateSupplierCompleteness(data: Record<string, DocumentField | undefined>): number {
  const requiredFields = ['supplierName', 'OSD_name', 'OSD_region'];
  const filledRequiredFields = requiredFields.filter(key => data[key]?.content).length;
  return Math.round((filledRequiredFields / requiredFields.length) * 100);
} 
import { DocumentField } from '@/types/processing';

export function getFieldValue(field?: DocumentField): string {
  if (!field) return 'N/A';
  return field.content || 'N/A';
}

export function getFieldConfidence(field?: DocumentField): number {
  if (!field) return 0;
  return field.confidence || 0;
}

export function getBoundingBox(field?: DocumentField): number[] | undefined {
  return field?.metadata?.boundingRegions?.[0]?.polygon?.map(p => [p.x, p.y]).flat();
}

export function getPageNumber(field?: DocumentField): number | undefined {
  return field?.metadata?.boundingRegions?.[0]?.pageNumber;
} 
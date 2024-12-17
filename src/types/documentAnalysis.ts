import type { DocumentField, DocumentAnalysisResult } from './processing';
import type { PPEData, CustomerData, CorrespondenceData, SupplierData, BillingData } from './fields';

export type { DocumentAnalysisResult };

export interface DocumentPage {
  pageNumber: number;
  width: number;
  height: number;
  unit: string;
}

export interface DocumentRegion {
  pageNumber: number;
  polygon: number[];
}

export interface DocumentSection {
  docType: string;
  boundingRegions?: DocumentRegion[];
  fields: Record<string, DocumentField>;
  confidence?: number;
} 
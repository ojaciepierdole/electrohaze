'use client';

import * as React from 'react';
import { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { calculateDocumentCompleteness, calculateAverageConfidence } from '@/utils/data-processing/completeness/confidence';
import { PPEDataGroup } from '@/components/data-groups/PPEDataGroup';
import { CustomerDataGroup } from '@/components/data-groups/CustomerDataGroup';
import { SupplierDataGroup } from '@/components/data-groups/SupplierDataGroup';
import { CorrespondenceDataGroup } from './data-groups/CorrespondenceDataGroup';
import { BillingDataGroup } from './data-groups/BillingDataGroup';
import type { PPEData, CustomerData, CorrespondenceData, SupplierData, BillingData } from '@/types/fields';
import type { DocumentField, FieldType, TransformationType, DataSource, FieldMetadata } from '@/types/processing';
import type { DocumentSections } from '@/utils/data-processing/completeness/confidence';
import { ConfidenceCalculator } from '../utils/confidence-calculator';
import { ConfidenceSummary } from './ConfidenceSummary';
import { FieldConfidence } from '../types/confidence';

interface ProcessingTime {
  uploadTime: number;
  ocrTime: number;
  analysisTime: number;
  totalTime: number;
}

interface AnalysisResultCardProps {
  fileName: string;
  confidence: number;
  ppeData: Partial<PPEData>;
  customerData: Partial<CustomerData>;
  correspondenceData: Partial<CorrespondenceData>;
  supplierData: Partial<SupplierData>;
  billingData: Partial<BillingData>;
  usability: boolean;
  processingTime?: ProcessingTime;
}

interface FieldWithMetadata {
  content: string;
  confidence: number;
  metadata?: {
    fieldType?: FieldType;
    transformationType?: TransformationType;
    source?: DataSource;
    boundingRegions?: Array<{
      pageNumber: number;
      polygon: Array<{ x: number; y: number }>;
    }>;
    spans?: Array<{
      offset: number;
      length: number;
      text?: string;
    }>;
  };
}

function convertField(value: FieldWithMetadata): DocumentField {
  const kind = value.metadata?.fieldType || 'string';
  const metadata: FieldMetadata = {
    fieldType: kind,
    transformationType: value.metadata?.transformationType || 'initial',
    source: value.metadata?.source || 'manual',
    boundingRegions: value.metadata?.boundingRegions?.map(region => ({
      pageNumber: region.pageNumber,
      polygon: region.polygon?.map(point => ({ x: point.x, y: point.y })) || []
    })) || [],
    spans: value.metadata?.spans?.map(span => ({
      offset: span.offset,
      length: span.length,
      text: span.text || ''
    })) || []
  };

  const field: DocumentField = {
    content: value.content || '',
    confidence: value.confidence || 0,
    kind,
    value: null,
    metadata
  };

  switch (kind) {
    case 'number':
    case 'currency':
    case 'integer':
      field.value = Number(value.content || 0);
      break;
    case 'date':
      field.value = value.content ? new Date(value.content) : null;
      break;
    case 'object':
      try {
        field.value = value.content ? JSON.parse(value.content) : {};
      } catch {
        field.value = {};
      }
      break;
    case 'array':
      try {
        field.value = value.content ? JSON.parse(value.content) : [];
      } catch {
        field.value = [];
      }
      break;
    case 'selectionMark':
      field.value = value.content === 'selected';
      break;
    default:
      field.value = value.content || '';
  }

  return field;
}

export function AnalysisResultCard({ 
  fileName,
  confidence: rawConfidence,
  ppeData,
  customerData,
  correspondenceData,
  supplierData,
  billingData,
  usability,
  processingTime,
}: AnalysisResultCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Konwertuj dane do wymaganego formatu
  const sections: DocumentSections = {
    ppe: Object.entries(ppeData || {}).reduce<Record<string, DocumentField>>((acc, [key, value]) => {
      if (value) {
        acc[key] = convertField(value);
      }
      return acc;
    }, {}),
    customer: Object.entries(customerData || {}).reduce<Record<string, DocumentField>>((acc, [key, value]) => {
      if (value) {
        acc[key] = convertField(value);
      }
      return acc;
    }, {}),
    correspondence: Object.entries(correspondenceData || {}).reduce<Record<string, DocumentField>>((acc, [key, value]) => {
      if (value) {
        acc[key] = convertField(value);
      }
      return acc;
    }, {}),
    supplier: Object.entries(supplierData || {}).reduce<Record<string, DocumentField>>((acc, [key, value]) => {
      if (value) {
        acc[key] = convertField(value);
      }
      return acc;
    }, {}),
    billing: Object.entries(billingData || {}).reduce<Record<string, DocumentField>>((acc, [key, value]) => {
      if (value) {
        acc[key] = convertField(value);
      }
      return acc;
    }, {})
  };

  // Oblicz kompletność i pewność dokumentu
  const completenessResult = calculateDocumentCompleteness(sections);
  const confidenceResult = calculateAverageConfidence(sections);

  // Przygotuj dane o pewności dla wszystkich pól
  const confidenceFields: FieldConfidence[] = Object.entries(sections)
    .flatMap(([_, fields]) => 
      Object.entries(fields || {})
        .filter(([_, field]) => field.confidence !== undefined)
        .map(([fieldName, field]) => ({
          fieldName,
          confidence: field.confidence
        }))
    );

  const confidenceStats = ConfidenceCalculator.calculateStats(confidenceFields);
  const averageConfidence = confidenceResult.confidence;

  return (
    <div className="space-y-6">
      <div className="pb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Dane dostawcy</h3>
        </div>
        <SupplierDataGroup data={supplierData} />
      </div>

      <div className="border-t border-gray-300 pt-6 pb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Dane PPE</h3>
        </div>
        <PPEDataGroup data={ppeData} />
      </div>

      <div className="border-t border-gray-300 pt-6 pb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Dane klienta</h3>
        </div>
        <CustomerDataGroup data={customerData} />
      </div>

      <div className="border-t border-gray-300 pt-6 pb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Adres korespondencyjny</h3>
        </div>
        <CorrespondenceDataGroup data={correspondenceData} />
      </div>

      <div className="border-t border-gray-300 pt-6 pb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Dane rozliczeniowe</h3>
        </div>
        <BillingDataGroup data={billingData} />
      </div>
    </div>
  );
} 
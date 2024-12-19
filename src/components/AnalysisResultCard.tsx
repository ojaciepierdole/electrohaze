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
import { processSupplierData, calculateSupplierConfidence, calculateSupplierCompleteness } from '@/utils/document-mapping';
import type { PPEData, CustomerData, CorrespondenceData, SupplierData, BillingData } from '@/types/fields';
import type { DocumentField, FieldWithConfidence } from '@/types/processing';
import type { DocumentSections } from '@/utils/data-processing/completeness/confidence';

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
  processingTime: ProcessingTime;
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
    ppe: Object.entries(ppeData || {}).reduce<Record<string, FieldWithConfidence>>((acc, [key, value]) => {
      if (value) {
        acc[key] = {
          content: value.content,
          confidence: value.confidence || 0,
          metadata: {
            fieldType: value.metadata?.fieldType || 'text',
            transformationType: value.metadata?.transformationType || 'initial',
            source: value.metadata?.source || 'raw'
          }
        };
      }
      return acc;
    }, {}),
    customer: Object.entries(customerData || {}).reduce<Record<string, FieldWithConfidence>>((acc, [key, value]) => {
      if (value) {
        acc[key] = {
          content: value.content,
          confidence: value.confidence || 0,
          metadata: {
            fieldType: value.metadata?.fieldType || 'text',
            transformationType: value.metadata?.transformationType || 'initial',
            source: value.metadata?.source || 'raw'
          }
        };
      }
      return acc;
    }, {}),
    correspondence: Object.entries(correspondenceData || {}).reduce<Record<string, FieldWithConfidence>>((acc, [key, value]) => {
      if (value) {
        acc[key] = {
          content: value.content,
          confidence: value.confidence || 0,
          metadata: {
            fieldType: value.metadata?.fieldType || 'text',
            transformationType: value.metadata?.transformationType || 'initial',
            source: value.metadata?.source || 'raw'
          }
        };
      }
      return acc;
    }, {}),
    supplier: Object.entries(supplierData || {}).reduce<Record<string, FieldWithConfidence>>((acc, [key, value]) => {
      if (value) {
        acc[key] = {
          content: value.content,
          confidence: value.confidence || 0,
          metadata: {
            fieldType: value.metadata?.fieldType || 'text',
            transformationType: value.metadata?.transformationType || 'initial',
            source: value.metadata?.source || 'raw'
          }
        };
      }
      return acc;
    }, {}),
    billing: Object.entries(billingData || {}).reduce<Record<string, FieldWithConfidence>>((acc, [key, value]) => {
      if (value) {
        acc[key] = {
          content: value.content,
          confidence: value.confidence || 0,
          metadata: {
            fieldType: value.metadata?.fieldType || 'text',
            transformationType: value.metadata?.transformationType || 'initial',
            source: value.metadata?.source || 'raw'
          }
        };
      }
      return acc;
    }, {})
  };

  // Oblicz kompletność i pewność dokumentu
  const completenessResult = calculateDocumentCompleteness(sections);
  const confidenceResult = calculateAverageConfidence(sections);

  // Sprawdź, czy wartości są prawidłowe przed przekazaniem
  const safeCompleteness = Number.isFinite(completenessResult.completeness) 
    ? completenessResult.completeness 
    : 0;
  
  const safeConfidence = Number.isFinite(confidenceResult.confidence) 
    ? confidenceResult.confidence 
    : 0;

  return (
    <>
      <tr className="bg-white">
        <td className="flex-[2] px-6 py-4">
          <div className="text-sm font-medium text-gray-900">
            {supplierData?.supplierName?.content || 'Nieznany dostawca'}
          </div>
          <div className="text-sm text-gray-500 truncate max-w-[300px]" title={fileName}>
            {fileName}
          </div>
        </td>
        <td className="flex-1 px-6 py-4 text-center">
          <Badge variant="secondary" className="bg-gray-50 text-gray-600">
            PDF
          </Badge>
        </td>
        <td className="flex-1 px-6 py-4 text-center">
          <Badge variant="secondary" className={cn(
            safeConfidence >= 0.9 ? 'bg-green-50 text-green-700' : 
            safeConfidence >= 0.7 ? 'bg-yellow-50 text-yellow-700' : 
            'bg-red-50 text-red-700'
          )}>
            {(safeConfidence * 100).toFixed(1)}%
          </Badge>
        </td>
        <td className="flex-1 px-6 py-4 text-center">
          <Badge variant="secondary" className={cn(
            safeCompleteness >= 0.8 ? 'bg-green-50 text-green-700' : 
            safeCompleteness >= 0.6 ? 'bg-yellow-50 text-yellow-700' : 
            'bg-red-50 text-red-700'
          )}>
            {(safeCompleteness * 100).toFixed(1)}%
          </Badge>
        </td>
        <td className="flex-1 px-6 py-4 text-center">
          {usability ? (
            <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" />
          ) : (
            <XCircle className="w-5 h-5 text-red-500 mx-auto" />
          )}
        </td>
        <td className="w-[60px] px-6 py-4 flex justify-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-600 hover:text-blue-900"
          >
            {isExpanded ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </Button>
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={6} className="px-6 py-4 border-t border-gray-200">
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-medium">Dane dostawcy</h3>
                  <Badge variant="secondary" className={cn(
                    safeConfidence >= 0.9 ? 'bg-green-50 text-green-700' : 
                    safeConfidence >= 0.7 ? 'bg-yellow-50 text-yellow-700' : 
                    'bg-red-50 text-red-700'
                  )}>
                    {(safeConfidence * 100).toFixed(1)}%
                  </Badge>
                </div>
                <SupplierDataGroup data={supplierData} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-medium">Dane PPE</h3>
                  <Badge variant="secondary" className={cn(
                    safeConfidence >= 0.9 ? 'bg-green-50 text-green-700' : 
                    safeConfidence >= 0.7 ? 'bg-yellow-50 text-yellow-700' : 
                    'bg-red-50 text-red-700'
                  )}>
                    {(safeConfidence * 100).toFixed(1)}%
                  </Badge>
                </div>
                <PPEDataGroup data={ppeData} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-medium">Dane klienta</h3>
                  <Badge variant="secondary" className={cn(
                    safeConfidence >= 0.9 ? 'bg-green-50 text-green-700' : 
                    safeConfidence >= 0.7 ? 'bg-yellow-50 text-yellow-700' : 
                    'bg-red-50 text-red-700'
                  )}>
                    {(safeConfidence * 100).toFixed(1)}%
                  </Badge>
                </div>
                <CustomerDataGroup data={customerData} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-medium">Adres korespondencyjny</h3>
                  <Badge variant="secondary" className={cn(
                    safeConfidence >= 0.9 ? 'bg-green-50 text-green-700' : 
                    safeConfidence >= 0.7 ? 'bg-yellow-50 text-yellow-700' : 
                    'bg-red-50 text-red-700'
                  )}>
                    {(safeConfidence * 100).toFixed(1)}%
                  </Badge>
                </div>
                <CorrespondenceDataGroup data={correspondenceData} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-medium">Dane rozliczeniowe</h3>
                  <Badge variant="secondary" className={cn(
                    safeConfidence >= 0.9 ? 'bg-green-50 text-green-700' : 
                    safeConfidence >= 0.7 ? 'bg-yellow-50 text-yellow-700' : 
                    'bg-red-50 text-red-700'
                  )}>
                    {(safeConfidence * 100).toFixed(1)}%
                  </Badge>
                </div>
                <BillingDataGroup data={billingData} />
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
} 
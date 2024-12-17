'use client';

import * as React from 'react';
import { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle2, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatPercentage } from '@/utils/text-formatting';
import { calculateDocumentCompleteness, calculateUsability, calculateAverageConfidence } from '@/utils/data-processing/completeness/confidence';
import { PPEDataGroup } from './data-groups/PPEDataGroup';
import { CustomerDataGroup } from './data-groups/CustomerDataGroup';
import { CorrespondenceDataGroup } from './data-groups/CorrespondenceDataGroup';
import { SupplierDataGroup } from './data-groups/SupplierDataGroup';
import { BillingDataGroup } from './data-groups/BillingDataGroup';
import type { PPEData, CustomerData, CorrespondenceData, SupplierData, BillingData } from '@/types/fields';
import type { DocumentField } from '@/types/document';
import type { DocumentSections } from '@/utils/data-processing/completeness/confidence';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';

interface AnalysisResultCardProps {
  fileName: string;
  confidence: number;
  ppeData?: Partial<PPEData>;
  customerData?: Partial<CustomerData>;
  correspondenceData?: Partial<CorrespondenceData>;
  supplierData?: Partial<SupplierData>;
  billingData?: Partial<BillingData>;
  usability: boolean;
}

export function AnalysisResultCard({ 
  fileName,
  confidence: rawConfidence,
  ppeData,
  customerData,
  correspondenceData,
  supplierData,
  billingData,
  usability
}: AnalysisResultCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const mimeType = fileName.toLowerCase().endsWith('.pdf') ? 'PDF' : 
                   fileName.toLowerCase().match(/\.(jpg|jpeg)$/) ? 'JPEG' :
                   fileName.toLowerCase().endsWith('.png') ? 'PNG' : 'Nieznany';

  const getConfidenceColor = (value: number) => {
    if (value >= 0.9) return 'text-green-600';
    if (value >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceBgColor = (value: number) => {
    if (value >= 0.9) return 'bg-green-50';
    if (value >= 0.7) return 'bg-yellow-50';
    return 'bg-red-50';
  };

  // Konwertuj dane do wymaganego formatu
  const sections: DocumentSections = {
    ppe: ppeData as Record<string, DocumentField>,
    customer: customerData as Record<string, DocumentField>,
    correspondence: correspondenceData as Record<string, DocumentField>,
    supplier: supplierData as Record<string, DocumentField>,
    billing: billingData as Record<string, DocumentField>
  };

  // Oblicz średnią pewność ze wszystkich pól
  const confidence = calculateAverageConfidence(sections);

  // Oblicz kompletność dokumentu
  const completeness = calculateDocumentCompleteness(sections);

  return (
    <>
      <tr className={cn(
        "hover:bg-gray-50 transition-colors",
        isExpanded && "bg-gray-50"
      )}>
        <td className="py-4 pl-4 pr-3 text-sm sm:pl-6">
          <div className="font-medium text-gray-900">
            {supplierData?.supplierName?.content || 'Nieznany dostawca'}
          </div>
          <div className="text-gray-500">{fileName}</div>
        </td>
        <td className="px-3 py-4 text-sm text-center">
          <Badge variant="secondary">{mimeType}</Badge>
        </td>
        <td className={cn(
          "px-3 py-4 text-sm text-center",
          getConfidenceColor(confidence)
        )}>
          {(confidence * 100).toFixed(0)}%
        </td>
        <td className={cn(
          "px-3 py-4 text-sm text-center",
          getConfidenceColor(completeness)
        )}>
          {(completeness * 100).toFixed(0)}%
        </td>
        <td className="px-3 py-4 text-sm text-center">
          {usability ? (
            <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
              Tak
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
              Nie
            </span>
          )}
        </td>
        <td className="relative py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-600 hover:text-blue-900"
          >
            {isExpanded ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </button>
        </td>
      </tr>

      {isExpanded && (
        <tr>
          <td colSpan={6} className="p-0">
            <div className="border-t border-gray-200">
              <div className="p-4 space-y-6">
                {/* Dane dostawcy */}
                {supplierData && (
                  <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                        Sprzedawca
                        <Badge variant="secondary" className={getConfidenceBgColor(confidence)}>
                          {(confidence * 100).toFixed(0)}%
                        </Badge>
                      </h3>
                    </div>
                    <SupplierDataGroup
                      data={supplierData}
                      ppeData={ppeData}
                      customerData={customerData}
                      correspondenceData={correspondenceData}
                    />
                  </div>
                )}

                {/* Dane PPE */}
                {ppeData && (
                  <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                        Dane PPE
                        <Badge variant="secondary" className={getConfidenceBgColor(confidence)}>
                          {(confidence * 100).toFixed(0)}%
                        </Badge>
                      </h3>
                    </div>
                    <PPEDataGroup data={ppeData} />
                  </div>
                )}

                {/* Dane klienta */}
                {customerData && (
                  <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                        Dane klienta
                        <Badge variant="secondary" className={getConfidenceBgColor(confidence)}>
                          {(confidence * 100).toFixed(0)}%
                        </Badge>
                      </h3>
                    </div>
                    <CustomerDataGroup data={customerData} />
                  </div>
                )}

                {/* Adres korespondencyjny */}
                {correspondenceData && (
                  <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                        Adres korespondencyjny
                        <Badge variant="secondary" className={getConfidenceBgColor(confidence)}>
                          {(confidence * 100).toFixed(0)}%
                        </Badge>
                      </h3>
                    </div>
                    <CorrespondenceDataGroup data={correspondenceData} />
                  </div>
                )}

                {/* Dane rozliczeniowe */}
                {billingData && (
                  <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                        Dane rozliczeniowe
                        <Badge variant="secondary" className={getConfidenceBgColor(confidence)}>
                          {(confidence * 100).toFixed(0)}%
                        </Badge>
                      </h3>
                    </div>
                    <BillingDataGroup data={billingData} />
                  </div>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
} 
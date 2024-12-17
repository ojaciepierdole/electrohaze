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
      <tr 
        className={`${isExpanded ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
          {supplierData?.supplierName?.content || 'Nieznany dostawca'}
        </td>
        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-center">
          {formatPercentage(confidence)}
        </td>
        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-center">
          {formatPercentage(completeness)}
        </td>
        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
          <div className="flex items-center justify-center">
            {usability ? (
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle2 className="w-5 h-5" />
                <span>Tak</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-red-600">
                <XCircle className="w-5 h-5" />
                <span>Nie</span>
              </div>
            )}
          </div>
        </td>
        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={5} className="px-4 py-4 bg-gray-50 border-t border-gray-200">
            <div className="space-y-6">
              {supplierData && (
                <SupplierDataGroup
                  data={supplierData}
                  ppeData={ppeData}
                  customerData={customerData}
                  correspondenceData={correspondenceData}
                />
              )}
              {ppeData && (
                <PPEDataGroup data={ppeData} />
              )}
              {customerData && (
                <CustomerDataGroup data={customerData} />
              )}
              {correspondenceData && (
                <CorrespondenceDataGroup data={correspondenceData} />
              )}
              {billingData && (
                <BillingDataGroup data={billingData} />
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
} 
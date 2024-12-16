'use client';

import * as React from 'react';
import { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle2, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatPercentage } from '@/utils/text-formatting';
import { calculateDocumentCompleteness, calculateUsability } from '@/utils/data-processing/completeness/confidence';
import { PPEDataGroup } from './data-groups/PPEDataGroup';
import { CustomerDataGroup } from './data-groups/CustomerDataGroup';
import { CorrespondenceDataGroup } from './data-groups/CorrespondenceDataGroup';
import { SupplierDataGroup } from './data-groups/SupplierDataGroup';
import { BillingDataGroup } from './data-groups/BillingDataGroup';
import type { PPEData, CustomerData, CorrespondenceData, SupplierData, BillingData } from '@/types/fields';

interface AnalysisResultCardProps {
  fileName: string;
  confidence: number;
  ppeData?: Partial<PPEData>;
  customerData?: Partial<CustomerData>;
  correspondenceData?: Partial<CorrespondenceData>;
  supplierData?: Partial<SupplierData>;
  billingData?: Partial<BillingData>;
}

export function AnalysisResultCard({ 
  fileName,
  confidence,
  ppeData,
  customerData,
  correspondenceData,
  supplierData,
  billingData
}: AnalysisResultCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Oblicz kompletność dokumentu
  const completeness = calculateDocumentCompleteness({
    ppe: ppeData,
    customer: customerData,
    correspondence: correspondenceData,
    supplier: supplierData,
    billing: billingData
  });

  // Oblicz przydatność dokumentu
  const isUsable = calculateUsability({
    ppe: ppeData,
    customer: customerData,
    correspondence: correspondenceData,
    supplier: supplierData,
    billing: billingData
  });

  return (
    <Card className="overflow-hidden">
      <div className="p-4 bg-gray-50 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-sm font-medium">{fileName}</div>
            <div className="flex items-center gap-2">
              <div className="text-sm text-gray-500">Pewność</div>
              <div className="text-sm font-medium">{formatPercentage(confidence)}</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-sm text-gray-500">Kompletność</div>
              <div className="text-sm font-medium">{formatPercentage(completeness)}</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-sm text-gray-500">Przydatność</div>
              {isUsable ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
      {isExpanded && (
        <div className="p-4 space-y-4">
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
      )}
    </Card>
  );
} 
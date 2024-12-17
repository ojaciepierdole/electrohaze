'use client';

import * as React from 'react';
import { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle2, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatPercentage } from '@/utils/text-formatting';
import { calculateDocumentCompleteness, calculateUsability, calculateAverageConfidence } from '@/utils/data-processing/completeness/confidence';
import { PPEDataGroup } from '@/components/data-groups/PPEDataGroup';
import { CustomerDataGroup } from '@/components/data-groups/CustomerDataGroup';
import { SupplierDataGroup } from '@/components/data-groups/SupplierDataGroup';
import { DataGroup } from '@/components/data-groups/DataGroup';
import type { PPEData, CustomerData, CorrespondenceData, SupplierData, BillingData } from '@/types/fields';
import type { DocumentField } from '@/types/document-processing';
import type { DocumentSections } from '@/utils/data-processing/completeness/confidence';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import { processSection } from '@/utils/data-processing';
import { CorrespondenceDataGroup } from './data-groups/CorrespondenceDataGroup';
import { BillingDataGroup } from './data-groups/BillingDataGroup';

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

  const toggleExpand = () => setIsExpanded(!isExpanded);

  return (
    <>
      <motion.tr 
        onClick={toggleExpand}
        className={cn(
          "cursor-pointer hover:bg-gray-50",
          isExpanded && "bg-gray-50"
        )}
        layout
      >
        <td className="py-4 pl-4 pr-3 text-sm sm:pl-6">
          <div className="font-medium text-gray-900">
            {supplierData?.supplierName?.content || 'Nieznany dostawca'}
          </div>
          <div className="text-gray-500 truncate max-w-[300px]" title={fileName}>
            {fileName}
          </div>
        </td>
        <td className="px-3 py-4 text-sm text-center">
          <Badge variant="secondary">{mimeType}</Badge>
        </td>
        <td className="px-3 py-4 text-sm text-center">
          <Badge variant="secondary" className={cn(
            confidence > 0.8 ? 'bg-green-50 text-green-700' : 
            confidence > 0.6 ? 'bg-yellow-50 text-yellow-700' : 
            'bg-red-50 text-red-700'
          )}>
            {(confidence * 100).toFixed(0)}%
          </Badge>
        </td>
        <td className="px-3 py-4 text-sm text-center">
          <Badge variant="secondary" className={cn(
            completeness > 0.8 ? 'bg-green-50 text-green-700' : 
            completeness > 0.6 ? 'bg-yellow-50 text-yellow-700' : 
            'bg-red-50 text-red-700'
          )}>
            {(completeness * 100).toFixed(0)}%
          </Badge>
        </td>
        <td className="px-3 py-4 text-sm text-center">
          {usability ? (
            <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" />
          ) : (
            <XCircle className="w-5 h-5 text-red-500 mx-auto" />
          )}
        </td>
        <td className="relative py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand();
            }}
            className="text-blue-600 hover:text-blue-900"
          >
            {isExpanded ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </button>
        </td>
      </motion.tr>

      <AnimatePresence>
        {isExpanded && (
          <motion.tr
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <td colSpan={6} className="p-0">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="border-t border-gray-200"
              >
                <div className="p-4 space-y-6">
                  {/* Supplier Data */}
                  {supplierData && (
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="bg-white rounded-lg shadow p-4"
                    >
                      <SupplierDataGroup 
                        data={supplierData}
                        ppeData={ppeData}
                        customerData={customerData}
                      />
                    </motion.div>
                  )}

                  {/* PPE Data */}
                  {ppeData && (
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="bg-white rounded-lg shadow p-4"
                    >
                      <PPEDataGroup 
                        data={ppeData}
                      />
                    </motion.div>
                  )}

                  {/* Customer Data */}
                  {customerData && (
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="bg-white rounded-lg shadow p-4"
                    >
                      <CustomerDataGroup 
                        data={customerData}
                      />
                    </motion.div>
                  )}

                  {/* Correspondence Data */}
                  {correspondenceData && (
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="bg-white rounded-lg shadow p-4"
                    >
                      <CorrespondenceDataGroup 
                        data={correspondenceData}
                      />
                    </motion.div>
                  )}

                  {/* Billing Data */}
                  {billingData && (
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="bg-white rounded-lg shadow p-4"
                    >
                      <BillingDataGroup 
                        data={billingData}
                      />
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </td>
          </motion.tr>
        )}
      </AnimatePresence>
    </>
  );
} 
'use client';

import * as React from 'react';
import { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle2, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
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

interface AnalysisResultCardProps {
  fileName: string;
  confidence: number;
  ppeData: Partial<PPEData>;
  customerData: Partial<CustomerData>;
  correspondenceData: Partial<CorrespondenceData>;
  supplierData: Partial<SupplierData>;
  billingData: Partial<BillingData>;
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

  // Konwertuj dane do wymaganego formatu
  const sections: DocumentSections = {
    ppe: Object.entries(ppeData || {}).reduce<Record<string, FieldWithConfidence>>((acc, [key, value]) => {
      if (value) {
        acc[key] = {
          content: value.content,
          confidence: value.confidence,
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
          confidence: value.confidence,
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
          confidence: value.confidence,
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
          confidence: value.confidence,
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
          confidence: value.confidence,
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

  // Oblicz średnią pewność ze wszystkich pól
  const confidence = calculateAverageConfidence(sections);

  // Oblicz kompletność dokumentu
  const completeness = calculateDocumentCompleteness(sections);

  const toggleExpand = () => setIsExpanded(!isExpanded);

  return (
    <>
      <motion.tr 
        layout
        className={cn(
          "group cursor-pointer hover:bg-gray-50 transition-colors",
          isExpanded && "bg-gray-50"
        )}
        onClick={toggleExpand}
      >
        <motion.td
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
          className="py-4 pl-4 pr-3 text-sm sm:pl-6"
        >
          <div className="font-medium text-gray-900">
            {supplierData?.supplierName?.content || 'Nieznany dostawca'}
          </div>
          <div className="text-gray-500 truncate max-w-[300px]" title={fileName}>
            {fileName}
          </div>
        </motion.td>
        <motion.td
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="px-3 py-4 text-sm text-center"
        >
          <Badge variant="secondary" className="bg-gray-50 text-gray-600">
            {mimeType}
          </Badge>
        </motion.td>
        <motion.td
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.2 }}
          className="px-3 py-4 text-sm text-center"
        >
          <Badge variant="secondary" className={cn(
            confidence >= 0.9 ? 'bg-green-50 text-green-700' : 
            confidence >= 0.7 ? 'bg-yellow-50 text-yellow-700' : 
            'bg-red-50 text-red-700'
          )}>
            {(confidence * 100).toFixed(0)}%
          </Badge>
        </motion.td>
        <motion.td
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.3 }}
          className="px-3 py-4 text-sm text-center"
        >
          <Badge variant="secondary" className={cn(
            completeness >= 0.8 ? 'bg-green-50 text-green-700' : 
            completeness >= 0.6 ? 'bg-yellow-50 text-yellow-700' : 
            'bg-red-50 text-red-700'
          )}>
            {(completeness * 100).toFixed(0)}%
          </Badge>
        </motion.td>
        <motion.td
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.4 }}
          className="px-3 py-4 text-sm text-center"
        >
          {usability ? (
            <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" />
          ) : (
            <XCircle className="w-5 h-5 text-red-500 mx-auto" />
          )}
        </motion.td>
        <motion.td
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.5 }}
          className="relative py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand();
            }}
            className={cn(
              "text-blue-600 hover:text-blue-900 transition-opacity",
              !isExpanded && "opacity-0 group-hover:opacity-100"
            )}
          >
            {isExpanded ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </Button>
        </motion.td>
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
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="bg-white rounded-lg shadow p-4"
                    >
                      <SupplierDataGroup 
                        title="Sprzedawca"
                        data={processSupplierData(supplierData)}
                        confidence={calculateSupplierConfidence(processSupplierData(supplierData))}
                        completeness={calculateSupplierCompleteness(processSupplierData(supplierData))}
                        fieldLabels={{
                          supplierName: 'Sprzedawca',
                          OSD_name: 'Nazwa OSD',
                          OSD_region: 'Region OSD',
                          supplierTaxID: 'NIP',
                          supplierStreet: 'Ulica',
                          supplierBuilding: 'Numer budynku',
                          supplierUnit: 'Numer lokalu',
                          supplierPostalCode: 'Kod pocztowy',
                          supplierCity: 'Miejscowość',
                          supplierBankAccount: 'Numer konta',
                          supplierBankName: 'Nazwa banku',
                          supplierEmail: 'Email',
                          supplierPhone: 'Telefon',
                          supplierWebsite: 'Strona WWW'
                        }}
                        optionalFields={[
                          'supplierUnit',
                          'supplierBankAccount',
                          'supplierBankName',
                          'supplierEmail',
                          'supplierPhone',
                          'supplierWebsite'
                        ]}
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
import { AnalysisResultCard } from './AnalysisResultCard';
import { AnalysisSummary } from './AnalysisSummary';
import type { ProcessingResult } from '@/types/processing';
import type { PPEData, CustomerData, CorrespondenceData, SupplierData, BillingData } from '@/types/fields';
import { calculateUsability } from '@/utils/data-processing/completeness/confidence';
import type { DocumentField } from '@/types/processing';
import type { DocumentSections } from '@/utils/data-processing/completeness/confidence';
import { useState, Fragment } from 'react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentListProps {
  documents: ProcessingResult[];
  onExport?: () => void;
}

function mapFields(fields: Record<string, DocumentField>): {
  fields: {
    ppe: Partial<PPEData>;
    customer: Partial<CustomerData>;
    correspondence: Partial<CorrespondenceData>;
    supplier: Partial<SupplierData>;
    billing: Partial<BillingData>;
  };
  sections: DocumentSections;
} {
  const mappedFields = {
    ppe: {} as Partial<PPEData>,
    customer: {} as Partial<CustomerData>,
    correspondence: {} as Partial<CorrespondenceData>,
    supplier: {} as Partial<SupplierData>,
    billing: {} as Partial<BillingData>
  };

  // Mapuj pola PPE
  const ppeFields = [
    'ppeNum', 'MeterNumber', 'TariffGroup', 'ContractNumber', 'ContractType',
    'dpStreet', 'dpBuilding', 'dpUnit', 'dpPostalCode', 'dpCity',
    'dpProvince', 'dpMunicipality', 'dpDistrict', 'dpMeterID'
  ];
  
  ppeFields.forEach(key => {
    if (key in fields) {
      mappedFields.ppe[key as keyof PPEData] = {
        content: fields[key].content || '',
        confidence: fields[key].confidence || 0,
        metadata: fields[key].metadata || {
          fieldType: 'text',
          transformationType: 'initial',
          source: 'raw'
        }
      };
    }
  });

  // Mapuj pola klienta
  const customerFields = [
    'FirstName', 'LastName', 'BusinessName', 'taxID',
    'Street', 'Building', 'Unit', 'PostalCode', 'City',
    'Municipality', 'District', 'Province'
  ];

  customerFields.forEach(key => {
    if (key in fields) {
      mappedFields.customer[key as keyof CustomerData] = {
        content: fields[key].content || '',
        confidence: fields[key].confidence || 0,
        metadata: fields[key].metadata || {
          fieldType: 'text',
          transformationType: 'initial',
          source: 'raw'
        }
      };
    }
  });

  // Mapuj pola adresu korespondencyjnego
  const correspondenceFields = [
    'paFirstName', 'paLastName', 'paBusinessName', 'paTitle',
    'paStreet', 'paBuilding', 'paUnit', 'paPostalCode', 'paCity',
    'paProvince', 'paMunicipality', 'paDistrict'
  ];

  correspondenceFields.forEach(key => {
    if (key in fields) {
      mappedFields.correspondence[key as keyof CorrespondenceData] = {
        content: fields[key].content || '',
        confidence: fields[key].confidence || 0,
        metadata: fields[key].metadata || {
          fieldType: 'text',
          transformationType: 'initial',
          source: 'raw'
        }
      };
    }
  });

  // Mapuj pola dostawcy
  const supplierFields = [
    'supplierName', 'supplierTaxID', 'supplierStreet', 'supplierBuilding',
    'supplierUnit', 'supplierPostalCode', 'supplierCity', 'supplierProvince',
    'supplierMunicipality', 'supplierDistrict', 'supplierBankAccount',
    'supplierBankName', 'supplierEmail', 'supplierPhone', 'supplierWebsite',
    'OSD_name', 'OSD_region'
  ];

  supplierFields.forEach(key => {
    if (key in fields) {
      mappedFields.supplier[key as keyof SupplierData] = {
        content: fields[key].content || '',
        confidence: fields[key].confidence || 0,
        metadata: fields[key].metadata || {
          fieldType: 'text',
          transformationType: 'initial',
          source: 'raw'
        }
      };
    }
  });

  // Mapuj pola rozliczeniowe
  const billingFields = [
    'BillingStartDate', 'BillingEndDate', 'BilledUsage', '12mUsage'
  ];

  billingFields.forEach(key => {
    if (key in fields) {
      mappedFields.billing[key as keyof BillingData] = {
        content: fields[key].content || '',
        confidence: fields[key].confidence || 0,
        metadata: fields[key].metadata || {
          fieldType: 'text',
          transformationType: 'initial',
          source: 'raw'
        }
      };
    }
  });

  const sections: DocumentSections = {
    ppe: Object.entries(mappedFields.ppe || {}).reduce((acc, [key, value]) => {
      if (value) {
        acc[key] = {
          content: value.content || '',
          confidence: value.confidence || 0,
          metadata: {
            fieldType: value.metadata?.fieldType || 'text',
            transformationType: value.metadata?.transformationType || 'initial',
            source: value.metadata?.source || 'raw'
          }
        };
      }
      return acc;
    }, {} as Record<string, DocumentField>),
    customer: Object.entries(mappedFields.customer || {}).reduce((acc, [key, value]) => {
      if (value) {
        acc[key] = {
          content: value.content || '',
          confidence: value.confidence || 0,
          metadata: {
            fieldType: value.metadata?.fieldType || 'text',
            transformationType: value.metadata?.transformationType || 'initial',
            source: value.metadata?.source || 'raw'
          }
        };
      }
      return acc;
    }, {} as Record<string, DocumentField>),
    correspondence: Object.entries(mappedFields.correspondence || {}).reduce((acc, [key, value]) => {
      if (value) {
        acc[key] = {
          content: value.content || '',
          confidence: value.confidence || 0,
          metadata: {
            fieldType: value.metadata?.fieldType || 'text',
            transformationType: value.metadata?.transformationType || 'initial',
            source: value.metadata?.source || 'raw'
          }
        };
      }
      return acc;
    }, {} as Record<string, DocumentField>),
    supplier: Object.entries(mappedFields.supplier || {}).reduce((acc, [key, value]) => {
      if (value) {
        acc[key] = {
          content: value.content || '',
          confidence: value.confidence || 0,
          metadata: {
            fieldType: value.metadata?.fieldType || 'text',
            transformationType: value.metadata?.transformationType || 'initial',
            source: value.metadata?.source || 'raw'
          }
        };
      }
      return acc;
    }, {} as Record<string, DocumentField>),
    billing: Object.entries(mappedFields.billing || {}).reduce((acc, [key, value]) => {
      if (value) {
        acc[key] = {
          content: value.content || '',
          confidence: value.confidence || 0,
          metadata: {
            fieldType: value.metadata?.fieldType || 'text',
            transformationType: value.metadata?.transformationType || 'initial',
            source: value.metadata?.source || 'raw'
          }
        };
      }
      return acc;
    }, {} as Record<string, DocumentField>)
  };

  return {
    fields: mappedFields,
    sections
  };
}

function truncateFileName(fileName: string, maxLength: number = 40): string {
  if (fileName.length <= maxLength) return fileName;
  
  const extension = fileName.split('.').pop() || '';
  const nameWithoutExt = fileName.slice(0, fileName.length - extension.length - 1);
  
  const truncatedLength = maxLength - extension.length - 4; // -4 for "..." and "."
  const start = nameWithoutExt.slice(0, truncatedLength / 2);
  const end = nameWithoutExt.slice(-(truncatedLength / 2));
  
  return `${start}...${end}.${extension}`;
}

export function DocumentList({ documents, onExport }: DocumentListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const itemsPerPage = 15;
  
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentDocuments = documents.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(documents.length / itemsPerPage);

  const documentResults = documents.map(doc => {
    const fields = doc.modelResults?.[0]?.fields || {};
    const result = mapFields(fields);
    
    return {
      ...result,
      usability: calculateUsability(result.sections)
    };
  });

  const toggleRow = (fileName: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(fileName)) {
      newExpandedRows.delete(fileName);
    } else {
      newExpandedRows.add(fileName);
    }
    setExpandedRows(newExpandedRows);
  };

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-lg border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dokument
              </th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Format
              </th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pewność
              </th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Przydatność
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Akcje</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentDocuments.map((doc, index) => {
              const result = documentResults[indexOfFirstItem + index];
              const isExpanded = expandedRows.has(doc.fileName);
              
              return (
                <Fragment key={doc.fileName}>
                  <tr 
                    className={cn(
                      "hover:bg-gray-50 cursor-pointer",
                      isExpanded && "bg-gray-50"
                    )}
                    onClick={() => toggleRow(doc.fileName)}
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {result.fields.supplier.supplierName?.content || 'Nieznany dostawca'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {truncateFileName(doc.fileName)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        PDF
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={cn(
                        "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
                        doc.confidence >= 0.9 ? "bg-green-100 text-green-800" :
                        doc.confidence >= 0.7 ? "bg-yellow-100 text-yellow-800" :
                        "bg-red-100 text-red-800"
                      )}>
                        {(doc.confidence * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={cn(
                        "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
                        result.usability ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      )}>
                        {result.usability ? "Kompletny" : "Niekompletny"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {result.usability ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleRow(doc.fileName);
                        }}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-gray-50">
                      <td colSpan={6} className="px-6 py-4">
                        <div className="bg-white rounded-lg border p-4">
                          <AnalysisResultCard
                            fileName={doc.fileName}
                            confidence={doc.confidence}
                            supplierData={result.fields.supplier}
                            ppeData={result.fields.ppe}
                            customerData={result.fields.customer}
                            correspondenceData={result.fields.correspondence}
                            billingData={result.fields.billing}
                            usability={result.usability}
                          />
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Paginacja */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg">
          <div className="flex flex-1 justify-between sm:hidden">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Poprzednia
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Następna
            </Button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Wyświetlanie{' '}
                <span className="font-medium">{indexOfFirstItem + 1}</span>
                {' '}-{' '}
                <span className="font-medium">
                  {Math.min(indexOfLastItem, documents.length)}
                </span>
                {' '}z{' '}
                <span className="font-medium">{documents.length}</span>
                {' '}wyników
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <Button
                  variant="outline"
                  className="rounded-l-md"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Poprzednia
                </Button>
                <Button
                  variant="outline"
                  className="rounded-r-md"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Następna
                </Button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
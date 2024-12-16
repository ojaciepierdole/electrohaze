import { AnalysisResultCard } from './AnalysisResultCard';
import { AnalysisSummary } from './AnalysisSummary';
import type { ProcessingResult } from '@/types/processing';
import type { PPEData, CustomerData, CorrespondenceData, SupplierData, BillingData } from '@/types/fields';
import { useState } from 'react';
import { Button } from './ui/button';

interface DocumentListProps {
  documents: ProcessingResult[];
  totalTime?: number;
  onExport?: () => void;
}

function mapFields(fields: Record<string, any>): {
  ppeData: Partial<PPEData>;
  customerData: Partial<CustomerData>;
  correspondenceData: Partial<CorrespondenceData>;
  supplierData: Partial<SupplierData>;
  billingData: Partial<BillingData>;
} {
  const result = {
    ppeData: {} as Partial<PPEData>,
    customerData: {} as Partial<CustomerData>,
    correspondenceData: {} as Partial<CorrespondenceData>,
    supplierData: {} as Partial<SupplierData>,
    billingData: {} as Partial<BillingData>
  };

  // Mapuj pola PPE
  ['ppeNum', 'MeterNumber', 'Tariff', 'ContractNumber', 'ContractType', 'dpStreet', 'dpBuilding', 'dpUnit', 'dpPostalCode', 'dpCity', 'dpProvince', 'dpMunicipality', 'dpDistrict', 'dpMeterID'].forEach(key => {
    if (key in fields) {
      result.ppeData[key as keyof PPEData] = fields[key];
    }
  });

  // Mapuj pola klienta
  ['FirstName', 'LastName', 'BusinessName', 'taxID', 'Street', 'Building', 'Unit', 'PostalCode', 'City', 'Municipality', 'District', 'Province'].forEach(key => {
    if (key in fields) {
      result.customerData[key as keyof CustomerData] = fields[key];
    }
  });

  // Mapuj pola adresu korespondencyjnego
  ['paFirstName', 'paLastName', 'paBusinessName', 'paTitle', 'paStreet', 'paBuilding', 'paUnit', 'paPostalCode', 'paCity', 'paProvince', 'paMunicipality', 'paDistrict'].forEach(key => {
    if (key in fields) {
      result.correspondenceData[key as keyof CorrespondenceData] = fields[key];
    }
  });

  // Mapuj pola dostawcy
  ['supplierName', 'spTaxID', 'spStreet', 'spBuilding', 'spUnit', 'spPostalCode', 'spCity', 'spProvince', 'spMunicipality', 'spDistrict', 'spIBAN', 'spPhoneNum', 'spWebUrl', 'OSD_name', 'OSD_region'].forEach(key => {
    if (key in fields) {
      result.supplierData[key as keyof SupplierData] = fields[key];
    }
  });

  // Mapuj pola rozliczeniowe
  ['BillingStartDate', 'BillingEndDate', 'BilledUsage', '12mUsage'].forEach(key => {
    const mappedKey = key === 'BillingStartDate' ? 'billingStartDate' :
                     key === 'BillingEndDate' ? 'billingEndDate' :
                     key === 'BilledUsage' ? 'billedUsage' :
                     key === '12mUsage' ? 'usage12m' : key;
    
    if (key in fields) {
      result.billingData[mappedKey as keyof BillingData] = fields[key];
    }
  });

  return result;
}

export function DocumentList({ documents, totalTime, onExport }: DocumentListProps) {
  // Dodaj stan dla paginacji
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  
  // Oblicz indeksy dla aktualnej strony
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentDocuments = documents.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(documents.length / itemsPerPage);

  return (
    <div className="space-y-6">
      <AnalysisSummary 
        documents={documents}
        totalTime={totalTime}
        onExport={onExport}
      />
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-300">
            <thead>
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 w-[40%]">
                  Dostawca
                </th>
                <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900 w-[20%]">
                  Pewność
                </th>
                <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900 w-[20%]">
                  Kompletność
                </th>
                <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900 w-[15%]">
                  Przydatność
                </th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 w-[5%]">
                  <span className="sr-only">Akcje</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {currentDocuments.map((doc, index) => {
                const mappedData = doc.mappedData || {};
                const fields = doc.modelResults[0]?.fields || {};
                
                const data = {
                  ppeData: mappedData.ppeData || mapFields(fields).ppeData,
                  customerData: mappedData.customerData || mapFields(fields).customerData,
                  correspondenceData: mappedData.correspondenceData || mapFields(fields).correspondenceData,
                  supplierData: mappedData.supplierData || mapFields(fields).supplierData,
                  billingData: mappedData.billingData || mapFields(fields).billingData,
                };

                return (
                  <AnalysisResultCard
                    key={index}
                    fileName={doc.fileName}
                    confidence={doc.modelResults[0]?.confidence || 0}
                    {...data}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Paginacja */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
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
                  {/* Tu możesz dodać numery stron jeśli chcesz */}
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
      
      {/* Footer */}
      <footer className="mt-auto py-6 border-t">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-center space-y-4">
            <p className="text-sm text-gray-500">
              © 2024 Document Analysis. Wszelkie prawa zastrzeżone.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-sm text-gray-500 hover:text-gray-900">O nas</a>
              <a href="#" className="text-sm text-gray-500 hover:text-gray-900">Kontakt</a>
              <a href="#" className="text-sm text-gray-500 hover:text-gray-900">Polityka prywatności</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 
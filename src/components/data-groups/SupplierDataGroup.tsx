import React from 'react';
import { DataGroup } from '@/components/data-groups/DataGroup';
import type { DocumentField, ProcessSectionContext } from '@/types/document-processing';
import { processSection } from '@/utils/data-processing';
import type { SupplierData, PPEData, CustomerData, CorrespondenceData } from '@/types/fields';
import { getOSDInfoByPostalCode } from '@/utils/osd-mapping';
import { Eraser } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface SupplierDataGroupProps {
  data: SupplierData;
  ppeData?: PPEData;
  customerData?: CustomerData;
  correspondenceData?: CorrespondenceData;
}

interface ProcessingContext {
  ppe: Partial<PPEData>;
  customer: Partial<CustomerData>;
  correspondence: Partial<CorrespondenceData>;
}

export const SupplierDataGroup: React.FC<SupplierDataGroupProps> = ({ 
  data,
  ppeData,
  customerData,
  correspondenceData
}) => {
  console.log('SupplierDataGroup input:', { data, ppeData, customerData, correspondenceData });

  // Przygotuj kontekst przetwarzania
  const context: ProcessingContext = {
    ppe: ppeData || {},
    customer: customerData || {},
    correspondence: correspondenceData || {}
  };

  // Przetwórz dane dostawcy z uwzględnieniem kontekstu
  const processedData = processSection<SupplierData>('supplier', data, context);
  console.log('SupplierDataGroup processedData:', processedData);

  // Jeśli mamy dane OSD z faktury, zachowujemy je, tylko normalizując nazewnictwo
  if (data.OSD_name?.content) {
    console.log('Found OSD in invoice:', data.OSD_name);
    const normalizedInfo = getOSDInfoByPostalCode(data.supplierPostalCode?.content || '');
    console.log('Normalized OSD info:', normalizedInfo);
    
    if (normalizedInfo && normalizedInfo.name.toUpperCase().includes(data.OSD_name.content.toUpperCase())) {
      processedData.OSD_name = {
        ...data.OSD_name,
        content: normalizedInfo.name,
        isEnriched: true
      };
      if (data.OSD_region) {
        processedData.OSD_region = data.OSD_region;
      } 
      else if (normalizedInfo.region) {
        processedData.OSD_region = {
          content: normalizedInfo.region,
          confidence: data.OSD_name.confidence,
          isEnriched: true
        };
      }
    }
  } 
  else {
    if (ppeData?.dpPostalCode?.content) {
      console.log('Looking up OSD by PPE postal code:', ppeData.dpPostalCode.content);
      const info = getOSDInfoByPostalCode(ppeData.dpPostalCode.content);
      console.log('Found OSD info from PPE:', info);
      
      if (info) {
        processedData.OSD_name = {
          content: info.name,
          confidence: ppeData.dpPostalCode.confidence || 1.0,
          isEnriched: true
        };
        processedData.OSD_region = {
          content: info.region,
          confidence: ppeData.dpPostalCode.confidence || 1.0,
          isEnriched: true
        };
      }
    }
    else if (correspondenceData?.paPostalCode?.content) {
      console.log('Looking up OSD by correspondence postal code:', correspondenceData.paPostalCode.content);
      const info = getOSDInfoByPostalCode(correspondenceData.paPostalCode.content);
      console.log('Found OSD info from correspondence:', info);
      
      if (info) {
        processedData.OSD_name = {
          content: info.name,
          confidence: correspondenceData.paPostalCode.confidence || 0.9,
          isEnriched: true
        };
        processedData.OSD_region = {
          content: info.region,
          confidence: correspondenceData.paPostalCode.confidence || 0.9,
          isEnriched: true
        };
      }
    }
    else if (customerData?.PostalCode?.content) {
      console.log('Looking up OSD by customer postal code:', customerData.PostalCode.content);
      const info = getOSDInfoByPostalCode(customerData.PostalCode.content);
      console.log('Found OSD info from customer:', info);
      
      if (info) {
        processedData.OSD_name = {
          content: info.name,
          confidence: customerData.PostalCode.confidence || 0.8,
          isEnriched: true
        };
        processedData.OSD_region = {
          content: info.region,
          confidence: customerData.PostalCode.confidence || 0.8,
          isEnriched: true
        };
      }
    }
  }

  console.log('Final processedData:', processedData);

  // Wydzielamy dane nagłówkowe (dostawca i OSD)
  const headerData: Partial<SupplierData> = {
    supplierName: processedData.supplierName,
    OSD_name: processedData.OSD_name,
    OSD_region: processedData.OSD_region
  };

  // Pozostałe dane dostawcy
  const tempData: Record<keyof SupplierData, DocumentField | undefined> = { ...processedData };
  delete tempData.supplierName;
  delete tempData.OSD_name;
  delete tempData.OSD_region;

  // Filtrujemy undefined i tworzymy obiekt tylko z istniejącymi polami
  const remainingData: Record<string, DocumentField> = Object.entries(tempData)
    .filter((entry): entry is [string, DocumentField] => entry[1] !== undefined)
    .reduce((acc, [key, value]) => ({
      ...acc,
      [key]: value
    }), {});

  return (
    <div className="space-y-4">
      <Card>
        <div className="grid grid-cols-[2fr_1.5fr_1fr] gap-12 p-6">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <span>Sprzedawca</span>
              {processedData.supplierName?.confidence && (
                <div className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${
                    processedData.supplierName.confidence > 0.8 ? 'bg-green-500' : 
                    processedData.supplierName.confidence > 0.6 ? 'bg-yellow-500' : 
                    'bg-red-500'
                  }`} />
                  <span className="text-xs">
                    {Math.round(processedData.supplierName.confidence * 100)}%
                  </span>
                </div>
              )}
            </div>
            {processedData.supplierName?.content && (
              <div className="flex items-center">
                <span className="font-medium">
                  {processedData.supplierName.content}
                </span>
                {processedData.supplierName.isEnriched && (
                  <Eraser className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
                )}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <span>Nazwa OSD</span>
              {processedData.OSD_name?.confidence && (
                <div className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${
                    processedData.OSD_name.confidence > 0.8 ? 'bg-green-500' : 
                    processedData.OSD_name.confidence > 0.6 ? 'bg-yellow-500' : 
                    'bg-red-500'
                  }`} />
                  <span className="text-xs">
                    {Math.round(processedData.OSD_name.confidence * 100)}%
                  </span>
                </div>
              )}
            </div>
            {processedData.OSD_name?.content && (
              <div className="flex items-center">
                <span className="font-medium">
                  {processedData.OSD_name.content}
                </span>
                {processedData.OSD_name.isEnriched && (
                  <Eraser className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
                )}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <span>Region OSD</span>
              {processedData.OSD_region?.confidence && (
                <div className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${
                    processedData.OSD_region.confidence > 0.8 ? 'bg-green-500' : 
                    processedData.OSD_region.confidence > 0.6 ? 'bg-yellow-500' : 
                    'bg-red-500'
                  }`} />
                  <span className="text-xs">
                    {Math.round(processedData.OSD_region.confidence * 100)}%
                  </span>
                </div>
              )}
            </div>
            {processedData.OSD_region?.content && (
              <div className="flex items-center">
                <span className="font-medium">
                  {processedData.OSD_region.content}
                </span>
                {processedData.OSD_region.isEnriched && (
                  <Eraser className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
                )}
              </div>
            )}
          </div>
        </div>
      </Card>

      {Object.keys(remainingData).length > 0 && (
        <DataGroup
          title="Dane dostawcy"
          data={remainingData}
          fieldLabels={{
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
        />
      )}
    </div>
  );
}; 
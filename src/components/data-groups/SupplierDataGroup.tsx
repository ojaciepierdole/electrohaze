import React from 'react';
import { DataGroup } from '@/components/data-groups/DataGroup';
import type { DocumentField } from '@/types/document-processing';
import { processSection } from '@/utils/data-processing';
import type { SupplierData, PPEData, CustomerData, CorrespondenceData } from '@/types/fields';
import { getOSDInfoByPostalCode } from '@/utils/osd-mapping';
import { Eraser } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface SupplierDataGroupProps {
  data: Partial<SupplierData>;
  ppeData?: Partial<PPEData>;
  customerData?: Partial<CustomerData>;
  correspondenceData?: Partial<CorrespondenceData>;
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
  // Przygotuj kontekst przetwarzania
  const context: ProcessingContext = {
    ppe: ppeData || {},
    customer: customerData || {},
    correspondence: correspondenceData || {}
  };

  // Przetwórz dane dostawcy z uwzględnieniem kontekstu
  const processedData = processSection<SupplierData>('supplier', data, context);

  // Jeśli mamy dane OSD z faktury, zachowujemy je, tylko normalizując nazewnictwo
  if (data.OSD_name?.content) {
    const normalizedInfo = getOSDInfoByPostalCode(data.spPostalCode?.content || '');
    
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
      const info = getOSDInfoByPostalCode(ppeData.dpPostalCode.content);
      
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
      const info = getOSDInfoByPostalCode(correspondenceData.paPostalCode.content);
      
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
      const info = getOSDInfoByPostalCode(customerData.PostalCode.content);
      
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
            spTaxID: 'NIP',
            spStreet: 'Ulica',
            spBuilding: 'Numer budynku',
            spUnit: 'Numer lokalu',
            spPostalCode: 'Kod pocztowy',
            spCity: 'Miejscowość',
            spIBAN: 'Numer konta',
            spPhoneNum: 'Telefon',
            spWebUrl: 'Strona WWW'
          }}
        />
      )}
    </div>
  );
}; 
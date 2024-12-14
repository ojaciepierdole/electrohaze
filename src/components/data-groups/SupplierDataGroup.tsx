import React from 'react';
import { DataGroup } from '@/components/data-groups/DataGroup';
import type { DocumentField } from '@/types/document-processing';
import { processSection } from '@/utils/data-processing';
import type { ProcessSectionInput } from '@/utils/data-processing';
import type { SupplierData, PPEData, CustomerData, CorrespondenceData } from '@/types/fields';
import { getOSDInfoByPostalCode } from '@/utils/osd-mapping';
import { SupplierLogo } from '@/components/ui/supplier-logo';
import { ConfidenceDot } from '@/components/ui/confidence-dot';
import { Eraser } from 'lucide-react';

interface SupplierDataGroupProps {
  data: SupplierData;
  ppeData?: PPEData;
  customerData?: CustomerData;
  correspondenceData?: CorrespondenceData;
}

export const SupplierDataGroup: React.FC<SupplierDataGroupProps> = ({ 
  data,
  ppeData,
  customerData,
  correspondenceData
}) => {
  console.log('SupplierDataGroup input:', { data, ppeData, customerData, correspondenceData });

  // Przygotuj dane wejściowe z kontekstem
  const inputData: ProcessSectionInput = {
    ...data,
    _context: {
      ppe: ppeData || {},
      customer: customerData || {},
      correspondence: correspondenceData || {}
    }
  };

  // Przetwórz dane dostawcy z uwzględnieniem kontekstu
  const processedData = processSection<SupplierData>('supplier', inputData);
  console.log('SupplierDataGroup processedData:', processedData);

  // Jeśli mamy dane OSD z faktury, zachowujemy je, tylko normalizując nazewnictwo
  if (data.OSD_name?.content) {
    console.log('Found OSD in invoice:', data.OSD_name);
    const normalizedInfo = getOSDInfoByPostalCode(data.supplierPostalCode?.content || '');
    console.log('Normalized OSD info:', normalizedInfo);
    
    if (normalizedInfo && normalizedInfo.name.toUpperCase().includes(data.OSD_name.content.toUpperCase())) {
      // Zachowujemy oryginalną pewność, tylko oznaczamy jako wzbogacone
      processedData.OSD_name = {
        ...data.OSD_name,
        content: normalizedInfo.name,
        isEnriched: true
      };
      // Jeśli mamy region w fakturze, zachowujemy go bez zmian
      if (data.OSD_region) {
        processedData.OSD_region = data.OSD_region;
      } 
      // Jeśli nie mamy regionu w fakturze, ale znaleźliśmy go w mapowaniu
      else if (normalizedInfo.region) {
        processedData.OSD_region = {
          content: normalizedInfo.region,
          confidence: data.OSD_name.confidence,
          isEnriched: true
        };
      }
    }
  } 
  // Jeśli nie mamy danych OSD z faktury, próbujemy znaleźć na podstawie kodów pocztowych
  else {
    // Sprawdź kod pocztowy z PPE
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
    // Jeśli nie znaleziono w PPE, sprawdź adres korespondencyjny
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
    // Jeśli nie znaleziono w adresie korespondencyjnym, sprawdź adres zamieszkania
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

  return (
    <DataGroup
      title="Dane dostawcy"
      data={processedData}
      fieldLabels={{
        supplierName: '',
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
      renderField={(key, field) => {
        if (key === 'supplierName' && field.content) {
          return (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <SupplierLogo supplierName={field.content} className="w-8 h-8" />
                <h2 className="text-xl font-medium">{field.content}</h2>
                <ConfidenceDot confidence={field.confidence ?? 0} />
                {field.isEnriched && (
                  <Eraser className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </div>
          );
        }
        return field.content;
      }}
    />
  );
}; 
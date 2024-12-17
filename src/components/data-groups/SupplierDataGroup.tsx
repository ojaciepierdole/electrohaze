'use client';

import React from 'react';
import { DataGroup } from '@/components/data-groups/DataGroup';
import type { DocumentField } from '@/types/document-processing';
import { processSection } from '@/utils/data-processing';
import type { SupplierData, PPEData, CustomerData } from '@/types/fields';
import { normalizeOSDName, arePostalCodesCompatible } from '@/utils/data-processing/mappings/osd-mappings';

interface SupplierDataGroupProps {
  data: Partial<SupplierData>;
  ppeData?: Partial<PPEData>;
  customerData?: Partial<CustomerData>;
}

export const SupplierDataGroup: React.FC<SupplierDataGroupProps> = ({ data, ppeData, customerData }) => {
  // Konwertuj dane do wymaganego formatu
  const processedData = processSection('supplier', data) as Record<string, DocumentField | undefined>;

  // Normalizuj nazwę OSD na podstawie kodów pocztowych
  const ppePostalCode = ppeData?.dpPostalCode?.content;
  const customerPostalCode = customerData?.PostalCode?.content;

  if (ppePostalCode && customerPostalCode && arePostalCodesCompatible(ppePostalCode, customerPostalCode)) {
    const normalizedOSD = normalizeOSDName(ppePostalCode);
    if (normalizedOSD) {
      processedData.OSD_name = {
        content: normalizedOSD.name,
        confidence: 1,
        isEnriched: true,
        metadata: {
          fieldType: 'string',
          transformationType: 'osd_normalization',
          originalValue: processedData.OSD_name?.content
        }
      };
      processedData.OSD_region = {
        content: normalizedOSD.region,
        confidence: 1,
        isEnriched: true,
        metadata: {
          fieldType: 'string',
          transformationType: 'osd_normalization',
          originalValue: processedData.OSD_region?.content
        }
      };
    }
  }

  // Przetwórz numer budynku i lokalu
  if (processedData.supplierBuilding?.content) {
    const [buildingNumber, unitNumber] = processedData.supplierBuilding.content.split('/');
    if (buildingNumber) {
      processedData.supplierBuilding = {
        ...processedData.supplierBuilding,
        content: buildingNumber.trim()
      };
    }
    if (unitNumber) {
      processedData.supplierUnit = {
        content: unitNumber.trim(),
        confidence: processedData.supplierBuilding.confidence,
        isEnriched: processedData.supplierBuilding.isEnriched,
        metadata: processedData.supplierBuilding.metadata
      };
    }
  }

  // Oblicz średnią pewność dla pól z danymi
  const fieldsWithConfidence = Object.values(processedData)
    .filter((field): field is DocumentField => field?.confidence !== undefined);
  const averageConfidence = fieldsWithConfidence.length > 0
    ? fieldsWithConfidence.reduce((acc, field) => acc + field.confidence, 0) / fieldsWithConfidence.length
    : 0;

  // Oblicz kompletność
  const requiredFields = ['supplierName', 'OSD_name', 'OSD_region'];
  const filledRequiredFields = requiredFields.filter(key => processedData[key]?.content).length;
  const completeness = Math.round((filledRequiredFields / requiredFields.length) * 100);

  return (
    <DataGroup
      title="Sprzedawca"
      confidence={averageConfidence}
      completeness={completeness}
      data={processedData}
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
  );
}; 
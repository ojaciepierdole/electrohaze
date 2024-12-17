'use client';

import React from 'react';
import { DataGroup } from '@/components/data-groups/DataGroup';
import type { DocumentField } from '@/types/document-processing';
import { processSection } from '@/utils/data-processing';
import type { SupplierData } from '@/types/fields';

interface SupplierDataGroupProps {
  data: Partial<SupplierData>;
}

export const SupplierDataGroup: React.FC<SupplierDataGroupProps> = ({ data }) => {
  // Konwertuj dane do wymaganego formatu
  const processedData = processSection('supplier', data) as Record<string, DocumentField | undefined>;

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
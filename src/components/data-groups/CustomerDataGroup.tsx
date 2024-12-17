'use client';

import React from 'react';
import { DataGroup } from '@/components/data-groups/DataGroup';
import type { DocumentField } from '@/types/document-processing';
import { processSection } from '@/utils/data-processing';
import type { CustomerData } from '@/types/fields';

interface CustomerDataGroupProps {
  data: Partial<CustomerData>;
}

export const CustomerDataGroup: React.FC<CustomerDataGroupProps> = ({ data }) => {
  // Konwertuj dane do wymaganego formatu
  const processedData = processSection('customer', data) as Record<string, DocumentField | undefined>;

  // Oblicz średnią pewność dla pól z danymi
  const fieldsWithConfidence = Object.values(processedData)
    .filter((field): field is DocumentField => field?.confidence !== undefined);
  const averageConfidence = fieldsWithConfidence.length > 0
    ? fieldsWithConfidence.reduce((acc, field) => acc + field.confidence, 0) / fieldsWithConfidence.length
    : 0;

  // Oblicz kompletność
  const requiredFields = ['FirstName', 'LastName', 'Street', 'Building', 'PostalCode', 'City'];
  const filledRequiredFields = requiredFields.filter(key => processedData[key]?.content).length;
  const completeness = Math.round((filledRequiredFields / requiredFields.length) * 100);

  return (
    <DataGroup
      title="Dane klienta"
      confidence={averageConfidence}
      completeness={completeness}
      data={processedData}
      fieldLabels={{
        FirstName: 'Imię',
        LastName: 'Nazwisko',
        BusinessName: 'Nazwa firmy',
        taxID: 'NIP',
        Street: 'Ulica',
        Building: 'Numer budynku',
        Unit: 'Numer lokalu',
        PostalCode: 'Kod pocztowy',
        City: 'Miejscowość',
        Municipality: 'Gmina',
        District: 'Powiat',
        Province: 'Województwo'
      }}
      optionalFields={[
        'BusinessName',
        'taxID',
        'Unit',
        'Municipality',
        'District',
        'Province'
      ]}
    />
  );
}; 
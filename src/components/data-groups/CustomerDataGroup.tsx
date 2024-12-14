import React from 'react';
import { DataGroup } from '@/components/data-groups/DataGroup';
import type { DocumentField } from '@/types/document-processing';
import { processSection } from '@/utils/data-processing';
import type { CustomerData } from '@/types/fields';

interface CustomerDataGroupProps {
  data: CustomerData;
}

export const CustomerDataGroup: React.FC<CustomerDataGroupProps> = ({ data }) => {
  // Przetwórz dane klienta
  const processedData = processSection('customer', data);

  return (
    <DataGroup
      title="Dane klienta"
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
    />
  );
}; 
import React from 'react';
import { DataGroup } from '@/components/data-groups/DataGroup';
import type { DocumentField } from '@/types/document-processing';
import { processSection } from '@/utils/data-processing';
import type { CustomerData } from '@/types/fields';

interface CustomerDataGroupProps {
  data: Partial<CustomerData>;
}

export const CustomerDataGroup: React.FC<CustomerDataGroupProps> = ({ data }) => {
  console.log('CustomerDataGroup input:', data);

  // Przetwórz dane klienta
  const processedData = processSection<CustomerData>('customer', data);
  console.log('CustomerDataGroup processedData:', processedData);

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
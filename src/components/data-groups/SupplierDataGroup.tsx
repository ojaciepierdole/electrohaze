import React from 'react';
import { DataGroup } from '@/components/data-groups/DataGroup';
import type { DocumentField } from '@/types/document-processing';
import { processSection } from '@/utils/data-processing';
import type { SupplierData } from '@/types/fields';

interface SupplierDataGroupProps {
  data: SupplierData;
}

export const SupplierDataGroup: React.FC<SupplierDataGroupProps> = ({ data }) => {
  // Przetwórz dane dostawcy
  const processedData = processSection('supplier', data);

  return (
    <DataGroup
      title="Dane dostawcy"
      data={processedData}
      fieldLabels={{
        supplierName: 'Nazwa',
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
        supplierWebsite: 'Strona WWW',
        OSD_name: 'Nazwa OSD',
        OSD_region: 'Region OSD'
      }}
    />
  );
}; 
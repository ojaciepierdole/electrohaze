import React from 'react';
import { DataGroup } from '@/components/data-groups/DataGroup';
import type { DocumentField } from '@/types/document-processing';
import { processSection } from '@/utils/data-processing';
import type { PPEData } from '@/types/fields';

interface PPEDataGroupProps {
  data: PPEData;
}

export const PPEDataGroup: React.FC<PPEDataGroupProps> = ({ data }) => {
  console.log('PPEDataGroup input:', data);

  // Przetwórz dane PPE
  const processedData = processSection('ppe', data);
  console.log('PPEDataGroup processedData:', processedData);

  return (
    <DataGroup
      title="Dane PPE"
      data={processedData}
      fieldLabels={{
        ppeNum: 'Numer PPE',
        MeterNumber: 'Numer licznika',
        TariffGroup: 'Grupa taryfowa',
        ContractNumber: 'Numer umowy',
        ContractType: 'Typ umowy',
        dpStreet: 'Ulica',
        dpBuilding: 'Numer budynku',
        dpUnit: 'Numer lokalu',
        dpPostalCode: 'Kod pocztowy',
        dpCity: 'Miejscowość',
        dpMunicipality: 'Gmina',
        dpDistrict: 'Powiat',
        dpProvince: 'Województwo'
      }}
    />
  );
}; 
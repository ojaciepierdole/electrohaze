import React from 'react';
import { DataGroup } from '@/components/data-groups/DataGroup';
import type { DocumentField } from '@/types/document-processing';
import { processSection } from '@/utils/data-processing';
import type { PPEData } from '@/types/fields';

interface PPEDataGroupProps {
  data: Partial<PPEData>;
}

export const PPEDataGroup: React.FC<PPEDataGroupProps> = ({ data }) => {
  // Przetwórz dane PPE
  const processedData = processSection<PPEData>('ppe', data);

  return (
    <DataGroup
      title="Dane PPE"
      data={processedData}
      fieldLabels={{
        ppeNum: 'Numer PPE',
        MeterNumber: 'Numer licznika',
        Tariff: 'Grupa taryfowa',
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
      optionalFields={[
        'MeterNumber',
        'ContractNumber',
        'ContractType',
        'dpStreet',
        'dpBuilding',
        'dpUnit',
        'dpPostalCode',
        'dpCity',
        'dpMunicipality',
        'dpDistrict',
        'dpProvince'
      ]}
    />
  );
}; 
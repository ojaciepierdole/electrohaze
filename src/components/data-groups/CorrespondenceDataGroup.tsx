import React from 'react';
import { DataGroup } from '@/components/data-groups/DataGroup';
import type { DocumentField } from '@/types/document-processing';
import { processSection } from '@/utils/data-processing';
import type { CorrespondenceData } from '@/types/fields';

interface CorrespondenceDataGroupProps {
  data: CorrespondenceData;
}

export const CorrespondenceDataGroup: React.FC<CorrespondenceDataGroupProps> = ({ data }) => {
  console.log('CorrespondenceDataGroup input:', data);

  // Przetwórz dane adresu korespondencyjnego
  const processedData = processSection('correspondence', data);
  console.log('CorrespondenceDataGroup processedData:', processedData);

  return (
    <DataGroup
      title="Adres korespondencyjny"
      data={processedData}
      fieldLabels={{
        paFirstName: 'Imię',
        paLastName: 'Nazwisko',
        paBusinessName: 'Nazwa firmy',
        paTitle: 'Tytuł',
        paStreet: 'Ulica',
        paBuilding: 'Numer budynku',
        paUnit: 'Numer lokalu',
        paPostalCode: 'Kod pocztowy',
        paCity: 'Miejscowość'
      }}
    />
  );
}; 
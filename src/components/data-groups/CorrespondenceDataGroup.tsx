import React from 'react';
import { DataGroup } from '@/components/data-groups/DataGroup';
import type { DocumentField } from '@/types/document-processing';
import { processSection } from '@/utils/data-processing';
import type { CorrespondenceData } from '@/types/fields';

interface CorrespondenceDataGroupProps {
  data: CorrespondenceData;
}

export const CorrespondenceDataGroup: React.FC<CorrespondenceDataGroupProps> = ({ data }) => {
  // Przetwórz dane korespondencyjne
  const processedData = processSection('correspondence', data);

  return (
    <DataGroup
      title="Dane korespondencyjne"
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
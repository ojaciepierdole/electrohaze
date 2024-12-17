'use client';

import React from 'react';
import { DataGroup } from '@/components/data-groups/DataGroup';
import type { FieldWithConfidence } from '@/types/processing';
import { processSection } from '@/utils/data-processing';
import type { CorrespondenceData } from '@/types/fields';

interface CorrespondenceDataGroupProps {
  data: Partial<CorrespondenceData>;
}

export const CorrespondenceDataGroup: React.FC<CorrespondenceDataGroupProps> = ({ data }) => {
  // Konwertuj dane do wymaganego formatu
  const processedData = processSection('correspondence', data) as Record<string, FieldWithConfidence | undefined>;

  // Przetwórz numer budynku i lokalu
  if (processedData.paBuilding?.content) {
    const [buildingNumber, unitNumber] = processedData.paBuilding.content.split('/');
    if (buildingNumber) {
      processedData.paBuilding = {
        ...processedData.paBuilding,
        content: buildingNumber.trim()
      };
    }
    if (unitNumber) {
      processedData.paUnit = {
        content: unitNumber.trim(),
        confidence: processedData.paBuilding.confidence,
        isEnriched: processedData.paBuilding.isEnriched,
        metadata: processedData.paBuilding.metadata
      };
    }
  }

  // Oblicz średnią pewność dla pól z danymi
  const fieldsWithConfidence = Object.values(processedData)
    .filter((field): field is FieldWithConfidence => field?.confidence !== undefined);
  const averageConfidence = fieldsWithConfidence.length > 0
    ? fieldsWithConfidence.reduce((acc, field) => acc + field.confidence, 0) / fieldsWithConfidence.length
    : 0;

  // Oblicz kompletność
  const requiredFields = ['paStreet', 'paBuilding', 'paPostalCode', 'paCity'];
  const filledRequiredFields = requiredFields.filter(key => processedData[key]?.content).length;
  const completeness = Math.round((filledRequiredFields / requiredFields.length) * 100);

  return (
    <DataGroup
      title="Adres korespondencyjny"
      confidence={averageConfidence}
      completeness={completeness}
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
      optionalFields={[
        'paFirstName',
        'paLastName',
        'paBusinessName',
        'paTitle',
        'paUnit'
      ]}
    />
  );
}; 
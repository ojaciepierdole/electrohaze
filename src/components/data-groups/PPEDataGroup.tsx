'use client';

import React from 'react';
import { DataGroup } from '@/components/data-groups/DataGroup';
import type { FieldWithConfidence } from '@/types/processing';
import { processSection } from '@/utils/data-processing';
import type { PPEData } from '@/types/fields';

interface PPEDataGroupProps {
  data: Partial<PPEData>;
}

export const PPEDataGroup: React.FC<PPEDataGroupProps> = ({ data }) => {
  // Konwertuj dane do wymaganego formatu
  const processedData = processSection('ppe', data) as Record<string, FieldWithConfidence | undefined>;

  // Przetwórz numer budynku i lokalu
  if (processedData.dpBuilding?.content) {
    const [buildingNumber, unitNumber] = processedData.dpBuilding.content.split('/');
    if (buildingNumber) {
      processedData.dpBuilding = {
        ...processedData.dpBuilding,
        content: buildingNumber.trim()
      };
    }
    if (unitNumber) {
      processedData.dpUnit = {
        content: unitNumber.trim(),
        confidence: processedData.dpBuilding.confidence,
        metadata: {
          fieldType: 'text',
          transformationType: 'split',
          source: 'derived',
          status: 'success',
          originalValue: processedData.dpBuilding.content
        }
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
  const requiredFields = ['ppeNum', 'TariffGroup'];
  const filledRequiredFields = requiredFields.filter(key => processedData[key]?.content).length;
  const completeness = Math.round((filledRequiredFields / requiredFields.length) * 100);

  return (
    <DataGroup
      title="Dane PPE"
      confidence={averageConfidence}
      completeness={completeness}
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
      optionalFields={[
        'MeterNumber',
        'ContractNumber',
        'ContractType',
        'dpUnit',
        'dpMunicipality',
        'dpDistrict',
        'dpProvince'
      ]}
    />
  );
}; 
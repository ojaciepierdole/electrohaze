'use client';

import React from 'react';
import type { FieldWithConfidence } from '@/types/processing';
import type { PPEData } from '@/types/fields';

interface PPEDataGroupProps {
  data: Partial<PPEData>;
}

export const PPEDataGroup: React.FC<PPEDataGroupProps> = ({ data }) => {
  const fieldLabels: Record<string, string> = {
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
  };

  const optionalFields = [
    'MeterNumber',
    'ContractNumber',
    'ContractType',
    'dpUnit',
    'dpMunicipality',
    'dpDistrict',
    'dpProvince'
  ];

  // Przetwórz numer budynku i lokalu
  if (data.dpBuilding?.content) {
    const [buildingNumber, unitNumber] = data.dpBuilding.content.split('/');
    if (buildingNumber) {
      data.dpBuilding = {
        ...data.dpBuilding,
        content: buildingNumber.trim()
      };
    }
    if (unitNumber && !data.dpUnit) {
      data.dpUnit = {
        content: unitNumber.trim(),
        confidence: data.dpBuilding.confidence,
        metadata: {
          fieldType: 'text',
          transformationType: 'split',
          source: 'derived',
          status: 'success',
          originalValue: data.dpBuilding.content
        }
      };
    }
  }

  return (
    <div className="rounded-lg border divide-y">
      {Object.entries(fieldLabels).map(([key, label]) => {
        const field = data[key as keyof PPEData];
        if (!field?.content || (optionalFields.includes(key) && field.content.trim() === '')) {
          return null;
        }

        return (
          <div key={key} className="flex items-center justify-between px-4 py-2">
            <span className="text-sm text-gray-600">{label}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900">
                {field.content}
              </span>
              {field.confidence && (
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                  field.confidence > 0.8 ? 'bg-green-50 text-green-700' : 
                  field.confidence > 0.6 ? 'bg-yellow-50 text-yellow-700' : 
                  'bg-red-50 text-red-700'
                }`}>
                  {Math.round(field.confidence * 100)}%
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}; 
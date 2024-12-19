'use client';

import React from 'react';
import type { FieldWithConfidence } from '@/types/processing';
import type { CorrespondenceData } from '@/types/fields';

interface CorrespondenceDataGroupProps {
  data: Partial<CorrespondenceData>;
}

export const CorrespondenceDataGroup: React.FC<CorrespondenceDataGroupProps> = ({ data }) => {
  const fieldLabels: Record<string, string> = {
    paFirstName: 'Imię',
    paLastName: 'Nazwisko',
    paBusinessName: 'Nazwa firmy',
    paTitle: 'Tytuł',
    paStreet: 'Ulica',
    paBuilding: 'Numer budynku',
    paUnit: 'Numer lokalu',
    paPostalCode: 'Kod pocztowy',
    paCity: 'Miejscowość'
  };

  const optionalFields = [
    'paFirstName',
    'paLastName',
    'paBusinessName',
    'paTitle',
    'paUnit'
  ];

  // Przetwórz numer budynku i lokalu
  if (data.paBuilding?.content) {
    const [buildingNumber, unitNumber] = data.paBuilding.content.split('/');
    if (buildingNumber) {
      data.paBuilding = {
        ...data.paBuilding,
        content: buildingNumber.trim()
      };
    }
    if (unitNumber && !data.paUnit) {
      data.paUnit = {
        content: unitNumber.trim(),
        confidence: data.paBuilding.confidence,
        isEnriched: data.paBuilding.isEnriched,
        metadata: data.paBuilding.metadata
      };
    }
  }

  return (
    <div className="rounded-lg border divide-y">
      {Object.entries(fieldLabels).map(([key, label]) => {
        const field = data[key as keyof CorrespondenceData];
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
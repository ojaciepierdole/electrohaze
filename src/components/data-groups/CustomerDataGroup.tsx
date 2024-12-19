'use client';

import React from 'react';
import type { FieldWithConfidence } from '@/types/processing';
import type { CustomerData } from '@/types/fields';

interface CustomerDataGroupProps {
  data: Partial<CustomerData>;
}

export const CustomerDataGroup: React.FC<CustomerDataGroupProps> = ({ data }) => {
  const fieldLabels: Record<string, string> = {
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
  };

  const optionalFields = [
    'BusinessName',
    'taxID',
    'Unit',
    'Municipality',
    'District',
    'Province'
  ];

  // Przetwórz numer budynku i lokalu
  if (data.Building?.content) {
    const [buildingNumber, unitNumber] = data.Building.content.split('/');
    if (buildingNumber) {
      data.Building = {
        ...data.Building,
        content: buildingNumber.trim()
      };
    }
    if (unitNumber && !data.Unit) {
      data.Unit = {
        content: unitNumber.trim(),
        confidence: data.Building.confidence,
        metadata: {
          fieldType: 'text',
          transformationType: 'split',
          source: 'derived',
          status: 'success',
          originalValue: data.Building.content
        }
      };
    }
  }

  return (
    <div className="rounded-lg border divide-y">
      {Object.entries(fieldLabels).map(([key, label]) => {
        const field = data[key as keyof CustomerData];
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
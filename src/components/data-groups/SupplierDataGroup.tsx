'use client';

import React from 'react';
import type { FieldWithConfidence } from '@/types/processing';

interface SupplierDataGroupProps {
  data: Record<string, FieldWithConfidence | undefined>;
}

export const SupplierDataGroup: React.FC<SupplierDataGroupProps> = ({ data }) => {
  const fieldLabels: Record<string, string> = {
    supplierName: 'Sprzedawca',
    supplierTaxID: 'NIP',
    OSD_name: 'Nazwa OSD',
    OSD_region: 'Region OSD',
    supplierStreet: 'Ulica',
    supplierBuilding: 'Numer budynku',
    supplierUnit: 'Numer lokalu',
    supplierPostalCode: 'Kod pocztowy',
    supplierCity: 'Miejscowość',
    supplierBankAccount: 'Numer konta',
    supplierBankName: 'Nazwa banku',
    supplierEmail: 'Email',
    supplierPhone: 'Telefon',
    supplierWebsite: 'Strona WWW'
  };

  const optionalFields = [
    'supplierUnit',
    'supplierBankName',
    'supplierEmail',
    'supplierPhone',
    'supplierWebsite'
  ];

  return (
    <div className="rounded-lg border divide-y">
      {Object.entries(fieldLabels).map(([key, label]) => {
        const field = data[key];
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
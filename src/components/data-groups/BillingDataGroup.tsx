'use client';

import React from 'react';
import type { FieldWithConfidence } from '@/types/processing';
import type { BillingData } from '@/types/fields';

interface BillingDataGroupProps {
  data: Partial<BillingData>;
}

const formatBillingDate = (date: string | undefined): string => {
  if (!date) return '—';
  
  // Usuń wszystkie znaki oprócz cyfr i kropek
  const cleaned = date.replace(/[^\d.]/g, '');
  
  // Sprawdź format DD.MM.YYYY
  const match = cleaned.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (match) {
    return cleaned;
  }
  
  // Sprawdź format YYYY.MM.DD
  const match2 = cleaned.match(/^(\d{4})\.(\d{2})\.(\d{2})$/);
  if (match2) {
    const [_, year, month, day] = match2;
    return `${day}.${month}.${year}`;
  }
  
  return date;
};

const formatUsage = (value: string | undefined): string => {
  if (!value) return '—';
  return `${value} kWh`;
};

export const BillingDataGroup: React.FC<BillingDataGroupProps> = ({ data }) => {
  const fieldLabels: Record<string, string> = {
    billingStartDate: 'Data rozpoczęcia rozliczenia',
    billingEndDate: 'Data zakończenia rozliczenia',
    billedUsage: 'Zużycie w okresie rozliczeniowym',
    usage12m: 'Zużycie w ostatnich 12 miesiącach'
  };

  const optionalFields = ['usage12m'];

  return (
    <div className="rounded-lg border divide-y">
      {Object.entries(fieldLabels).map(([key, label]) => {
        const field = data[key as keyof BillingData];
        if (!field?.content && optionalFields.includes(key)) {
          return null;
        }

        const displayValue = key.includes('Date') 
          ? formatBillingDate(field?.content)
          : key.toLowerCase().includes('usage') 
            ? formatUsage(field?.content)
            : field?.content || '—';

        return (
          <div key={key} className="flex items-center justify-between px-4 py-2">
            <span className="text-sm text-gray-600">{label}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900">
                {displayValue}
              </span>
              {field?.confidence && (
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
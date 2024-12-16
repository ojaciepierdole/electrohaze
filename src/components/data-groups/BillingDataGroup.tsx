'use client';

import React from 'react';
import { DataGroup } from '@/components/data-groups/DataGroup';
import type { DocumentField } from '@/types/document-processing';
import { processSection } from '@/utils/data-processing';
import type { BillingData } from '@/types/fields';
import { formatDate, formatConsumption } from '@/utils/text-formatting';

interface BillingDataGroupProps {
  data: Partial<BillingData>;
}

export const BillingDataGroup: React.FC<BillingDataGroupProps> = ({ data }) => {
  // Przetwórz dane rozliczeniowe
  const processedData = processSection<BillingData>('billing', data);

  // Funkcja do formatowania pola
  const renderField = (key: string, field: DocumentField) => {
    const label = fieldLabels[key as keyof typeof fieldLabels];
    if (!label) return null;

    const value = field.content;
    if (!value) return null;

    let formattedValue: string;
    switch (key) {
      case 'billingStartDate':
      case 'billingEndDate':
        formattedValue = formatDate(value) || 'Nieprawidłowa data';
        break;
      case 'billedUsage':
      case 'usage12m':
        const numValue = parseFloat(value);
        formattedValue = isNaN(numValue) ? 'Nieprawidłowa wartość' : formatConsumption(numValue);
        break;
      default:
        formattedValue = value;
    }

    return (
      <div key={key} className="flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">{label}</span>
          {field.confidence && (
            <div className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${
                field.confidence > 0.8 ? 'bg-green-500' : 
                field.confidence > 0.6 ? 'bg-yellow-500' : 
                'bg-red-500'
              }`} />
              <span className="text-xs">
                {Math.round(field.confidence * 100)}%
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {formattedValue}
          </span>
          {field.isEnriched && (
            <span className="text-xs text-gray-400">(wzbogacone)</span>
          )}
        </div>
      </div>
    );
  };

  const fieldLabels = {
    billingStartDate: 'Data początkowa',
    billingEndDate: 'Data końcowa',
    billedUsage: 'Zużycie w okresie',
    usage12m: 'Zużycie roczne'
  };

  return (
    <DataGroup
      title="Dane rozliczeniowe"
      data={processedData}
      fieldLabels={fieldLabels}
      renderField={renderField}
    />
  );
}; 
'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Eraser } from 'lucide-react';
import type { FieldWithConfidence } from '@/types/processing';
import { formatDisplayDate } from '@/utils/text-processing/formatters/date';

interface DataGroupProps {
  data: Record<string, FieldWithConfidence | undefined>;
  fieldLabels: Record<string, string>;
  optionalFields?: string[];
}

const formatFieldValue = (key: string, field: FieldWithConfidence): string => {
  // Formatowanie dat
  if (key.toLowerCase().includes('date')) {
    return formatDisplayDate(field.content) || field.content;
  }
  
  // Formatowanie zużycia energii
  if (key.toLowerCase().includes('usage')) {
    return `${field.content} kWh`;
  }
  
  return field.content;
};

export const DataGroup: React.FC<DataGroupProps> = ({ 
  data, 
  fieldLabels,
  optionalFields = []
}) => {
  // Podziel pola na te z danymi i bez danych
  const fieldsWithData: [string, FieldWithConfidence][] = [];
  const fieldsWithoutData: string[] = [];

  Object.entries(fieldLabels).forEach(([key]) => {
    if (data[key]?.content) {
      fieldsWithData.push([key, data[key]!]);
    } else if (!optionalFields.includes(key)) {
      fieldsWithoutData.push(key);
    }
  });

  return (
    <div className="space-y-2">
      {fieldsWithData.map(([key, field]) => (
        <div key={key} className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2">
            <span className="text-gray-600">{fieldLabels[key]}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">
              {formatFieldValue(key, field)}
            </span>
            {field.confidence && (
              <div className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${
                  field.confidence > 0.8 ? 'bg-green-500' : 
                  field.confidence > 0.6 ? 'bg-yellow-500' : 
                  'bg-red-500'
                }`} />
                <span className="text-xs text-gray-500">
                  {Math.round(field.confidence * 100)}%
                </span>
              </div>
            )}
            {field.isEnriched && (
              <Eraser className="w-4 h-4 text-gray-400 flex-shrink-0" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}; 
'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Eraser } from 'lucide-react';
import type { FieldWithConfidence } from '@/types/processing';

interface SupplierDataGroupProps {
  title: string;
  confidence: number;
  completeness: number;
  data: Record<string, FieldWithConfidence | undefined>;
  fieldLabels: Record<string, string>;
  optionalFields?: string[];
}

export const SupplierDataGroup: React.FC<SupplierDataGroupProps> = ({ 
  title, 
  confidence,
  completeness,
  data, 
  fieldLabels,
  optionalFields = []
}) => {
  // Podziel pola na te z danymi i bez danych
  const fieldsWithData: [string, FieldWithConfidence][] = [];
  const fieldsWithoutData: string[] = [];

  Object.entries(fieldLabels).forEach(([key, label]) => {
    if (data[key]?.content) {
      fieldsWithData.push([key, data[key]!]);
    } else if (!optionalFields.includes(key)) {
      fieldsWithoutData.push(key);
    }
  });

  return (
    <div className="rounded-lg border">
      <div className="bg-gray-50">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <h3 className="text-xl font-medium">{title}</h3>
            <Badge variant="secondary" className={`${
              confidence > 0.8 ? 'bg-green-50 text-green-700' : 
              confidence > 0.6 ? 'bg-yellow-50 text-yellow-700' : 
              'bg-red-50 text-red-700'
            }`}>
              {Math.round(confidence * 100)}%
            </Badge>
          </div>
          <div className="text-sm text-gray-500">
            Kompletność {completeness}%
          </div>
        </div>
      </div>

      <div className="divide-y">
        {fieldsWithData.map(([key, field]) => (
          <div key={key} className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-gray-600">{fieldLabels[key]}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">
                {field.content}
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
    </div>
  );
}; 
'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Eraser } from 'lucide-react';
import type { DocumentField } from '@/types/document-processing';
import { Separator } from '@/components/ui/separator';

interface DataGroupProps {
  title: string;
  confidence: number;
  completeness: number;
  data: Record<string, DocumentField | undefined>;
  fieldLabels: Record<string, string>;
  optionalFields?: string[];
}

export const DataGroup: React.FC<DataGroupProps> = ({ 
  title, 
  confidence,
  completeness,
  data, 
  fieldLabels,
  optionalFields = []
}) => {
  // Podziel pola na te z danymi i bez danych
  const fieldsWithData: [string, DocumentField][] = [];
  const fieldsWithoutData: string[] = [];

  Object.entries(fieldLabels).forEach(([key, label]) => {
    if (data[key]?.content) {
      fieldsWithData.push([key, data[key]!]);
    } else if (!optionalFields.includes(key)) {
      fieldsWithoutData.push(key);
    }
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-medium">{title}</h3>
          <Badge variant="secondary" className={`${
            confidence > 0.8 ? 'bg-green-50 text-green-700' : 
            confidence > 0.6 ? 'bg-yellow-50 text-yellow-700' : 
            'bg-red-50 text-red-700'
          }`}>
            {Math.round(confidence * 100)}%
          </Badge>
        </div>
        {completeness === 100 && (
          <div className="text-sm text-gray-500">
            Kompletność {completeness}%
          </div>
        )}
      </div>

      <div className="space-y-2">
        {fieldsWithData.map(([key, field]) => (
          <div key={key} className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">{fieldLabels[key]}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900">
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
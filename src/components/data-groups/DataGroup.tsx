'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Eraser } from 'lucide-react';
import { ConfidenceDot } from '@/components/ui/confidence-dot';
import type { DocumentField } from '@/types/document-processing';
import { Separator } from '@/components/ui/separator';

interface DataGroupProps {
  title: string;
  data: Record<string, DocumentField>;
  fieldLabels: Record<string, string>;
  optionalFields?: string[];
  renderField?: (key: string, field: DocumentField) => React.ReactNode;
}

export const DataGroup: React.FC<DataGroupProps> = ({ 
  title, 
  data, 
  fieldLabels,
  optionalFields = [],
  renderField
}) => {
  // Podziel pola na te z danymi i bez danych
  const fieldsWithData: [string, DocumentField][] = [];
  const fieldsWithoutData: string[] = [];

  Object.entries(fieldLabels).forEach(([key, label]) => {
    if (data[key]?.content) {
      fieldsWithData.push([key, data[key]]);
    } else if (!optionalFields.includes(key)) {
      fieldsWithoutData.push(key);
    }
  });

  if (fieldsWithData.length === 0 && fieldsWithoutData.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">{title}</h3>
        <div className="flex items-center gap-2">
          <div className="text-sm text-gray-500">
            Kompletność {Math.round((fieldsWithData.length / (fieldsWithData.length + fieldsWithoutData.length)) * 100)}%
          </div>
          <div className="text-sm text-gray-500">
            Pewność {Math.round(fieldsWithData.reduce((acc, [_, field]) => acc + (field.confidence || 0), 0) / fieldsWithData.length * 100)}%
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {fieldsWithData.map(([key, field]) => (
          renderField ? (
            renderField(key, field)
          ) : (
            <div key={key} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">{fieldLabels[key]}</span>
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
                  {field.content}
                </span>
                {field.isEnriched && (
                  <span className="text-xs text-gray-400">(wzbogacone)</span>
                )}
              </div>
            </div>
          )
        ))}
      </div>

      {fieldsWithoutData.length > 0 && (
        <>
          <Separator className="my-4" />
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-500">Brakujące dane</h4>
            <div className="grid grid-cols-2 gap-2">
              {fieldsWithoutData.map(key => (
                <div key={key} className="text-sm text-gray-400">
                  {fieldLabels[key]}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}; 
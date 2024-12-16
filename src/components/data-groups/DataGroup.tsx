'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Eraser } from 'lucide-react';
import { ConfidenceDot } from '@/components/ui/confidence-dot';
import type { DocumentField } from '@/types/document-processing';

interface DataGroupProps {
  title: string;
  data: Record<string, DocumentField>;
  fieldLabels: Record<string, string>;
  optionalFields?: string[];
  renderField?: (key: string, field: DocumentField) => React.ReactNode;
}

interface GroupStats {
  completeness: number;
  confidence: number;
  filledFields: number;
  totalFields: number;
}

function calculateGroupStats(
  data: Record<string, DocumentField>, 
  fieldLabels: Record<string, string>,
  optionalFields: string[] = []
): GroupStats {
  // Oblicz liczbę wymaganych pól (wszystkie pola minus opcjonalne)
  const requiredFields = Object.keys(fieldLabels).filter(key => !optionalFields.includes(key));
  const totalFields = requiredFields.length;

  // Oblicz liczbę wypełnionych wymaganych pól
  const filledFields = requiredFields.filter(key => {
    const field = data[key];
    return field?.content !== undefined && field?.content !== null && field?.content !== '';
  }).length;

  // Oblicz kompletność na podstawie wymaganych pól
  const completeness = totalFields > 0 ? filledFields / totalFields : 1;

  // Oblicz średnią pewność dla wszystkich wypełnionych pól (wymaganych i opcjonalnych)
  const filledFieldsWithConfidence = Object.entries(data)
    .filter(([key, field]) => {
      return key in fieldLabels && field?.content && field?.confidence !== undefined;
    });

  const confidence = filledFieldsWithConfidence.length > 0
    ? filledFieldsWithConfidence.reduce((acc, [_, field]) => acc + (field.confidence || 0), 0) / filledFieldsWithConfidence.length
    : 1;

  return {
    completeness,
    confidence,
    filledFields,
    totalFields
  };
}

export const DataGroup: React.FC<DataGroupProps> = ({ 
  title, 
  data, 
  fieldLabels, 
  optionalFields = [], 
  renderField 
}) => {
  const stats = calculateGroupStats(data, fieldLabels, optionalFields);

  const renderDefaultField = (key: string, field: DocumentField) => {
    const label = fieldLabels[key];
    if (!label) return null;

    return (
      <div key={key} className="flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">{label}</span>
          {field.confidence && (
            <ConfidenceDot confidence={field.confidence} />
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {field.content || 'Brak danych'}
          </span>
          {field.isEnriched && (
            <Eraser className="w-4 h-4 text-gray-400 flex-shrink-0" />
          )}
        </div>
      </div>
    );
  };

  const completionPercentage = Math.round(stats.completeness * 100);
  const confidencePercentage = Math.round(stats.confidence * 100);

  return (
    <Card className="bg-white shadow-sm">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">{title}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {completionPercentage}% kompletności
            </Badge>
            <Badge variant={confidencePercentage > 80 ? "success" : confidencePercentage > 60 ? "warning" : "destructive"}>
              {confidencePercentage}% pewności
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {stats.filledFields === 0 ? (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 py-4">
            <AlertCircle className="w-4 h-4" />
            <span>Brak danych w tej sekcji</span>
          </div>
        ) : (
          <div className="space-y-2">
            {Object.entries(data)
              .filter(([key]) => key in fieldLabels)
              .map(([key, field]) => (
                renderField ? renderField(key, field) : renderDefaultField(key, field)
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 
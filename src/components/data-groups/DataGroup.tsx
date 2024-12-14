'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Eraser } from 'lucide-react';
import { ConfidenceDot } from '@/components/ui/confidence-dot';
import { calculateOptimalColumns } from '@/utils/text-formatting';
import type { DocumentField } from '@/types/document-processing';

interface DataGroupProps {
  title: string;
  data: Record<string, DocumentField>;
  fieldLabels: Record<string, string>;
  renderField?: (key: string, field: DocumentField) => React.ReactNode;
}

interface FieldInfo {
  key: string;
  label: string;
}

interface OptimalColumnsResult {
  columns: FieldInfo[][];
  gridClass: string;
}

export const DataGroup: React.FC<DataGroupProps> = ({ title, data, fieldLabels, renderField }) => {
  console.log('DataGroup input:', { title, data, fieldLabels });

  // Oblicz statystyki grupy
  const stats = React.useMemo(() => {
    const fields = Object.entries(data);
    const filledFields = fields.filter(([_, field]) => field?.content !== null && field?.content !== undefined);
    const totalConfidence = filledFields.reduce((sum, [_, field]) => sum + (field?.confidence ?? 0), 0);
    
    const result = {
      total: fields.length,
      filled: filledFields.length,
      completeness: filledFields.length / fields.length,
      confidence: filledFields.length > 0 ? totalConfidence / filledFields.length : 0
    };
    console.log('Calculated stats:', result);
    return result;
  }, [data]);

  // Oblicz optymalny układ kolumn dla brakujących pól
  const missingFields = Object.entries(fieldLabels)
    .filter(([key]) => !data[key]?.content)
    .map(([key, label]) => ({ key, label }));

  const { columns: missingColumns, gridClass: missingGridClass } = React.useMemo(
    () => calculateOptimalColumns(missingFields) as OptimalColumnsResult,
    [missingFields]
  );

  // Sprawdź czy grupa jest pusta
  if (stats.filled === 0) {
    console.log('Group is empty');
    return (
      <Card className="bg-gray-50 border-gray-200 opacity-75">
        <CardHeader className="border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium text-gray-500">{title}</CardTitle>
            <Badge variant="outline" className="text-gray-500">
              Brak danych
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <AlertCircle className="w-4 h-4" />
            <p>Brak danych w tej sekcji.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const completionPercentage = Math.round(stats.completeness * 100);
  const confidencePercentage = Math.round(stats.confidence * 100);

  console.log('Rendering filled fields:', Object.entries(fieldLabels)
    .filter(([key]) => data[key]?.content)
    .map(([key]) => ({ key, content: data[key]?.content })));

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
        <div className="space-y-6">
          {/* Wypełnione pola */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(fieldLabels).map(([key, label]) => {
              const fieldData = data[key];
              if (!fieldData?.content) return null;

              return (
                <div key={key} className="space-y-1">
                  <dt className="text-sm text-gray-500">{label}</dt>
                  <dd className="text-sm font-medium flex items-center gap-2">
                    <span>
                      {renderField ? renderField(key, fieldData) : fieldData.content}
                    </span>
                    <ConfidenceDot confidence={fieldData.confidence ?? 0} />
                    {fieldData.isEnriched && (
                      <Eraser className="w-4 h-4 text-gray-400" />
                    )}
                  </dd>
                </div>
              );
            })}
          </div>

          {/* Brakujące pola */}
          {missingFields.length > 0 && (
            <>
              <div className="border-t border-gray-200 my-4" />
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-500">Brakujące dane:</h4>
                <div className={`grid ${missingGridClass} gap-4`}>
                  {missingColumns.map((column: FieldInfo[], columnIndex: number) => (
                    <div key={columnIndex} className="space-y-2">
                      {column.map(({ key, label }: FieldInfo) => (
                        <div key={key} className="flex items-center gap-2">
                          <span className="text-sm text-gray-400">{label}</span>
                          <span className="text-sm text-gray-300">—</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}; 
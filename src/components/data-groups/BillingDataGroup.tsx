'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';
import type { BillingData } from '@/types/fields';
import { formatDate, formatConsumption, calculateGroupConfidence, getMissingFields, calculateOptimalColumns } from '@/utils/text-formatting';
import { ConfidenceDot } from '@/components/ui/confidence-dot';

const FIELD_MAPPING: Record<keyof BillingData, string> = {
  billingStartDate: 'Data początkowa',
  billingEndDate: 'Data końcowa',
  billedUsage: 'Zużycie w okresie',
  usage12m: 'Zużycie roczne'
};

interface BillingDataGroupProps {
  data: Partial<BillingData>;
}

export function BillingDataGroup({ data }: BillingDataGroupProps) {
  const isEmpty = !data || Object.keys(data).length === 0;
  const missingFields = getMissingFields(data, FIELD_MAPPING);
  const { columns: missingColumns, gridClass: missingGridClass } = calculateOptimalColumns(missingFields);

  const { completionPercentage, confidencePercentage } = React.useMemo(() => {
    const confidence = calculateGroupConfidence(data, 'billing');
    return {
      completionPercentage: Math.round((confidence.filledFields / confidence.totalFields) * 100),
      confidencePercentage: Math.round(confidence.averageConfidence * 100)
    };
  }, [data]);

  const formattedData = React.useMemo(() => {
    const formatted: Record<string, string | null> = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (key === 'billingStartDate' || key === 'billingEndDate') {
        formatted[key] = formatDate((value as any)?.content || null);
      } else if (key === 'billedUsage' || key === 'usage12m') {
        const numValue = (value as any)?.content ? parseFloat((value as any).content) : null;
        formatted[key] = formatConsumption(numValue);
      } else {
        formatted[key] = (value as any)?.content || null;
      }
    }
    
    return formatted;
  }, [data]);

  if (isEmpty) {
    return (
      <Card className="bg-gray-50 border-gray-200 opacity-75">
        <CardHeader className="border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium text-gray-500">Dane rozliczeniowe</CardTitle>
            <Badge variant="outline" className="text-gray-500">
              Brak danych
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <AlertCircle className="w-4 h-4" />
            <p>Brak danych rozliczeniowych w strukturze faktury tego dostawcy.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-sm">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">Dane rozliczeniowe</CardTitle>
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
            {Object.entries(FIELD_MAPPING).map(([key, label]) => {
              const fieldKey = key as keyof BillingData;
              const fieldData = data[fieldKey];
              return fieldData?.content ? (
                <div key={key} className="space-y-1">
                  <dt className="text-sm text-gray-500">{label}</dt>
                  <dd className="text-sm font-medium">{formattedData[key]}</dd>
                  <ConfidenceDot confidence={fieldData.confidence || 1} />
                </div>
              ) : null;
            })}
          </div>

          {/* Brakujące pola */}
          {missingFields.length > 0 && (
            <>
              <div className="border-t border-gray-200 my-4" />
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-500">Brakujące dane:</h4>
                <div className={`grid ${missingGridClass} gap-4`}>
                  {missingColumns.map((column, columnIndex) => (
                    <div key={columnIndex} className="space-y-2">
                      {column.map(({ key, label }) => {
                        const fieldKey = key as keyof BillingData;
                        const fieldData = data[fieldKey];
                        return (
                          <div key={key} className="flex items-center gap-2">
                            <span className="text-sm text-gray-400">{label}</span>
                            <span className="text-sm text-gray-300">—</span>
                          </div>
                        );
                      })}
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
} 
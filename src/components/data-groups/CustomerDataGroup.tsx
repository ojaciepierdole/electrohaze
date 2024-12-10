'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';
import type { CustomerData } from '@/types/fields';
import { formatPersonName, calculateGroupConfidence, getMissingFields } from '@/utils/text-formatting';

const FIELD_MAPPING: Record<keyof CustomerData, string> = {
  FirstName: 'Imię',
  LastName: 'Nazwisko',
  BusinessName: 'Nazwa firmy',
  taxID: 'NIP'
};

interface CustomerDataGroupProps {
  data: Partial<CustomerData>;
}

export function CustomerDataGroup({ data }: CustomerDataGroupProps) {
  // Oblicz statystyki grupy
  const confidence = calculateGroupConfidence(data);
  const missingFields = getMissingFields(data, FIELD_MAPPING);
  const isEmpty = confidence.filledFields === 0;

  // Formatuj wartości
  const formattedData = {
    ...data,
    FirstName: formatPersonName(data.FirstName || null),
    LastName: formatPersonName(data.LastName || null),
    BusinessName: formatPersonName(data.BusinessName || null),
  };

  if (isEmpty) {
    return (
      <Card className="bg-gray-50 border-gray-200 opacity-75">
        <CardHeader className="border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium text-gray-500">Dane klienta</CardTitle>
            <Badge variant="outline" className="text-gray-500">
              Brak danych
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <AlertCircle className="w-4 h-4" />
            <p>Brak danych klienta w strukturze faktury tego dostawcy.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-sm">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">Dane klienta</CardTitle>
          <Badge variant="outline">
            {Math.round(confidence.averageConfidence * 100)}% kompletności
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-6">
          {/* Wypełnione pola */}
          <div className="grid grid-cols-2 gap-4">
            {(Object.keys(FIELD_MAPPING) as Array<keyof CustomerData>).map((key) => (
              formattedData[key] ? (
                <div key={key} className="space-y-1">
                  <dt className="text-sm text-gray-500">{FIELD_MAPPING[key]}</dt>
                  <dd className="text-sm font-medium">{formattedData[key]}</dd>
                </div>
              ) : null
            ))}
          </div>

          {/* Brakujące pola */}
          {missingFields.length > 0 && (
            <>
              <div className="border-t border-gray-200 my-4" />
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-500">Brakujące dane:</h4>
                <div className="grid grid-cols-2 gap-2">
                  {missingFields.map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className="text-sm text-gray-400">{label}</span>
                      <span className="text-sm text-gray-300">—</span>
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
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';
import type { BillingData } from '@/types/fields';
import { formatDate, formatConsumption, calculateGroupConfidence, getMissingFields } from '@/utils/text-formatting';

const FIELD_MAPPING: Record<string, string> = {
  // Dane czasowe
  BillingStartDate: 'Data początkowa',
  BillingEndDate: 'Data końcowa',
  // Dane produktu
  ProductName: 'Nazwa produktu',
  Tariff: 'Grupa taryfowa',
  // Dane zużycia
  BilledUsage: 'Zużycie',
  ReadingType: 'Typ odczytu',
  "12mUsage": 'Zużycie roczne',
  // Szczegóły rozliczenia
  InvoiceType: 'Typ faktury',
  BillBreakdown: 'Szczegóły rachunku',
  EnergySaleBreakdown: 'Szczegóły sprzedaży'
};

interface BillingDataGroupProps {
  data: Partial<BillingData>;
}

export function BillingDataGroup({ data }: BillingDataGroupProps) {
  // Oblicz statystyki grupy
  const confidence = calculateGroupConfidence(data);
  const missingFields = getMissingFields(data, FIELD_MAPPING);
  const isEmpty = confidence.filledFields === 0;

  // Formatuj wartości
  const formattedData = {
    ...data,
    BillingStartDate: formatDate(data.BillingStartDate || null),
    BillingEndDate: formatDate(data.BillingEndDate || null),
    BilledUsage: formatConsumption(data.BilledUsage || null),
    "12mUsage": formatConsumption(data["12mUsage"] || null),
  };

  // Podziel brakujące pola na dwie kolumny
  const missingFieldsColumns = React.useMemo(() => {
    const midPoint = Math.ceil(missingFields.length / 2);
    return [
      missingFields.slice(0, midPoint),
      missingFields.slice(midPoint)
    ];
  }, [missingFields]);

  if (isEmpty) {
    return (
      <Card className="bg-gray-50 border-gray-200 opacity-75">
        <CardHeader className="border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium text-gray-500">Rozliczenie</CardTitle>
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
          <CardTitle className="text-lg font-medium">Rozliczenie</CardTitle>
          <Badge variant="outline">
            {Math.round(confidence.averageConfidence * 100)}% kompletności
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Wypełnione pola */}
          <div className="space-y-2">
            {Object.entries(FIELD_MAPPING).map(([key, label]) => (
              formattedData[key as keyof BillingData] ? (
                <div key={key} className="flex items-center justify-between gap-4">
                  <dt className="text-sm text-gray-500 min-w-[150px]">{label}</dt>
                  <dd className="text-sm font-medium flex-1">
                    {formattedData[key as keyof BillingData]}
                  </dd>
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
                <div className="grid grid-cols-2 gap-x-12 gap-y-2">
                  {missingFieldsColumns[0].map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className="text-sm text-gray-400">{label}</span>
                      <span className="text-sm text-gray-300">—</span>
                    </div>
                  ))}
                  {missingFieldsColumns[1].map(({ key, label }) => (
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
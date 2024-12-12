'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';
import type { CorrespondenceData } from '@/types/fields';
import { formatPersonName, formatAddress, formatPostalCode, formatCity, formatStreet, calculateGroupConfidence, getMissingFields, calculateOptimalColumns } from '@/utils/text-formatting';

const FIELD_MAPPING: Record<keyof CorrespondenceData, string> = {
  paFirstName: 'Imię',
  paLastName: 'Nazwisko',
  paBusinessName: 'Nazwa firmy',
  paTitle: 'Tytuł',
  paStreet: 'Ulica',
  paBuilding: 'Numer budynku',
  paUnit: 'Numer lokalu',
  paPostalCode: 'Kod pocztowy',
  paCity: 'Miejscowość'
};

interface CorrespondenceDataGroupProps {
  data: Partial<CorrespondenceData>;
}

export function CorrespondenceDataGroup({ data }: CorrespondenceDataGroupProps) {
  // Oblicz statystyki grupy
  const confidence = calculateGroupConfidence(data, 'postal_address');
  const missingFields = getMissingFields(data, FIELD_MAPPING);
  const isEmpty = confidence.filledFields === 0;
  const completionPercentage = Math.round((confidence.filledFields / confidence.totalFields) * 100);

  // Oblicz optymalny układ kolumn dla brakujących pól
  const { columns, gridClass } = React.useMemo(
    () => calculateOptimalColumns(missingFields),
    [missingFields]
  );

  // Formatuj wartości
  const formattedData = {
    ...data,
    paFirstName: formatPersonName(data.paFirstName || null),
    paLastName: formatPersonName(data.paLastName || null),
    paBusinessName: formatPersonName(data.paBusinessName || null),
    paTitle: formatPersonName(data.paTitle || null),
    paStreet: data.paStreet?.split('/')[0] || null,
    paBuilding: data.paStreet?.split('/')[1] || data.paBuilding || null,
    paUnit: data.paStreet?.split('/')[2] || data.paUnit || null,
    paPostalCode: formatPostalCode(data.paPostalCode || null),
    paCity: formatCity(data.paCity || null),
  };

  if (isEmpty) {
    return (
      <Card className="bg-gray-50 border-gray-200 opacity-75">
        <CardHeader className="border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium text-gray-500">Adres korespondencyjny</CardTitle>
            <Badge variant="outline" className="text-gray-500">
              Brak danych
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <AlertCircle className="w-4 h-4" />
            <p>Brak adresu korespondencyjnego w strukturze faktury tego dostawcy.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-sm">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">Adres korespondencyjny</CardTitle>
          <Badge variant="outline">
            {completionPercentage}% kompletności
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-6">
          {/* Wypełnione pola */}
          <div className="grid grid-cols-2 gap-4">
            {(Object.keys(FIELD_MAPPING) as Array<keyof CorrespondenceData>).map((key) => (
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
                <div className={`grid grid-flow-col auto-cols-fr gap-x-12 gap-y-2 ${gridClass}`}>
                  {columns.map((column, columnIndex) => (
                    <div key={columnIndex} className="space-y-2">
                      {column.map(({ key, label }) => (
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
} 
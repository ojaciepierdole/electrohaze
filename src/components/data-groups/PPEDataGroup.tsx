'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';
import type { PPEData } from '@/types/fields';
import { 
  formatPersonName, 
  formatAddress, 
  calculateGroupConfidence, 
  getMissingFields,
  calculateOptimalColumns,
  type ColumnLayout 
} from '@/utils/text-formatting';

const FIELD_MAPPING: Record<string, string> = {
  // Dane identyfikacyjne PPE
  ppeNum: 'Kod PPE',
  // Dane techniczne
  MeterNumber: 'Numer licznika',
  TariffGroup: 'Grupa taryfowa',
  ContractNumber: 'Numer umowy',
  ContractType: 'Typ umowy',
  // Dane adresowe
  Street: 'Ulica',
  Building: 'Numer budynku',
  Unit: 'Numer lokalu',
  PostalCode: 'Kod pocztowy',
  City: 'Miejscowość',
  // Dane administracyjne
  Municipality: 'Gmina',
  District: 'Powiat',
  Province: 'Województwo'
};

interface PPEDataGroupProps {
  data: Partial<PPEData>;
}

export function PPEDataGroup({ data }: PPEDataGroupProps) {
  // Oblicz statystyki grupy
  const confidence = calculateGroupConfidence(data, 'delivery_point');
  const missingFields = getMissingFields(data, FIELD_MAPPING);
  const isEmpty = confidence.filledFields === 0;

  // Formatuj wartości
  const formattedData = {
    ...data,
    Street: formatAddress(data.Street || null),
    City: formatAddress(data.City || null),
    Municipality: formatAddress(data.Municipality || null),
    District: formatAddress(data.District || null),
    Province: formatAddress(data.Province || null),
  };

  // Oblicz optymalny układ kolumn
  const { columns, gridClass } = React.useMemo(
    () => calculateOptimalColumns(missingFields),
    [missingFields]
  );

  if (isEmpty) {
    return (
      <Card className="bg-gray-50 border-gray-200 opacity-75">
        <CardHeader className="border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium text-gray-500">Punkt poboru</CardTitle>
            <Badge variant="outline" className="text-gray-500">
              Brak danych
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <AlertCircle className="w-4 h-4" />
            <p>Brak danych punktu poboru w strukturze faktury tego dostawcy.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-sm">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">Punkt poboru</CardTitle>
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
              formattedData[key as keyof PPEData] ? (
                <div key={key} className="flex items-center justify-between gap-4">
                  <dt className="text-sm text-gray-500 min-w-[150px]">{label}</dt>
                  <dd className="text-sm font-medium flex-1">
                    {formattedData[key as keyof PPEData]}
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
                <div className={`grid gap-x-12 gap-y-2 ${gridClass}`}>
                  {columns.map((column: Array<{ key: string; label: string }>, columnIndex: number) => (
                    <React.Fragment key={columnIndex}>
                      {column.map(({ key, label }: { key: string; label: string }) => (
                        <div key={key} className="flex items-center gap-2">
                          <span className="text-sm text-gray-400">{label}</span>
                          <span className="text-sm text-gray-300">—</span>
                        </div>
                      ))}
                    </React.Fragment>
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
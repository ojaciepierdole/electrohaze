'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';
import type { PPEData } from '@/types/fields';
import { formatAddress, formatPostalCode, formatCity, formatStreet, calculateGroupConfidence, getMissingFields, calculateOptimalColumns, formatPersonName } from '@/utils/text-formatting';

const FIELD_MAPPING: Record<keyof PPEData, string> = {
  // Dane identyfikacyjne
  ppeNum: 'Numer PPE',
  MeterNumber: 'Numer licznika',
  TariffGroup: 'Grupa taryfowa',
  ContractNumber: 'Numer umowy',
  ContractType: 'Typ umowy',
  // Dane OSD
  OSD_name: 'Nazwa OSD',
  OSD_region: 'Region OSD',
  ProductName: 'Nazwa produktu',
  // Dane osobowe
  dpFirstName: 'Imię',
  dpLastName: 'Nazwisko',
  // Dane adresowe
  dpStreet: 'Ulica',
  dpBuilding: 'Numer budynku',
  dpUnit: 'Numer lokalu',
  dpPostalCode: 'Kod pocztowy',
  dpCity: 'Miejscowość'
};

interface PPEDataGroupProps {
  data: Partial<PPEData>;
}

export function PPEDataGroup({ data }: PPEDataGroupProps) {
  // Oblicz statystyki grupy
  const confidence = calculateGroupConfidence(data, 'ppe');
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
    // Dane identyfikacyjne
    ppeNum: data.ppeNum || null,
    MeterNumber: data.MeterNumber || null,
    TariffGroup: data.TariffGroup || null,
    ContractNumber: data.ContractNumber || null,
    ContractType: data.ContractType || null,
    // Dane OSD
    OSD_name: data.OSD_name || null,
    OSD_region: data.OSD_region || null,
    ProductName: data.ProductName || null,
    // Dane osobowe
    dpFirstName: formatPersonName(data.dpFirstName || null),
    dpLastName: formatPersonName(data.dpLastName || null),
    // Dane adresowe
    dpStreet: formatStreet(data.dpStreet || null),
    dpBuilding: formatAddress(data.dpBuilding || null),
    dpUnit: formatAddress(data.dpUnit || null),
    dpPostalCode: formatPostalCode(data.dpPostalCode || null),
    dpCity: formatCity(data.dpCity || null)
  };

  if (isEmpty) {
    return (
      <Card className="bg-gray-50 border-gray-200 opacity-75">
        <CardHeader className="border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium text-gray-500">Punkt poboru energii</CardTitle>
            <Badge variant="outline" className="text-gray-500">
              Brak danych
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <AlertCircle className="w-4 h-4" />
            <p>Brak danych PPE w strukturze faktury tego dostawcy.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-sm">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">Punkt poboru energii</CardTitle>
          <Badge variant="outline">
            {completionPercentage}% kompletności
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-6">
          {/* Wypełnione pola */}
          <div className="grid grid-cols-2 gap-4">
            {(Object.keys(FIELD_MAPPING) as Array<keyof PPEData>).map((key) => (
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
                <div className={`grid ${gridClass} gap-4`}>
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
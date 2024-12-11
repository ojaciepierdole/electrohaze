'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';
import type { SupplierData } from '@/types/fields';
import { formatPersonName, formatAddress, calculateGroupConfidence, getMissingFields, calculateOptimalColumns } from '@/utils/text-formatting';

const FIELD_MAPPING: Record<string, string> = {
  // Dane podstawowe
  supplierName: 'Nazwa dostawcy',
  supplierTaxID: 'NIP',
  // Dane adresowe
  supplierStreet: 'Ulica',
  supplierBuilding: 'Numer budynku',
  supplierUnit: 'Numer lokalu',
  supplierPostalCode: 'Kod pocztowy',
  supplierCity: 'Miejscowość',
  // Dane kontaktowe
  supplierBankAccount: 'Numer konta',
  supplierBankName: 'Nazwa banku',
  supplierEmail: 'Email',
  supplierPhone: 'Telefon',
  supplierWebsite: 'Strona WWW',
  // Dane OSD
  OSD_name: 'Nazwa OSD',
  OSD_region: 'Region OSD'
};

interface SupplierDataGroupProps {
  data: Partial<SupplierData>;
}

export function SupplierDataGroup({ data }: SupplierDataGroupProps) {
  // Oblicz statystyki grupy
  const confidence = calculateGroupConfidence(data, 'supplier');
  const missingFields = getMissingFields(data, FIELD_MAPPING);
  const isEmpty = confidence.filledFields === 0;

  // Formatuj wartości
  const formattedData = {
    ...data,
    supplierName: formatPersonName(data.supplierName || null),
    supplierStreet: formatAddress(data.supplierStreet || null),
    supplierCity: formatAddress(data.supplierCity || null),
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
            <CardTitle className="text-lg font-medium text-gray-500">Dane sprzedawcy</CardTitle>
            <Badge variant="outline" className="text-gray-500">
              Brak danych
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <AlertCircle className="w-4 h-4" />
            <p>Brak danych sprzedawcy w strukturze faktury tego dostawcy.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-sm">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">Dane sprzedawcy</CardTitle>
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
              formattedData[key as keyof SupplierData] ? (
                <div key={key} className="flex items-center justify-between gap-4">
                  <dt className="text-sm text-gray-500 min-w-[150px]">{label}</dt>
                  <dd className="text-sm font-medium flex-1">
                    {formattedData[key as keyof SupplierData]}
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
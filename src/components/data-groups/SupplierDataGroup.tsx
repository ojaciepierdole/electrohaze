'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { SupplierData } from '@/types/fields';

const FIELD_MAPPING: Record<keyof SupplierData, string> = {
  supplierName: 'Nazwa dostawcy',
  OSD_name: 'Nazwa OSD',
  OSD_region: 'Region OSD',
  ProductName: 'Nazwa produktu',
  Tariff: 'Taryfa'
};

interface SupplierDataGroupProps {
  data: Partial<SupplierData>;
}

export function SupplierDataGroup({ data }: SupplierDataGroupProps) {
  return (
    <Card className="bg-white shadow-sm">
      <CardHeader className="border-b">
        <CardTitle className="text-lg font-medium">Dostawca</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-4">
          {(Object.keys(FIELD_MAPPING) as Array<keyof SupplierData>).map((key) => (
            data[key] ? (
              <div key={key} className="space-y-1">
                <dt className="text-sm text-gray-500">{FIELD_MAPPING[key]}</dt>
                <dd className="text-sm font-medium">{data[key]}</dd>
              </div>
            ) : null
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 
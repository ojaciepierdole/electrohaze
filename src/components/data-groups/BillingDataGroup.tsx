'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { BillingData } from '@/types/fields';

const FIELD_MAPPING: Record<keyof BillingData, string> = {
  BillingStartDate: 'Data początkowa',
  BillingEndDate: 'Data końcowa',
  InvoiceType: 'Typ faktury',
  BilledUsage: 'Zużycie',
  ReadingType: 'Typ odczytu',
  "12mUsage": 'Zużycie roczne',
  BillBreakdown: 'Szczegóły rachunku',
  EnergySaleBreakdown: 'Szczegóły sprzedaży'
};

interface BillingDataGroupProps {
  data: Partial<BillingData>;
}

export function BillingDataGroup({ data }: BillingDataGroupProps) {
  return (
    <Card className="bg-white shadow-sm">
      <CardHeader className="border-b">
        <CardTitle className="text-lg font-medium">Rozliczenie</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-4">
          {(Object.keys(FIELD_MAPPING) as Array<keyof BillingData>).map((key) => (
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
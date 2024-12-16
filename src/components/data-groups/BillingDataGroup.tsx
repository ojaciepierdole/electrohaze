'use client';

import React from 'react';
import { DataGroup } from '@/components/data-groups/DataGroup';
import type { DocumentField } from '@/types/document-processing';
import { processSection } from '@/utils/data-processing';
import type { BillingData } from '@/types/fields';

interface BillingDataGroupProps {
  data: Partial<BillingData>;
}

export const BillingDataGroup: React.FC<BillingDataGroupProps> = ({ data }) => {
  // Przetwórz dane rozliczeniowe
  const processedData = processSection<BillingData>('billing', data);

  return (
    <DataGroup
      title="Dane rozliczeniowe"
      data={processedData}
      fieldLabels={{
        billingStartDate: 'Data początkowa',
        billingEndDate: 'Data końcowa',
        billedUsage: 'Zużycie',
        usage12m: 'Zużycie 12m'
      }}
      optionalFields={['usage12m']}
    />
  );
}; 
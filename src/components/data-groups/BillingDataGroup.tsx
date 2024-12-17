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
  // Konwertuj dane do wymaganego formatu
  const processedData = processSection('billing', data) as Record<string, DocumentField | undefined>;

  // Oblicz średnią pewność dla pól z danymi
  const fieldsWithConfidence = Object.values(processedData)
    .filter((field): field is DocumentField => field?.confidence !== undefined);
  const averageConfidence = fieldsWithConfidence.length > 0
    ? fieldsWithConfidence.reduce((acc, field) => acc + field.confidence, 0) / fieldsWithConfidence.length
    : 0;

  // Oblicz kompletność
  const requiredFields = ['billingStartDate', 'billingEndDate', 'billedUsage'];
  const filledRequiredFields = requiredFields.filter(key => processedData[key]?.content).length;
  const completeness = Math.round((filledRequiredFields / requiredFields.length) * 100);

  return (
    <DataGroup
      title="Dane rozliczeniowe"
      confidence={averageConfidence}
      completeness={completeness}
      data={processedData}
      fieldLabels={{
        billingStartDate: 'Data rozpoczęcia rozliczenia',
        billingEndDate: 'Data zakończenia rozliczenia',
        billedUsage: 'Zużycie w okresie rozliczeniowym (kWh)',
        '12mUsage': 'Zużycie w ostatnich 12 miesiącach (kWh)'
      }}
      optionalFields={[
        '12mUsage'
      ]}
    />
  );
}; 
'use client';

import React from 'react';
import { DataGroup } from './DataGroup';
import type { DocumentField } from '@/types/processing';

interface BillingDataGroupProps {
  fields: Record<string, DocumentField>;
  confidence: number;
  onEdit?: () => void;
}

export function BillingDataGroup({ fields, confidence, onEdit }: BillingDataGroupProps) {
  return (
    <DataGroup
      title="Dane rozliczeniowe"
      fields={fields}
      confidence={confidence}
      onEdit={onEdit}
    />
  );
} 
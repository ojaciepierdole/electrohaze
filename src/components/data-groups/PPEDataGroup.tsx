'use client';

import React from 'react';
import { DataGroup } from './DataGroup';
import type { DocumentField } from '@/types/processing';

interface PPEDataGroupProps {
  fields: Record<string, DocumentField>;
  confidence: number;
  onEdit?: () => void;
}

export function PPEDataGroup({ fields, confidence, onEdit }: PPEDataGroupProps) {
  return (
    <DataGroup
      title="Punkt Poboru Energii"
      fields={fields}
      confidence={confidence}
      onEdit={onEdit}
    />
  );
} 
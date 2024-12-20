'use client';

import React from 'react';
import type { CorrespondenceData } from '@/types/fields';
import { DataGroup } from './DataGroup';
import { FIELD_LABELS } from '@/config/fields';
import { Mail } from 'lucide-react';

interface CorrespondenceDataGroupProps {
  data: Partial<CorrespondenceData>;
  confidence?: number;
  isLoading?: boolean;
}

export function CorrespondenceDataGroup({ data }: CorrespondenceDataGroupProps) {
  const fields = [
    {
      label: FIELD_LABELS.paFirstName || 'Imię',
      value: data.paFirstName?.content,
      confidence: data.paFirstName?.confidence,
      isEnriched: data.paFirstName?.metadata?.transformationType === 'enriched',
      metadata: data.paFirstName?.metadata
    },
    {
      label: FIELD_LABELS.paLastName || 'Nazwisko',
      value: data.paLastName?.content,
      confidence: data.paLastName?.confidence,
      isEnriched: data.paLastName?.metadata?.transformationType === 'enriched',
      metadata: data.paLastName?.metadata
    },
    {
      label: FIELD_LABELS.paBusinessName || 'Nazwa firmy',
      value: data.paBusinessName?.content,
      confidence: data.paBusinessName?.confidence,
      isEnriched: data.paBusinessName?.metadata?.transformationType === 'enriched',
      metadata: data.paBusinessName?.metadata
    },
    {
      label: FIELD_LABELS.paStreet || 'Ulica',
      value: data.paStreet?.content,
      confidence: data.paStreet?.confidence,
      isEnriched: data.paStreet?.metadata?.transformationType === 'enriched',
      metadata: data.paStreet?.metadata
    },
    {
      label: FIELD_LABELS.paBuilding || 'Numer budynku',
      value: data.paBuilding?.content,
      confidence: data.paBuilding?.confidence,
      isEnriched: data.paBuilding?.metadata?.transformationType === 'enriched',
      metadata: data.paBuilding?.metadata
    },
    {
      label: FIELD_LABELS.paUnit || 'Numer lokalu',
      value: data.paUnit?.content,
      confidence: data.paUnit?.confidence,
      isEnriched: data.paUnit?.metadata?.transformationType === 'enriched',
      metadata: data.paUnit?.metadata
    },
    {
      label: FIELD_LABELS.paPostalCode || 'Kod pocztowy',
      value: data.paPostalCode?.content,
      confidence: data.paPostalCode?.confidence,
      isEnriched: data.paPostalCode?.metadata?.transformationType === 'enriched',
      metadata: data.paPostalCode?.metadata
    },
    {
      label: FIELD_LABELS.paCity || 'Miejscowość',
      value: data.paCity?.content,
      confidence: data.paCity?.confidence,
      isEnriched: data.paCity?.metadata?.transformationType === 'enriched',
      metadata: data.paCity?.metadata
    },
    {
      label: FIELD_LABELS.paMunicipality || 'Gmina',
      value: data.paMunicipality?.content,
      confidence: data.paMunicipality?.confidence,
      isEnriched: data.paMunicipality?.metadata?.transformationType === 'enriched',
      metadata: data.paMunicipality?.metadata
    },
    {
      label: FIELD_LABELS.paDistrict || 'Powiat',
      value: data.paDistrict?.content,
      confidence: data.paDistrict?.confidence,
      isEnriched: data.paDistrict?.metadata?.transformationType === 'enriched',
      metadata: data.paDistrict?.metadata
    },
    {
      label: FIELD_LABELS.paProvince || 'Województwo',
      value: data.paProvince?.content,
      confidence: data.paProvince?.confidence,
      isEnriched: data.paProvince?.metadata?.transformationType === 'enriched',
      metadata: data.paProvince?.metadata
    }
  ];

  return (
    <DataGroup
      title="Adres korespondencyjny"
      icon={<Mail className="h-5 w-5" />}
      fields={fields}
    />
  );
} 
'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { formatPercentage } from '@/utils/text-formatting';
import { calculateDocumentCompleteness, calculateUsability, calculateAverageConfidence } from '@/utils/data-processing/completeness/confidence';
import type { ProcessingResult } from '@/types/processing';
import type { PPEData, CustomerData, CorrespondenceData, SupplierData, BillingData } from '@/types/fields';
import type { DocumentField } from '@/types/document';

interface AnalysisSummaryProps {
  documents: ProcessingResult[];
  totalTime?: number;
  onExport?: () => void;
}

function createDocumentField(value: any): DocumentField {
  if (typeof value === 'object' && value !== null && 'content' in value) {
    return value as DocumentField;
  }
  
  return {
    content: String(value),
    confidence: 1,
    metadata: {
      fieldType: 'text',
      transformationType: 'mapped'
    }
  };
}

function mapFields(fields: Record<string, any>): {
  ppeData: Record<string, DocumentField>;
  customerData: Record<string, DocumentField>;
  correspondenceData: Record<string, DocumentField>;
  supplierData: Record<string, DocumentField>;
  billingData: Record<string, DocumentField>;
} {
  const result = {
    ppeData: {} as Record<string, DocumentField>,
    customerData: {} as Record<string, DocumentField>,
    correspondenceData: {} as Record<string, DocumentField>,
    supplierData: {} as Record<string, DocumentField>,
    billingData: {} as Record<string, DocumentField>
  };

  // Mapuj pola PPE
  ['ppeNum', 'MeterNumber', 'TariffGroup', 'ContractNumber', 'ContractType', 'dpStreet', 'dpBuilding', 'dpUnit', 'dpPostalCode', 'dpCity', 'dpProvince', 'dpMunicipality', 'dpDistrict', 'dpMeterID'].forEach(key => {
    if (key in fields) {
      result.ppeData[key] = createDocumentField(fields[key]);
    }
  });

  // Mapuj pola klienta
  ['FirstName', 'LastName', 'BusinessName', 'taxID', 'Street', 'Building', 'Unit', 'PostalCode', 'City', 'Municipality', 'District', 'Province'].forEach(key => {
    if (key in fields) {
      result.customerData[key] = createDocumentField(fields[key]);
    }
  });

  // Mapuj pola adresu korespondencyjnego
  ['paFirstName', 'paLastName', 'paBusinessName', 'paTitle', 'paStreet', 'paBuilding', 'paUnit', 'paPostalCode', 'paCity', 'paProvince', 'paMunicipality', 'paDistrict'].forEach(key => {
    if (key in fields) {
      result.correspondenceData[key] = createDocumentField(fields[key]);
    }
  });

  // Mapuj pola dostawcy
  ['supplierName', 'spTaxID', 'spStreet', 'spBuilding', 'spUnit', 'spPostalCode', 'spCity', 'spProvince', 'spMunicipality', 'spDistrict', 'spIBAN', 'spPhoneNum', 'spWebUrl', 'OSD_name', 'OSD_region'].forEach(key => {
    if (key in fields) {
      result.supplierData[key] = createDocumentField(fields[key]);
    }
  });

  // Mapuj pola rozliczeniowe
  ['BillingStartDate', 'BillingEndDate', 'BilledUsage', '12mUsage'].forEach(key => {
    const mappedKey = key === 'BillingStartDate' ? 'billingStartDate' :
                     key === 'BillingEndDate' ? 'billingEndDate' :
                     key === 'BilledUsage' ? 'billedUsage' :
                     key === '12mUsage' ? '12mUsage' : key;
    
    if (key in fields) {
      result.billingData[mappedKey] = createDocumentField(fields[key]);
    }
  });

  return result;
}

export function AnalysisSummary({ documents, totalTime, onExport }: AnalysisSummaryProps) {
  // Oblicz średnią pewność dla wszystkich dokumentów
  const averageConfidence = documents.reduce((acc, doc) => {
    const fields = doc.modelResults[0]?.fields || {};
    const mappedFields = mapFields(fields);
    const sections = {
      ppe: mappedFields.ppeData,
      customer: mappedFields.customerData,
      correspondence: mappedFields.correspondenceData,
      supplier: mappedFields.supplierData,
      billing: mappedFields.billingData
    };
    return acc + calculateAverageConfidence(sections);
  }, 0) / documents.length;

  // Oblicz kompletność i przydatność dla wszystkich dokumentów
  const documentsStats = documents.map(doc => {
    const fields = doc.modelResults[0]?.fields || {};
    const mappedFields = mapFields(fields);
    const sections = {
      ppe: mappedFields.ppeData,
      customer: mappedFields.customerData,
      correspondence: mappedFields.correspondenceData,
      supplier: mappedFields.supplierData,
      billing: mappedFields.billingData
    };
    
    return {
      completeness: calculateDocumentCompleteness(sections),
      isUsable: calculateUsability(sections)
    };
  });

  // Oblicz średnią kompletność
  const averageCompleteness = documentsStats.reduce((acc, doc) => acc + doc.completeness, 0) / documentsStats.length;

  // Oblicz procent przydatnych dokumentów
  const usablePercentage = documentsStats.filter(doc => doc.isUsable).length / documentsStats.length;

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Podsumowanie analizy</h2>
          <div className="text-sm text-muted-foreground">
            Przeanalizowano {documents.length} {documents.length === 1 ? 'dokument' : 'dokumentów'}
            {totalTime !== undefined && ` w ${(totalTime / 1000).toFixed(1)}s`}
          </div>
        </div>
        {onExport && (
          <Button onClick={onExport} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Eksportuj wyniki
          </Button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-8 mt-4">
        <div>
          <p className="text-sm text-muted-foreground">Średnia pewność</p>
          <p className="text-2xl font-semibold">{(averageConfidence * 100).toFixed(1)}%</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Średnia kompletność</p>
          <p className="text-2xl font-semibold">{(averageCompleteness * 100).toFixed(1)}%</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Przydatne dokumenty</p>
          <p className="text-2xl font-semibold">{(usablePercentage * 100).toFixed(1)}%</p>
          <p className="text-sm text-muted-foreground">
            ({documentsStats.filter(doc => doc.isUsable).length} z {documentsStats.length})
          </p>
        </div>
      </div>
    </Card>
  );
} 
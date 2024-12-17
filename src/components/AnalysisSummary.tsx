'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { formatPercentage } from '@/utils/text-formatting';
import { calculateDocumentCompleteness, calculateUsability, calculateAverageConfidence } from '@/utils/data-processing/completeness/confidence';
import type { ProcessingResult } from '@/types/processing';
import type { PPEData, CustomerData, CorrespondenceData, SupplierData, BillingData } from '@/types/fields';
import type { DocumentField } from '@/types/document';
import { cn } from '@/lib/utils';

interface AnalysisSummaryProps {
  documents: ProcessingResult[];
  totalTime?: number;
  onExport?: () => void;
  usabilityResults: boolean[];
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

export function AnalysisSummary({ documents, totalTime, onExport, usabilityResults }: AnalysisSummaryProps) {
  // Oblicz średnią pewność
  const averageConfidence = documents.length > 0
    ? documents.reduce((sum, doc) => sum + (doc.confidence || 0), 0) / documents.length
    : 0;

  // Oblicz rozkład pewności
  const confidenceDistribution = {
    high: documents.filter(doc => doc.confidence >= 0.9).length,
    medium: documents.filter(doc => doc.confidence >= 0.7 && doc.confidence < 0.9).length,
    low: documents.filter(doc => doc.confidence < 0.7).length,
  };

  // Oblicz średni czas na dokument
  const averageTimePerDocument = totalTime && documents.length > 0
    ? totalTime / documents.length
    : 0;

  // Oblicz procent przydatnych dokumentów
  const usableDocuments = usabilityResults.filter(Boolean).length;
  const usabilityPercentage = documents.length > 0
    ? (usableDocuments / documents.length) * 100
    : 0;

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Podsumowanie analizy</h2>
          {onExport && (
            <Button onClick={onExport} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Eksportuj wyniki
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Liczba dokumentów */}
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-sm font-medium text-gray-500">Przeanalizowane dokumenty</div>
            <div className="mt-1 flex items-baseline justify-between">
              <div className="text-2xl font-semibold">{documents.length}</div>
              {averageTimePerDocument > 0 && (
                <div className="text-sm text-gray-500">
                  {(averageTimePerDocument / 1000).toFixed(1)}s / dokument
                </div>
              )}
            </div>
          </div>

          {/* Średnia pewność */}
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-sm font-medium text-gray-500">Średnia pewność</div>
            <div className="mt-1 flex items-baseline justify-between">
              <div className={cn(
                "text-2xl font-semibold",
                averageConfidence >= 0.9 ? "text-green-600" :
                averageConfidence >= 0.7 ? "text-yellow-600" :
                "text-red-600"
              )}>
                {(averageConfidence * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Rozkład pewności */}
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-sm font-medium text-gray-500">Rozkład pewności</div>
            <div className="mt-1 space-y-1">
              <div className="flex justify-between items-center">
                <Badge variant="secondary" className="bg-green-50 text-green-700">
                  Wysoka (&ge;90%)
                </Badge>
                <span className="text-sm font-medium">{confidenceDistribution.high}</span>
              </div>
              <div className="flex justify-between items-center">
                <Badge variant="secondary" className="bg-yellow-50 text-yellow-700">
                  Średnia (70-89%)
                </Badge>
                <span className="text-sm font-medium">{confidenceDistribution.medium}</span>
              </div>
              <div className="flex justify-between items-center">
                <Badge variant="secondary" className="bg-red-50 text-red-700">
                  Niska (&lt;70%)
                </Badge>
                <span className="text-sm font-medium">{confidenceDistribution.low}</span>
              </div>
            </div>
          </div>

          {/* Przydatne dokumenty */}
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-sm font-medium text-gray-500">Przydatne dokumenty</div>
            <div className="mt-1 flex items-baseline justify-between">
              <div className="text-2xl font-semibold">
                {usableDocuments} z {documents.length}
              </div>
              <div className={cn(
                "text-sm font-medium",
                usabilityPercentage >= 90 ? "text-green-600" :
                usabilityPercentage >= 70 ? "text-yellow-600" :
                "text-red-600"
              )}>
                {usabilityPercentage.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
} 
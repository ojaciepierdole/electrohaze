'use client';

import * as React from 'react';
import { VirtualizedResultsList } from '@/components/VirtualizedResultsList';
import { AnalysisResultCard } from '@/components/AnalysisResultCard';
import type { ProcessingResult } from '@/types/processing';
import type { PPEData, CustomerData, CorrespondenceData, SupplierData, BillingData } from '@/types/fields';

interface BatchProcessingResultsProps {
  results: ProcessingResult[];
  onExport?: () => void;
}

function mapFields(fields: Record<string, any>): {
  ppeData: Partial<PPEData>;
  customerData: Partial<CustomerData>;
  correspondenceData: Partial<CorrespondenceData>;
  supplierData: Partial<SupplierData>;
  billingData: Partial<BillingData>;
} {
  const result = {
    ppeData: {} as Partial<PPEData>,
    customerData: {} as Partial<CustomerData>,
    correspondenceData: {} as Partial<CorrespondenceData>,
    supplierData: {} as Partial<SupplierData>,
    billingData: {} as Partial<BillingData>
  };

  // Mapuj pola PPE
  ['ppeNum', 'MeterNumber', 'Tariff', 'ContractNumber', 'ContractType', 'dpStreet', 'dpBuilding', 'dpUnit', 'dpPostalCode', 'dpCity', 'dpProvince', 'dpMunicipality', 'dpDistrict', 'dpMeterID'].forEach(key => {
    if (key in fields) {
      result.ppeData[key as keyof PPEData] = fields[key];
    }
  });

  // Mapuj pola klienta
  ['FirstName', 'LastName', 'BusinessName', 'taxID', 'Street', 'Building', 'Unit', 'PostalCode', 'City', 'Municipality', 'District', 'Province'].forEach(key => {
    if (key in fields) {
      result.customerData[key as keyof CustomerData] = fields[key];
    }
  });

  // Mapuj pola adresu korespondencyjnego
  ['paFirstName', 'paLastName', 'paBusinessName', 'paTitle', 'paStreet', 'paBuilding', 'paUnit', 'paPostalCode', 'paCity', 'paProvince', 'paMunicipality', 'paDistrict'].forEach(key => {
    if (key in fields) {
      result.correspondenceData[key as keyof CorrespondenceData] = fields[key];
    }
  });

  // Mapuj pola dostawcy
  ['supplierName', 'spTaxID', 'spStreet', 'spBuilding', 'spUnit', 'spPostalCode', 'spCity', 'spProvince', 'spMunicipality', 'spDistrict', 'spIBAN', 'spPhoneNum', 'spWebUrl', 'OSD_name', 'OSD_region'].forEach(key => {
    if (key in fields) {
      result.supplierData[key as keyof SupplierData] = fields[key];
    }
  });

  // Mapuj pola rozliczeniowe
  ['BillingStartDate', 'BillingEndDate', 'BilledUsage', '12mUsage'].forEach(key => {
    const mappedKey = key === 'BillingStartDate' ? 'billingStartDate' :
                     key === 'BillingEndDate' ? 'billingEndDate' :
                     key === 'BilledUsage' ? 'billedUsage' :
                     key === '12mUsage' ? 'usage12m' : key;
    
    if (key in fields) {
      result.billingData[mappedKey as keyof BillingData] = fields[key];
    }
  });

  return result;
}

export function BatchProcessingResults({ results, onExport }: BatchProcessingResultsProps) {
  return (
    <div className="space-y-4">
      <VirtualizedResultsList
        results={results}
        CardComponent={({ result }) => {
          const fields = result.modelResults[0]?.fields || {};
          const mappedFields = mapFields(fields);
          return (
            <AnalysisResultCard
              fileName={result.fileName}
              confidence={result.modelResults[0]?.confidence || 0}
              {...mappedFields}
            />
          );
        }}
      />
    </div>
  );
} 
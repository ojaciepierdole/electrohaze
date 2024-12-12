'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';
import type { ProcessingResult, GroupedResult, AddressSet } from '@/types/processing';
import type { CustomerData, PPEData, CorrespondenceData, SupplierData, BillingData } from '@/types/fields';
import { CustomerDataGroup } from './data-groups/CustomerDataGroup';
import { PPEDataGroup } from './data-groups/PPEDataGroup';
import { CorrespondenceDataGroup } from './data-groups/CorrespondenceDataGroup';
import { SupplierDataGroup } from './data-groups/SupplierDataGroup';
import { BillingDataGroup } from './data-groups/BillingDataGroup';
import { AnalysisSummary } from './AnalysisSummary';
import { enrichAddressData } from '@/utils/address-enrichment';
import { processNames } from '@/utils/name-helpers';
import { calculateDocumentConfidence } from '@/utils/text-formatting';

interface AnalysisResultCardProps {
  result: ProcessingResult | GroupedResult;
  totalTime?: number;
  onExport?: () => void;
}

export function AnalysisResultCard({ result, totalTime, onExport }: AnalysisResultCardProps) {
  const modelResults = ('results' in result 
    ? (result as { results: Array<{ modelId: string; fields: Record<string, any>; confidence: number; pageCount: number; }> }).results 
    : result.modelResults);

  // Konwertuj pola do odpowiednich struktur danych
  const data = React.useMemo(() => {
    const fields = modelResults[0]?.fields || {};
    
    // Przygotuj dane do wzbogacenia
    const addressData: AddressSet = {
      // Podstawowe pola adresowe
      FirstName: fields.FirstName?.content || undefined,
      LastName: fields.LastName?.content || undefined,
      Street: fields.Street?.content || undefined,
      Building: fields.Building?.content || undefined,
      Unit: fields.Unit?.content || undefined,
      PostalCode: fields.PostalCode?.content || undefined,
      City: fields.City?.content || undefined,
      Title: fields.Title?.content || undefined,
      Municipality: fields.Municipality?.content || undefined,
      District: fields.District?.content || undefined,
      Province: fields.Province?.content || undefined,

      // Pola adresu korespondencyjnego
      paFirstName: fields.paFirstName?.content || undefined,
      paLastName: fields.paLastName?.content || undefined,
      paStreet: fields.paStreet?.content || undefined,
      paBuilding: fields.paBuilding?.content || undefined,
      paUnit: fields.paUnit?.content || undefined,
      paPostalCode: fields.paPostalCode?.content || undefined,
      paCity: fields.paCity?.content || undefined,
      paTitle: fields.paTitle?.content || undefined,
      paMunicipality: fields.paMunicipality?.content || undefined,
      paDistrict: fields.paDistrict?.content || undefined,
      paProvince: fields.paProvince?.content || undefined,

      // Pola adresu PPE
      ppeFirstName: fields.ppeFirstName?.content || undefined,
      ppeLastName: fields.ppeLastName?.content || undefined,
      ppeStreet: fields.ppeStreet?.content || undefined,
      ppeBuilding: fields.ppeBuilding?.content || undefined,
      ppeUnit: fields.ppeUnit?.content || undefined,
      ppePostalCode: fields.ppePostalCode?.content || undefined,
      ppeCity: fields.ppeCity?.content || undefined,
      ppeTitle: fields.ppeTitle?.content || undefined,
      ppeMunicipality: fields.ppeMunicipality?.content || undefined,
      ppeDistrict: fields.ppeDistrict?.content || undefined,
      ppeProvince: fields.ppeProvince?.content || undefined,
    };

    // Wzbogać dane adresowe
    const enrichedAddress = enrichAddressData(addressData);

    // Przetwórz imiona i nazwiska
    const mainNames = processNames(`${enrichedAddress.FirstName || ''} ${enrichedAddress.LastName || ''}`);
    const paNames = processNames(`${enrichedAddress.paFirstName || ''} ${enrichedAddress.paLastName || ''}`);

    return {
      customer: {
        FirstName: mainNames.firstName || enrichedAddress.FirstName || null,
        LastName: mainNames.lastName || enrichedAddress.LastName || null,
        BusinessName: fields.BusinessName?.content || null,
        taxID: fields.taxID?.content || null,
        Street: enrichedAddress.Street || null,
        Building: enrichedAddress.Building || null,
        Unit: enrichedAddress.Unit || null,
        PostalCode: enrichedAddress.PostalCode || null,
        City: enrichedAddress.City || null,
        Municipality: enrichedAddress.Municipality || null,
        District: enrichedAddress.District || null,
        Province: enrichedAddress.Province || null
      } as CustomerData,
      
      ppe: {
        // Dane identyfikacyjne PPE
        ppeNum: fields.ppeNum?.content || null,
        // Dane techniczne
        MeterNumber: fields.MeterNumber?.content || null,
        TariffGroup: fields.Tariff?.content || null,
        ContractNumber: fields.ContractNumber?.content || null,
        ContractType: fields.ContractType?.content || null,
        OSD_name: fields.OSD_name?.content || null,
        OSD_region: fields.OSD_region?.content || null,
        ProductName: fields.ProductName?.content || null,
        // Dane osobowe z Azure API
        dpFirstName: fields.dpFirstName?.content || null,
        dpLastName: fields.dpLastName?.content || null,
        // Dane adresowe z Azure API
        dpStreet: fields.dpStreet?.content || null,
        dpBuilding: fields.dpBuilding?.content || null,
        dpUnit: fields.dpUnit?.content || null,
        dpPostalCode: fields.dpPostalCode?.content || null,
        dpCity: fields.dpCity?.content || null
      } as PPEData,
      
      correspondence: {
        paFirstName: paNames.firstName || enrichedAddress.paFirstName || null,
        paLastName: paNames.lastName || enrichedAddress.paLastName || null,
        paBusinessName: fields.paBusinessName?.content || null,
        paTitle: paNames.title || null,
        paStreet: enrichedAddress.paStreet || null,
        paBuilding: enrichedAddress.paBuilding || null,
        paUnit: enrichedAddress.paUnit || null,
        paPostalCode: enrichedAddress.paPostalCode || null,
        paCity: enrichedAddress.paCity || null,
      } as CorrespondenceData,
      
      supplier: {
        supplierName: fields.supplierName?.content || null,
        supplierTaxID: fields.supplierTaxID?.content || null,
        supplierStreet: fields.supplierStreet?.content || null,
        supplierBuilding: fields.supplierBuilding?.content || null,
        supplierUnit: fields.supplierUnit?.content || null,
        supplierPostalCode: fields.supplierPostalCode?.content || null,
        supplierCity: fields.supplierCity?.content || null,
        supplierBankAccount: fields.supplierBankAccount?.content || null,
        supplierBankName: fields.supplierBankName?.content || null,
        supplierEmail: fields.supplierEmail?.content || null,
        supplierPhone: fields.supplierPhone?.content || null,
        supplierWebsite: fields.supplierWebsite?.content || null,
        OSD_name: fields.OSD_name?.content || null,
        OSD_region: fields.OSD_region?.content || null,
      } as SupplierData,
      
      billing: {
        billingStartDate: fields.BillingStartDate?.content || undefined,
        billingEndDate: fields.BillingEndDate?.content || undefined,
        billedUsage: fields.BilledUsage?.content ? parseFloat(fields.BilledUsage.content) : undefined,
        usage12m: fields.usage12m?.content ? parseFloat(fields.usage12m.content) : undefined,
        confidence: fields.confidence || undefined,
      } satisfies Partial<BillingData>,
    };
  }, [modelResults]);

  // Oblicz statystyki dokumentu
  const documentStats = React.useMemo(() => {
    // Agreguj wyniki ze wszystkich modeli
    const allFields = modelResults.reduce((acc, model) => ({
      ...acc,
      ...model.fields
    }), {});
    return calculateDocumentConfidence(allFields);
  }, [modelResults]);

  // Oblicz procenty kompletności i pewności
  const completionPercentage = Math.round((documentStats.totalFilledFields / documentStats.totalFields) * 100);
  const confidencePercentage = Math.round(documentStats.averageConfidence * 100);

  const renderDocumentHeader = () => (
    <div className="p-4 border-b">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-medium truncate max-w-[200px]" title={result.fileName}>
            {result.fileName}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <span className="text-sm text-gray-500">Pewność</span>
            <Badge variant={confidencePercentage > 80 ? "success" : confidencePercentage > 60 ? "warning" : "destructive"}>
              {confidencePercentage}%
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-sm text-gray-500">Model</span>
            <Badge variant={modelResults[0].confidence > 0.8 ? "success" : modelResults[0].confidence > 0.6 ? "warning" : "destructive"}>
              {(modelResults[0].confidence * 100).toFixed(1)}%
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-sm text-gray-500">Kompletność</span>
            <Badge variant="outline">
              {completionPercentage}%
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );

  // Jeśli mamy wiele dokumentów, pokaż podsumowanie
  if ('results' in result && totalTime !== undefined) {
    return (
      <div className="space-y-6">
        <AnalysisSummary 
          documents={[{ modelResults }]} 
          totalTime={totalTime}
          onExport={onExport}
        />

        <Card className="bg-white shadow-sm">
          {renderDocumentHeader()}
          <div className="p-4 space-y-6">
            <SupplierDataGroup data={data.supplier} />
            <PPEDataGroup data={data.ppe} />
            <CustomerDataGroup data={data.customer} />
            <CorrespondenceDataGroup data={data.correspondence} />
            <BillingDataGroup data={data.billing} />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <Card className="bg-white shadow-sm">
      {renderDocumentHeader()}
      <div className="p-4 space-y-6">
        <SupplierDataGroup data={data.supplier} />
        <PPEDataGroup data={data.ppe} />
        <CustomerDataGroup data={data.customer} />
        <CorrespondenceDataGroup data={data.correspondence} />
        <BillingDataGroup data={data.billing} />
      </div>
    </Card>
  );
} 
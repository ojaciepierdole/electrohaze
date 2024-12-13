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
        FirstName: fields.FirstName ? {
          content: fields.FirstName.content || null,
          confidence: fields.FirstName.confidence || 1
        } : undefined,
        LastName: fields.LastName ? {
          content: fields.LastName.content || null,
          confidence: fields.LastName.confidence || 1
        } : undefined,
        BusinessName: fields.BusinessName ? {
          content: fields.BusinessName.content || null,
          confidence: fields.BusinessName.confidence || 1
        } : undefined,
        taxID: fields.taxID ? {
          content: fields.taxID.content || null,
          confidence: fields.taxID.confidence || 1
        } : undefined,
        Street: fields.Street ? {
          content: fields.Street.content || null,
          confidence: fields.Street.confidence || 1
        } : undefined,
        Building: fields.Building ? {
          content: fields.Building.content || null,
          confidence: fields.Building.confidence || 1
        } : undefined,
        Unit: fields.Unit ? {
          content: fields.Unit.content || null,
          confidence: fields.Unit.confidence || 1
        } : undefined,
        PostalCode: fields.PostalCode ? {
          content: fields.PostalCode.content || null,
          confidence: fields.PostalCode.confidence || 1
        } : undefined,
        City: fields.City ? {
          content: fields.City.content || null,
          confidence: fields.City.confidence || 1
        } : undefined,
        Municipality: fields.Municipality ? {
          content: fields.Municipality.content || null,
          confidence: fields.Municipality.confidence || 1
        } : undefined,
        District: fields.District ? {
          content: fields.District.content || null,
          confidence: fields.District.confidence || 1
        } : undefined,
        Province: fields.Province ? {
          content: fields.Province.content || null,
          confidence: fields.Province.confidence || 1
        } : undefined,
      } as CustomerData,
      
      ppe: {
        ppeNum: fields.ppeNum ? {
          content: fields.ppeNum.content || null,
          confidence: fields.ppeNum.confidence || 1
        } : undefined,
        MeterNumber: fields.MeterNumber ? {
          content: fields.MeterNumber.content || null,
          confidence: fields.MeterNumber.confidence || 1
        } : undefined,
        TariffGroup: fields.TariffGroup ? {
          content: fields.TariffGroup.content || null,
          confidence: fields.TariffGroup.confidence || 1
        } : undefined,
        ContractNumber: fields.ContractNumber ? {
          content: fields.ContractNumber.content || null,
          confidence: fields.ContractNumber.confidence || 1
        } : undefined,
        ContractType: fields.ContractType ? {
          content: fields.ContractType.content || null,
          confidence: fields.ContractType.confidence || 1
        } : undefined,
        OSD_name: fields.OSD_name ? {
          content: fields.OSD_name.content || null,
          confidence: fields.OSD_name.confidence || 1
        } : undefined,
        OSD_region: fields.OSD_region ? {
          content: fields.OSD_region.content || null,
          confidence: fields.OSD_region.confidence || 1
        } : undefined,
        ProductName: fields.ProductName ? {
          content: fields.ProductName.content || null,
          confidence: fields.ProductName.confidence || 1
        } : undefined,
        dpFirstName: fields.dpFirstName ? {
          content: fields.dpFirstName.content || null,
          confidence: fields.dpFirstName.confidence || 1
        } : undefined,
        dpLastName: fields.dpLastName ? {
          content: fields.dpLastName.content || null,
          confidence: fields.dpLastName.confidence || 1
        } : undefined,
        dpStreet: fields.dpStreet ? {
          content: fields.dpStreet.content || null,
          confidence: fields.dpStreet.confidence || 1
        } : undefined,
        dpBuilding: fields.dpBuilding ? {
          content: fields.dpBuilding.content || null,
          confidence: fields.dpBuilding.confidence || 1
        } : undefined,
        dpUnit: fields.dpUnit ? {
          content: fields.dpUnit.content || null,
          confidence: fields.dpUnit.confidence || 1
        } : undefined,
        dpPostalCode: fields.dpPostalCode ? {
          content: fields.dpPostalCode.content || null,
          confidence: fields.dpPostalCode.confidence || 1
        } : undefined,
        dpCity: fields.dpCity ? {
          content: fields.dpCity.content || null,
          confidence: fields.dpCity.confidence || 1
        } : undefined,
      } as PPEData,
      
      correspondence: {
        paFirstName: fields.paFirstName ? {
          content: fields.paFirstName.content || null,
          confidence: fields.paFirstName.confidence || 1
        } : undefined,
        paLastName: fields.paLastName ? {
          content: fields.paLastName.content || null,
          confidence: fields.paLastName.confidence || 1
        } : undefined,
        paBusinessName: fields.paBusinessName ? {
          content: fields.paBusinessName.content || null,
          confidence: fields.paBusinessName.confidence || 1
        } : undefined,
        paTitle: fields.paTitle ? {
          content: fields.paTitle.content || null,
          confidence: fields.paTitle.confidence || 1
        } : undefined,
        paStreet: fields.paStreet ? {
          content: fields.paStreet.content || null,
          confidence: fields.paStreet.confidence || 1
        } : undefined,
        paBuilding: fields.paBuilding ? {
          content: fields.paBuilding.content || null,
          confidence: fields.paBuilding.confidence || 1
        } : undefined,
        paUnit: fields.paUnit ? {
          content: fields.paUnit.content || null,
          confidence: fields.paUnit.confidence || 1
        } : undefined,
        paPostalCode: fields.paPostalCode ? {
          content: fields.paPostalCode.content || null,
          confidence: fields.paPostalCode.confidence || 1
        } : undefined,
        paCity: fields.paCity ? {
          content: fields.paCity.content || null,
          confidence: fields.paCity.confidence || 1
        } : undefined,
      } as CorrespondenceData,
      
      supplier: {
        supplierName: fields.supplierName ? {
          content: fields.supplierName.content || null,
          confidence: fields.supplierName.confidence || 1
        } : undefined,
        supplierTaxID: fields.supplierTaxID ? {
          content: fields.supplierTaxID.content || null,
          confidence: fields.supplierTaxID.confidence || 1
        } : undefined,
        supplierStreet: fields.supplierStreet ? {
          content: fields.supplierStreet.content || null,
          confidence: fields.supplierStreet.confidence || 1
        } : undefined,
        supplierBuilding: fields.supplierBuilding ? {
          content: fields.supplierBuilding.content || null,
          confidence: fields.supplierBuilding.confidence || 1
        } : undefined,
        supplierUnit: fields.supplierUnit ? {
          content: fields.supplierUnit.content || null,
          confidence: fields.supplierUnit.confidence || 1
        } : undefined,
        supplierPostalCode: fields.supplierPostalCode ? {
          content: fields.supplierPostalCode.content || null,
          confidence: fields.supplierPostalCode.confidence || 1
        } : undefined,
        supplierCity: fields.supplierCity ? {
          content: fields.supplierCity.content || null,
          confidence: fields.supplierCity.confidence || 1
        } : undefined,
        supplierBankAccount: fields.supplierBankAccount ? {
          content: fields.supplierBankAccount.content || null,
          confidence: fields.supplierBankAccount.confidence || 1
        } : undefined,
        supplierBankName: fields.supplierBankName ? {
          content: fields.supplierBankName.content || null,
          confidence: fields.supplierBankName.confidence || 1
        } : undefined,
        supplierEmail: fields.supplierEmail ? {
          content: fields.supplierEmail.content || null,
          confidence: fields.supplierEmail.confidence || 1
        } : undefined,
        supplierPhone: fields.supplierPhone ? {
          content: fields.supplierPhone.content || null,
          confidence: fields.supplierPhone.confidence || 1
        } : undefined,
        supplierWebsite: fields.supplierWebsite ? {
          content: fields.supplierWebsite.content || null,
          confidence: fields.supplierWebsite.confidence || 1
        } : undefined,
        OSD_name: fields.OSD_name ? {
          content: fields.OSD_name.content || null,
          confidence: fields.OSD_name.confidence || 1
        } : undefined,
        OSD_region: fields.OSD_region ? {
          content: fields.OSD_region.content || null,
          confidence: fields.OSD_region.confidence || 1
        } : undefined,
      } as SupplierData,
      
      billing: {
        billingStartDate: fields.BillingStartDate ? {
          content: fields.BillingStartDate.content || null,
          confidence: fields.BillingStartDate.confidence || 1
        } : undefined,
        billingEndDate: fields.BillingEndDate ? {
          content: fields.BillingEndDate.content || null,
          confidence: fields.BillingEndDate.confidence || 1
        } : undefined,
        billedUsage: fields.BilledUsage ? {
          content: fields.BilledUsage.content || null,
          confidence: fields.BilledUsage.confidence || 1
        } : undefined,
        usage12m: fields.usage12m ? {
          content: fields.usage12m.content || null,
          confidence: fields.usage12m.confidence || 1
        } : undefined,
      } as BillingData,
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
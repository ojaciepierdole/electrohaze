'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';
import type { ProcessingResult, GroupedResult, AddressSet } from '@/types/processing';
import type { CustomerData, PPEData, CorrespondenceData, SupplierData, BillingData } from '@/types/fields';
import type { ProcessSectionInput } from '@/types/document-processing';
import { processSection } from '@/utils/data-processing';
import { CustomerDataGroup } from './data-groups/CustomerDataGroup';
import { PPEDataGroup } from './data-groups/PPEDataGroup';
import { CorrespondenceDataGroup } from './data-groups/CorrespondenceDataGroup';
import { SupplierDataGroup } from './data-groups/SupplierDataGroup';
import { BillingDataGroup } from './data-groups/BillingDataGroup';
import { AnalysisSummary } from './AnalysisSummary';
import { enrichAddressData } from '@/utils/address-enrichment';
import { processNames } from '@/utils/name-helpers';
import { calculateDocumentConfidence } from '@/utils/text-formatting';
import { SupplierLogo } from '@/components/ui/supplier-logo';
import { normalizeAddress } from '@/utils/data-processing/normalizers/address';

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
    if (!modelResults?.[0]?.fields) {
      return null;
    }

    const fields = modelResults[0].fields;

    // Normalizuj dane adresowe
    const dpAddress = normalizeAddress(
      {
        content: `${fields.dpStreet?.content || ''} ${fields.dpBuilding?.content || ''}`,
        confidence: fields.dpStreet?.confidence || 0
      },
      {},
      'dp'
    );

    // Przygotuj dane do wzbogacenia
    const addressData: AddressSet = {
      // Podstawowe pola adresowe
      FirstName: fields.FirstName?.content || undefined,
      LastName: fields.LastName?.content || undefined,
      BusinessName: fields.BusinessName?.content || undefined,
      TaxID: fields.taxID?.content || undefined,
      MeterID: fields.MeterNumber?.content || undefined,
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
      paBusinessName: fields.paBusinessName?.content || undefined,
      paTaxID: fields.paTaxID?.content || undefined,
      paMeterID: fields.paMeterID?.content || undefined,
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
      dpFirstName: fields.dpFirstName?.content || undefined,
      dpLastName: fields.dpLastName?.content || undefined,
      dpBusinessName: fields.dpBusinessName?.content || undefined,
      dpTaxID: fields.dpTaxID?.content || undefined,
      dpMeterID: fields.dpMeterID?.content || undefined,
      dpStreet: dpAddress.dpStreet || undefined,
      dpBuilding: dpAddress.dpBuilding || undefined,
      dpUnit: dpAddress.dpUnit || undefined,
      dpPostalCode: fields.dpPostalCode?.content || undefined,
      dpCity: fields.dpCity?.content || undefined,
      dpTitle: fields.dpTitle?.content || undefined,
      dpMunicipality: fields.dpMunicipality?.content || undefined,
      dpDistrict: fields.dpDistrict?.content || undefined,
      dpProvince: fields.dpProvince?.content || undefined,

      // Pola dostawcy (supplier)
      spFirstName: fields.spFirstName?.content || undefined,
      spLastName: fields.spLastName?.content || undefined,
      spBusinessName: fields.spBusinessName?.content || undefined,
      spTaxID: fields.spTaxID?.content || undefined,
      spMeterID: fields.spMeterID?.content || undefined,
      spStreet: fields.spStreet?.content || undefined,
      spBuilding: fields.spBuilding?.content || undefined,
      spUnit: fields.spUnit?.content || undefined,
      spPostalCode: fields.spPostalCode?.content || undefined,
      spCity: fields.spCity?.content || undefined,
      spTitle: fields.spTitle?.content || undefined,
      spMunicipality: fields.spMunicipality?.content || undefined,
      spDistrict: fields.spDistrict?.content || undefined,
      spProvince: fields.spProvince?.content || undefined,

      // Pole specjalne
      ppeNum: fields.ppeNum?.content || undefined,
    };

    // Wzbogać dane adresowe
    const enrichedAddress = enrichAddressData(addressData);

    // Przetwórz imiona i nazwiska
    const mainNames = processNames(`${enrichedAddress.FirstName || ''} ${enrichedAddress.LastName || ''}`);
    const paNames = processNames(`${enrichedAddress.paFirstName || ''} ${enrichedAddress.paLastName || ''}`);

    return {
      customer: {
        FirstName: fields.FirstName ? {
          content: fields.FirstName.content || undefined,
          confidence: fields.FirstName.confidence || 1
        } : undefined,
        LastName: fields.LastName ? {
          content: fields.LastName.content || undefined,
          confidence: fields.LastName.confidence || 1
        } : undefined,
        BusinessName: fields.BusinessName ? {
          content: fields.BusinessName.content || undefined,
          confidence: fields.BusinessName.confidence || 1
        } : undefined,
        taxID: fields.taxID ? {
          content: fields.taxID.content || undefined,
          confidence: fields.taxID.confidence || 1
        } : undefined,
        Street: fields.Street ? {
          content: fields.Street.content || undefined,
          confidence: fields.Street.confidence || 1
        } : undefined,
        Building: fields.Building ? {
          content: fields.Building.content || undefined,
          confidence: fields.Building.confidence || 1
        } : undefined,
        Unit: fields.Unit ? {
          content: fields.Unit.content || undefined,
          confidence: fields.Unit.confidence || 1
        } : undefined,
        PostalCode: fields.PostalCode ? {
          content: fields.PostalCode.content || undefined,
          confidence: fields.PostalCode.confidence || 1
        } : undefined,
        City: fields.City ? {
          content: fields.City.content || undefined,
          confidence: fields.City.confidence || 1
        } : undefined,
        Municipality: fields.Municipality ? {
          content: fields.Municipality.content || undefined,
          confidence: fields.Municipality.confidence || 1
        } : undefined,
        District: fields.District ? {
          content: fields.District.content || undefined,
          confidence: fields.District.confidence || 1
        } : undefined,
        Province: fields.Province ? {
          content: fields.Province.content || undefined,
          confidence: fields.Province.confidence || 1
        } : undefined,
      } as CustomerData,
      
      ppe: {
        ppeNum: fields.ppeNum ? {
          content: fields.ppeNum.content || undefined,
          confidence: fields.ppeNum.confidence || 1
        } : undefined,
        MeterNumber: fields.MeterNumber ? {
          content: fields.MeterNumber.content || undefined,
          confidence: fields.MeterNumber.confidence || 1
        } : undefined,
        TariffGroup: fields.Tariff ? {
          content: fields.Tariff.content || undefined,
          confidence: fields.Tariff.confidence || 1
        } : undefined,
        ContractNumber: fields.ContractNumber ? {
          content: fields.ContractNumber.content || undefined,
          confidence: fields.ContractNumber.confidence || 1
        } : undefined,
        ContractType: fields.ContractType ? {
          content: fields.ContractType.content || undefined,
          confidence: fields.ContractType.confidence || 1
        } : undefined,
        dpStreet: {
          content: dpAddress.dpStreet,
          confidence: fields.dpStreet?.confidence || 1
        },
        dpBuilding: {
          content: dpAddress.dpBuilding,
          confidence: fields.dpBuilding?.confidence || 1
        },
        dpUnit: {
          content: dpAddress.dpUnit,
          confidence: fields.dpUnit?.confidence || 1
        },
        dpPostalCode: fields.dpPostalCode ? {
          content: fields.dpPostalCode.content || undefined,
          confidence: fields.dpPostalCode.confidence || 1
        } : undefined,
        dpCity: fields.dpCity ? {
          content: fields.dpCity.content || undefined,
          confidence: fields.dpCity.confidence || 1
        } : undefined,
        dpMunicipality: fields.dpMunicipality ? {
          content: fields.dpMunicipality.content || undefined,
          confidence: fields.dpMunicipality.confidence || 1
        } : undefined,
        dpDistrict: fields.dpDistrict ? {
          content: fields.dpDistrict.content || undefined,
          confidence: fields.dpDistrict.confidence || 1
        } : undefined,
        dpProvince: fields.dpProvince ? {
          content: fields.dpProvince.content || undefined,
          confidence: fields.dpProvince.confidence || 1
        } : undefined
      } as PPEData,
      
      correspondence: {
        paFirstName: fields.paFirstName ? {
          content: fields.paFirstName.content || undefined,
          confidence: fields.paFirstName.confidence || 1
        } : undefined,
        paLastName: fields.paLastName ? {
          content: fields.paLastName.content || undefined,
          confidence: fields.paLastName.confidence || 1
        } : undefined,
        paBusinessName: fields.paBusinessName ? {
          content: fields.paBusinessName.content || undefined,
          confidence: fields.paBusinessName.confidence || 1
        } : undefined,
        paTitle: fields.paTitle ? {
          content: fields.paTitle.content || undefined,
          confidence: fields.paTitle.confidence || 1
        } : undefined,
        paStreet: fields.paStreet ? {
          content: fields.paStreet.content || undefined,
          confidence: fields.paStreet.confidence || 1
        } : undefined,
        paBuilding: fields.paBuilding ? {
          content: fields.paBuilding.content || undefined,
          confidence: fields.paBuilding.confidence || 1
        } : undefined,
        paUnit: fields.paUnit ? {
          content: fields.paUnit.content || undefined,
          confidence: fields.paUnit.confidence || 1
        } : undefined,
        paPostalCode: fields.paPostalCode ? {
          content: fields.paPostalCode.content || undefined,
          confidence: fields.paPostalCode.confidence || 1
        } : undefined,
        paCity: fields.paCity ? {
          content: fields.paCity.content || undefined,
          confidence: fields.paCity.confidence || 1
        } : undefined,
      } as CorrespondenceData,
      
      supplier: {
        supplierName: fields.supplierName ? {
          content: fields.supplierName.content || undefined,
          confidence: fields.supplierName.confidence || 1
        } : undefined,
        supplierTaxID: fields.supplierTaxID ? {
          content: fields.supplierTaxID.content || undefined,
          confidence: fields.supplierTaxID.confidence || 1
        } : undefined,
        supplierStreet: fields.supplierStreet ? {
          content: fields.supplierStreet.content || undefined,
          confidence: fields.supplierStreet.confidence || 1
        } : undefined,
        supplierBuilding: fields.supplierBuilding ? {
          content: fields.supplierBuilding.content || undefined,
          confidence: fields.supplierBuilding.confidence || 1
        } : undefined,
        supplierUnit: fields.supplierUnit ? {
          content: fields.supplierUnit.content || undefined,
          confidence: fields.supplierUnit.confidence || 1
        } : undefined,
        supplierPostalCode: fields.supplierPostalCode ? {
          content: fields.supplierPostalCode.content || undefined,
          confidence: fields.supplierPostalCode.confidence || 1
        } : undefined,
        supplierCity: fields.supplierCity ? {
          content: fields.supplierCity.content || undefined,
          confidence: fields.supplierCity.confidence || 1
        } : undefined,
        supplierBankAccount: fields.supplierBankAccount ? {
          content: fields.supplierBankAccount.content || undefined,
          confidence: fields.supplierBankAccount.confidence || 1
        } : undefined,
        supplierBankName: fields.supplierBankName ? {
          content: fields.supplierBankName.content || undefined,
          confidence: fields.supplierBankName.confidence || 1
        } : undefined,
        supplierEmail: fields.supplierEmail ? {
          content: fields.supplierEmail.content || undefined,
          confidence: fields.supplierEmail.confidence || 1
        } : undefined,
        supplierPhone: fields.supplierPhone ? {
          content: fields.supplierPhone.content || undefined,
          confidence: fields.supplierPhone.confidence || 1
        } : undefined,
        supplierWebsite: fields.supplierWebsite ? {
          content: fields.supplierWebsite.content || undefined,
          confidence: fields.supplierWebsite.confidence || 1
        } : undefined,
        OSD_name: fields.OSD_name ? {
          content: fields.OSD_name.content || undefined,
          confidence: fields.OSD_name.confidence || 1
        } : undefined,
        OSD_region: fields.OSD_region ? {
          content: fields.OSD_region.content || undefined,
          confidence: fields.OSD_region.confidence || 1
        } : undefined,
      } as SupplierData,
      
      billing: {
        billingStartDate: fields.BillingStartDate ? {
          content: fields.BillingStartDate.content || undefined,
          confidence: fields.BillingStartDate.confidence || 1
        } : undefined,
        billingEndDate: fields.BillingEndDate ? {
          content: fields.BillingEndDate.content || undefined,
          confidence: fields.BillingEndDate.confidence || 1
        } : undefined,
        billedUsage: fields.BilledUsage ? {
          content: fields.BilledUsage.content || undefined,
          confidence: fields.BilledUsage.confidence || 1
        } : undefined,
        usage12m: fields.usage12m ? {
          content: fields.usage12m.content || undefined,
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
    <CardHeader className="border-b">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-medium truncate max-w-[300px]" title={result.fileName}>
            {result.fileName}
          </h3>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="font-normal">
            {completionPercentage}% kompletności
          </Badge>
          <Badge variant="outline" className="font-normal">
            {confidencePercentage}% pewności
          </Badge>
        </div>
      </div>
    </CardHeader>
  );

  return (
    <div className="space-y-6">
      {totalTime !== undefined && (
        <AnalysisSummary 
          documents={[{ modelResults }]} 
          totalTime={totalTime}
          onExport={onExport}
        />
      )}

      <Card className="bg-white shadow-sm">
        {renderDocumentHeader()}
        <div className="p-4 space-y-6">
          <SupplierDataGroup 
            data={data?.supplier || {
              supplierName: { content: undefined, confidence: 0 },
              supplierTaxID: { content: undefined, confidence: 0 },
              supplierStreet: { content: undefined, confidence: 0 },
              supplierBuilding: { content: undefined, confidence: 0 },
              supplierUnit: { content: undefined, confidence: 0 },
              supplierPostalCode: { content: undefined, confidence: 0 },
              supplierCity: { content: undefined, confidence: 0 },
              supplierBankAccount: { content: undefined, confidence: 0 },
              supplierBankName: { content: undefined, confidence: 0 },
              supplierEmail: { content: undefined, confidence: 0 },
              supplierPhone: { content: undefined, confidence: 0 },
              supplierWebsite: { content: undefined, confidence: 0 },
              OSD_name: { content: undefined, confidence: 0 },
              OSD_region: { content: undefined, confidence: 0 }
            }} 
            ppeData={data?.ppe || {
              ppeNum: { content: undefined, confidence: 0 },
              MeterNumber: { content: undefined, confidence: 0 },
              TariffGroup: { content: undefined, confidence: 0 },
              ContractNumber: { content: undefined, confidence: 0 },
              ContractType: { content: undefined, confidence: 0 },
              dpFirstName: { content: undefined, confidence: 0 },
              dpLastName: { content: undefined, confidence: 0 },
              dpStreet: { content: undefined, confidence: 0 },
              dpBuilding: { content: undefined, confidence: 0 },
              dpUnit: { content: undefined, confidence: 0 },
              dpPostalCode: { content: undefined, confidence: 0 },
              dpCity: { content: undefined, confidence: 0 },
              dpMunicipality: { content: undefined, confidence: 0 },
              dpDistrict: { content: undefined, confidence: 0 },
              dpProvince: { content: undefined, confidence: 0 },
              OSD_name: { content: undefined, confidence: 0 },
              OSD_region: { content: undefined, confidence: 0 }
            }}
            customerData={data?.customer || {
              FirstName: { content: undefined, confidence: 0 },
              LastName: { content: undefined, confidence: 0 },
              BusinessName: { content: undefined, confidence: 0 },
              taxID: { content: undefined, confidence: 0 },
              Street: { content: undefined, confidence: 0 },
              Building: { content: undefined, confidence: 0 },
              Unit: { content: undefined, confidence: 0 },
              PostalCode: { content: undefined, confidence: 0 },
              City: { content: undefined, confidence: 0 },
              Municipality: { content: undefined, confidence: 0 },
              District: { content: undefined, confidence: 0 },
              Province: { content: undefined, confidence: 0 }
            }}
            correspondenceData={data?.correspondence || {
              paFirstName: { content: undefined, confidence: 0 },
              paLastName: { content: undefined, confidence: 0 },
              paBusinessName: { content: undefined, confidence: 0 },
              paTitle: { content: undefined, confidence: 0 },
              paStreet: { content: undefined, confidence: 0 },
              paBuilding: { content: undefined, confidence: 0 },
              paUnit: { content: undefined, confidence: 0 },
              paPostalCode: { content: undefined, confidence: 0 },
              paCity: { content: undefined, confidence: 0 }
            }}
          />
          <PPEDataGroup data={data?.ppe || {
            ppeNum: { content: undefined, confidence: 0 },
            MeterNumber: { content: undefined, confidence: 0 },
            TariffGroup: { content: undefined, confidence: 0 },
            ContractNumber: { content: undefined, confidence: 0 },
            ContractType: { content: undefined, confidence: 0 },
            dpFirstName: { content: undefined, confidence: 0 },
            dpLastName: { content: undefined, confidence: 0 },
            dpStreet: { content: undefined, confidence: 0 },
            dpBuilding: { content: undefined, confidence: 0 },
            dpUnit: { content: undefined, confidence: 0 },
            dpPostalCode: { content: undefined, confidence: 0 },
            dpCity: { content: undefined, confidence: 0 },
            dpMunicipality: { content: undefined, confidence: 0 },
            dpDistrict: { content: undefined, confidence: 0 },
            dpProvince: { content: undefined, confidence: 0 },
            OSD_name: { content: undefined, confidence: 0 },
            OSD_region: { content: undefined, confidence: 0 }
          }} />
          <CustomerDataGroup data={data?.customer || {
            FirstName: { content: undefined, confidence: 0 },
            LastName: { content: undefined, confidence: 0 },
            BusinessName: { content: undefined, confidence: 0 },
            taxID: { content: undefined, confidence: 0 },
            Street: { content: undefined, confidence: 0 },
            Building: { content: undefined, confidence: 0 },
            Unit: { content: undefined, confidence: 0 },
            PostalCode: { content: undefined, confidence: 0 },
            City: { content: undefined, confidence: 0 },
            Municipality: { content: undefined, confidence: 0 },
            District: { content: undefined, confidence: 0 },
            Province: { content: undefined, confidence: 0 }
          }} />
          <CorrespondenceDataGroup data={data?.correspondence || {
            paFirstName: { content: undefined, confidence: 0 },
            paLastName: { content: undefined, confidence: 0 },
            paBusinessName: { content: undefined, confidence: 0 },
            paTitle: { content: undefined, confidence: 0 },
            paStreet: { content: undefined, confidence: 0 },
            paBuilding: { content: undefined, confidence: 0 },
            paUnit: { content: undefined, confidence: 0 },
            paPostalCode: { content: undefined, confidence: 0 },
            paCity: { content: undefined, confidence: 0 }
          }} />
          <BillingDataGroup data={data?.billing || {
            billingStartDate: { content: undefined, confidence: 0 },
            billingEndDate: { content: undefined, confidence: 0 },
            billedUsage: { content: undefined, confidence: 0 },
            usage12m: { content: undefined, confidence: 0 }
          }} />
        </div>
      </Card>
    </div>
  );
} 
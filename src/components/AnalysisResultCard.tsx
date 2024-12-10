'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';
import type { ProcessingResult, GroupedResult, AddressSet } from '@/types/processing';
import type { CustomerData, PPEData, DeliveryPointData, CorrespondenceData, SupplierData, BillingData } from '@/types/fields';
import { CustomerDataGroup } from './data-groups/CustomerDataGroup';
import { PPEDataGroup } from './data-groups/PPEDataGroup';
import { DeliveryPointDataGroup } from './data-groups/DeliveryPointDataGroup';
import { CorrespondenceDataGroup } from './data-groups/CorrespondenceDataGroup';
import { SupplierDataGroup } from './data-groups/SupplierDataGroup';
import { BillingDataGroup } from './data-groups/BillingDataGroup';
import { enrichAddressData } from '@/utils/address-enrichment';
import { processNames } from '@/utils/name-helpers';

interface AnalysisResultCardProps {
  result: ProcessingResult | GroupedResult;
}

export function AnalysisResultCard({ result }: AnalysisResultCardProps) {
  const modelResults = ('results' in result 
    ? (result as { results: Array<{ modelId: string; fields: Record<string, { content: string | null; confidence: number }>; confidence: number; pageCount: number; }> }).results 
    : result.modelResults);

  // Konwertuj pola do odpowiednich struktur danych
  const data = React.useMemo(() => {
    const fields = modelResults[0]?.fields || {};
    
    // Przygotuj dane do wzbogacenia
    const addressData: AddressSet = {
      // Dane podstawowe
      FirstName: fields.FirstName?.content || undefined,
      LastName: fields.LastName?.content || undefined,
      Street: fields.Street?.content || undefined,
      Building: fields.Building?.content || undefined,
      Unit: fields.Unit?.content || undefined,
      PostalCode: fields.PostalCode?.content || undefined,
      City: fields.City?.content || undefined,

      // Dane punktu dostawy
      dpFirstName: fields.dpFirstName?.content || undefined,
      dpLastName: fields.dpLastName?.content || undefined,
      dpStreet: fields.dpStreet?.content || undefined,
      dpBuilding: fields.dpBuilding?.content || undefined,
      dpUnit: fields.dpUnit?.content || undefined,
      dpPostalCode: fields.dpPostalCode?.content || undefined,
      dpCity: fields.dpCity?.content || undefined,

      // Dane korespondencyjne
      paFirstName: fields.paFirstName?.content || undefined,
      paLastName: fields.paLastName?.content || undefined,
      paStreet: fields.paStreet?.content || undefined,
      paBuilding: fields.paBuilding?.content || undefined,
      paUnit: fields.paUnit?.content || undefined,
      paPostalCode: fields.paPostalCode?.content || undefined,
      paCity: fields.paCity?.content || undefined,
    };

    // Wzbogać dane adresowe
    const enrichedAddress = enrichAddressData(addressData);

    // Przetwórz imiona i nazwiska
    const mainNames = processNames(`${enrichedAddress.FirstName || ''} ${enrichedAddress.LastName || ''}`);
    const dpNames = processNames(`${enrichedAddress.dpFirstName || ''} ${enrichedAddress.dpLastName || ''}`);
    const paNames = processNames(`${enrichedAddress.paFirstName || ''} ${enrichedAddress.paLastName || ''}`);

    return {
      customer: {
        FirstName: mainNames.firstName || enrichedAddress.FirstName || null,
        LastName: mainNames.lastName || enrichedAddress.LastName || null,
        BusinessName: fields.BusinessName?.content || null,
        taxID: fields.taxID?.content || null,
      } as CustomerData,
      
      ppe: {
        ppeNum: fields.ppeNum?.content || null,
        Street: enrichedAddress.Street || null,
        Building: enrichedAddress.Building || null,
        Unit: enrichedAddress.Unit || null,
        PostalCode: enrichedAddress.PostalCode || null,
        City: enrichedAddress.City || null,
      } as PPEData,
      
      delivery: {
        dpFirstName: dpNames.firstName || enrichedAddress.dpFirstName || null,
        dpLastName: dpNames.lastName || enrichedAddress.dpLastName || null,
        dpStreet: enrichedAddress.dpStreet || null,
        dpBuilding: enrichedAddress.dpBuilding || null,
        dpUnit: enrichedAddress.dpUnit || null,
        dpPostalCode: enrichedAddress.dpPostalCode || null,
        dpCity: enrichedAddress.dpCity || null,
      } as DeliveryPointData,
      
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
        OSD_name: fields.OSD_name?.content || null,
        OSD_region: fields.OSD_region?.content || null,
        ProductName: fields.ProductName?.content || null,
        Tariff: fields.Tariff?.content || null,
      } as SupplierData,
      
      billing: {
        BillingStartDate: fields.BillingStartDate?.content || null,
        BillingEndDate: fields.BillingEndDate?.content || null,
        InvoiceType: fields.InvoiceType?.content || null,
        BilledUsage: fields.BilledUsage?.content || null,
        ReadingType: fields.ReadingType?.content || null,
        "12mUsage": fields["12mUsage"]?.content || null,
        BillBreakdown: fields.BillBreakdown?.content || null,
        EnergySaleBreakdown: fields.EnergySaleBreakdown?.content || null,
      } as BillingData,
    };
  }, [modelResults]);

  return (
    <Card className="bg-white shadow-sm">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-medium truncate max-w-[200px]" title={result.fileName}>
            {result.fileName}
          </h3>
        </div>
        <Badge variant={modelResults[0].confidence > 0.8 ? "success" : modelResults[0].confidence > 0.6 ? "warning" : "destructive"}>
          {(modelResults[0].confidence * 100).toFixed(1)}%
        </Badge>
      </div>

      <div className="p-4 space-y-6">
        <SupplierDataGroup data={data.supplier} />
        <PPEDataGroup data={data.ppe} />
        <CustomerDataGroup data={data.customer} />
        <DeliveryPointDataGroup data={data.delivery} />
        <CorrespondenceDataGroup data={data.correspondence} />
        <BillingDataGroup data={data.billing} />
      </div>
    </Card>
  );
} 
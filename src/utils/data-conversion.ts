import type { DocumentAnalysisResult, DocumentField, FieldMetadata, TransformationType, DataSource } from '@/types/processing';
import { DataProcessor } from './core/data-processor';

function createDocumentField(content: string | undefined, kind: DocumentField['kind'] = 'string'): DocumentField {
  const metadata: FieldMetadata = {
    fieldType: kind,
    transformationType: 'raw' as TransformationType,
    source: 'azure' as DataSource
  };

  return {
    content: content || '',
    confidence: 1.0,
    kind,
    value: content || '',
    metadata
  };
}

export function convertAnalysisResult(result: DocumentAnalysisResult): Record<string, Record<string, DocumentField>> {
  const processor = new DataProcessor();
  const mappedData: Record<string, Record<string, DocumentField>> = {};

  // Mapuj pola do odpowiednich sekcji
  const fields = result.fields || {};

  // PPE
  mappedData.ppe = {
    ppeNum: createDocumentField(fields.PPENumber?.content),
    MeterNumber: createDocumentField(fields.MeterNumber?.content),
    TariffGroup: createDocumentField(fields.TariffGroup?.content),
    dpStreet: createDocumentField(fields.DeliveryStreet?.content),
    dpBuilding: createDocumentField(fields.DeliveryBuilding?.content),
    dpUnit: createDocumentField(fields.DeliveryUnit?.content),
    dpPostalCode: createDocumentField(fields.DeliveryPostalCode?.content),
    dpCity: createDocumentField(fields.DeliveryCity?.content),
    dpMunicipality: createDocumentField(fields.DeliveryMunicipality?.content),
    dpDistrict: createDocumentField(fields.DeliveryDistrict?.content),
    dpProvince: createDocumentField(fields.DeliveryProvince?.content)
  };

  // Dane klienta
  mappedData.customer = {
    FirstName: createDocumentField(fields.FirstName?.content),
    LastName: createDocumentField(fields.LastName?.content),
    BusinessName: createDocumentField(fields.BusinessName?.content),
    taxID: createDocumentField(fields.TaxID?.content),
    Street: createDocumentField(fields.Street?.content),
    Building: createDocumentField(fields.Building?.content),
    Unit: createDocumentField(fields.Unit?.content),
    PostalCode: createDocumentField(fields.PostalCode?.content),
    City: createDocumentField(fields.City?.content),
    Municipality: createDocumentField(fields.Municipality?.content),
    District: createDocumentField(fields.District?.content),
    Province: createDocumentField(fields.Province?.content)
  };

  // Adres korespondencyjny
  mappedData.correspondence = {
    paFirstName: createDocumentField(fields.PostalFirstName?.content),
    paLastName: createDocumentField(fields.PostalLastName?.content),
    paBusinessName: createDocumentField(fields.PostalBusinessName?.content),
    paStreet: createDocumentField(fields.PostalStreet?.content),
    paBuilding: createDocumentField(fields.PostalBuilding?.content),
    paUnit: createDocumentField(fields.PostalUnit?.content),
    paPostalCode: createDocumentField(fields.PostalPostalCode?.content),
    paCity: createDocumentField(fields.PostalCity?.content),
    paMunicipality: createDocumentField(fields.PostalMunicipality?.content),
    paDistrict: createDocumentField(fields.PostalDistrict?.content),
    paProvince: createDocumentField(fields.PostalProvince?.content)
  };

  // Dostawca
  mappedData.supplier = {
    supplierName: createDocumentField(fields.SupplierName?.content),
    supplierTaxID: createDocumentField(fields.SupplierTaxID?.content),
    supplierStreet: createDocumentField(fields.SupplierStreet?.content),
    supplierBuilding: createDocumentField(fields.SupplierBuilding?.content),
    supplierUnit: createDocumentField(fields.SupplierUnit?.content),
    supplierPostalCode: createDocumentField(fields.SupplierPostalCode?.content),
    supplierCity: createDocumentField(fields.SupplierCity?.content),
    supplierBankAccount: createDocumentField(fields.SupplierBankAccount?.content),
    supplierBankName: createDocumentField(fields.SupplierBankName?.content),
    supplierEmail: createDocumentField(fields.SupplierEmail?.content),
    supplierPhone: createDocumentField(fields.SupplierPhone?.content),
    supplierWebsite: createDocumentField(fields.SupplierWebsite?.content),
    OSD_name: createDocumentField(fields.OSDName?.content),
    OSD_region: createDocumentField(fields.OSDRegion?.content)
  };

  // Rozliczenia
  mappedData.billing = {
    billingStartDate: createDocumentField(fields.BillingStartDate?.content, 'date'),
    billingEndDate: createDocumentField(fields.BillingEndDate?.content, 'date'),
    billedUsage: createDocumentField(fields.BilledUsage?.content, 'number'),
    usage12m: createDocumentField(fields.Usage12m?.content, 'number')
  };

  return mappedData;
} 
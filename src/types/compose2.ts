// Interfejs reprezentujący surowe dane z modelu Compose-2
export interface Compose2Result {
  // Sprzedawca
  supplierName?: {
    type: string;
    content?: string;
    confidence: number;
  };
  
  // Nabywca
  firstName?: {
    type: string;
    content?: string;
    confidence: number;
  };
  lastName?: {
    type: string;
    content?: string;
    confidence: number;
  };
  street?: {
    type: string;
    content?: string;
    confidence: number;
  };
  building?: {
    type: string;
    content?: string;
    confidence: number;
  };
  unit?: {
    type: string;
    content?: string;
    confidence: number;
  };
  postalCode?: {
    type: string;
    content?: string;
    confidence: number;
  };
  city?: {
    type: string;
    content?: string;
    confidence: number;
  };

  // Adres korespondencyjny
  paTitle?: {
    type: string;
    content?: string;
    confidence: number;
  };
  paFirstName?: {
    type: string;
    content?: string;
    confidence: number;
  };
  paLastName?: {
    type: string;
    content?: string;
    confidence: number;
  };
  paStreet?: {
    type: string;
    content?: string;
    confidence: number;
  };
  paBuilding?: {
    type: string;
    content?: string;
    confidence: number;
  };
  paUnit?: {
    type: string;
    content?: string;
    confidence: number;
  };
  paPostalCode?: {
    type: string;
    content?: string;
    confidence: number;
  };
  paCity?: {
    type: string;
    content?: string;
    confidence: number;
  };

  // Punkt poboru energii
  ppeNum?: {
    type: string;
    content?: string;
    confidence: number;
  };
  Street?: {
    type: string;
    content?: string;
    confidence: number;
  };
  Building?: {
    type: string;
    content?: string;
    confidence: number;
  };
  Unit?: {
    type: string;
    content?: string;
    confidence: number;
  };
  PostalCode?: {
    type: string;
    content?: string;
    confidence: number;
  };
  City?: {
    type: string;
    content?: string;
    confidence: number;
  };
  Municipality?: {
    type: string;
    content?: string;
    confidence: number;
  };
  District?: {
    type: string;
    content?: string;
    confidence: number;
  };
  Province?: {
    type: string;
    content?: string;
    confidence: number;
  };
  MeterNumber?: {
    type: string;
    content?: string;
    confidence: number;
  };
  TariffGroup?: {
    type: string;
    content?: string;
    confidence: number;
  };
  ContractNumber?: {
    type: string;
    content?: string;
    confidence: number;
  };
  ContractType?: {
    type: string;
    content?: string;
    confidence: number;
  };
}

// Interfejs reprezentujący przetworzone dane do wyświetlenia
export interface DisplayInvoiceData {
  supplierName: string;
  
  // Nabywca
  customer: {
    fullName: string;
    address: string;
  };
  
  // Adres korespondencyjny
  correspondenceAddress: {
    fullName: string;
    address: string;
  };
  
  // Punkt dostawy
  deliveryPoint: {
    fullName: string;
    address: string;
    ppeNumber: string;
  };
} 
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

  // Adres dostawy
  dpFirstName?: {
    type: string;
    content?: string;
    confidence: number;
  };
  dpLastName?: {
    type: string;
    content?: string;
    confidence: number;
  };
  dpStreet?: {
    type: string;
    content?: string;
    confidence: number;
  };
  dpBuilding?: {
    type: string;
    content?: string;
    confidence: number;
  };
  dpUnit?: {
    type: string;
    content?: string;
    confidence: number;
  };
  dpPostalCode?: {
    type: string;
    content?: string;
    confidence: number;
  };
  dpCity?: {
    type: string;
    content?: string;
    confidence: number;
  };
  ppeNum?: {
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
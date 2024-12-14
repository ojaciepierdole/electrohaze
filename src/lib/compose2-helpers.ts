import { Compose2Result, DisplayInvoiceData } from '@/types/compose2';

function formatText(text: string): string {
  if (text === text.toUpperCase() && text !== text.toLowerCase()) {
    return text;
  }
  return text.toUpperCase();
}

function cleanText(text?: string): string {
  if (!text) return '';
  return text.replace(/,\s*,+/g, ',').replace(/\s*,\s*/g, ', ').trim();
}

export function mapCompose2ResultToDisplayData(result: Compose2Result): DisplayInvoiceData {
  const formatText = (text: string) => text.trim();
  
  return {
    supplierName: result.supplierName?.content || '',
    
    customer: {
      fullName: [
        result.firstName?.content ? formatText(result.firstName.content) : undefined,
        result.lastName?.content ? formatText(result.lastName.content) : undefined
      ].filter(Boolean).join(' '),
      address: [
        result.street?.content ? formatText(result.street.content) : undefined,
        result.building?.content ? formatText(result.building.content) : undefined,
        result.unit?.content ? formatText(result.unit.content) : undefined,
        result.postalCode?.content,
        result.city?.content ? formatText(result.city.content) : undefined
      ].filter(Boolean).join(', ')
    },
    
    correspondenceAddress: {
      fullName: [
        result.paFirstName?.content ? formatText(result.paFirstName.content) : undefined,
        result.paLastName?.content ? formatText(result.paLastName.content) : undefined
      ].filter(Boolean).join(' '),
      address: [
        result.paStreet?.content ? formatText(result.paStreet.content) : undefined,
        result.paBuilding?.content ? formatText(result.paBuilding.content) : undefined,
        result.paUnit?.content ? formatText(result.paUnit.content) : undefined,
        result.paPostalCode?.content,
        result.paCity?.content ? formatText(result.paCity.content) : undefined
      ].filter(Boolean).join(', ')
    },
    
    deliveryPoint: {
      fullName: [
        result.paFirstName?.content ? formatText(result.paFirstName.content) : undefined,
        result.paLastName?.content ? formatText(result.paLastName.content) : undefined
      ].filter(Boolean).join(' '),
      address: [
        result.Street?.content ? formatText(result.Street.content) : undefined,
        result.Building?.content ? formatText(result.Building.content) : undefined,
        result.Unit?.content ? formatText(result.Unit.content) : undefined,
        result.PostalCode?.content,
        result.City?.content ? formatText(result.City.content) : undefined
      ].filter(Boolean).join(', '),
      ppeNumber: result.ppeNum?.content || ''
    }
  };
}

function formatAddress(
  street?: string,
  building?: string,
  unit?: string,
  postalCode?: string,
  city?: string
): string {
  console.log("Formatting address with:", { street, building, unit, postalCode, city });

  const addressParts = [];
  
  if (street || building) {
    const streetPart = [street, building].filter(Boolean).join(' ');
    if (streetPart) addressParts.push(cleanText(streetPart));
  }
  
  if (unit) {
    addressParts.push(`m. ${cleanText(unit)}`);
  }
  
  if (postalCode || city) {
    const locationPart = [postalCode, city].filter(Boolean).join(' ');
    if (locationPart) addressParts.push(cleanText(locationPart));
  }
  
  return cleanText(addressParts.join(', '));
}

function formatFullName(firstName?: string, lastName?: string): string {
  return [firstName, lastName].filter(Boolean).join(' ');
}

export const displayLabels = {
  supplierName: 'Sprzedawca energii',
  customer: {
    title: 'Nabywca',
    fullName: 'Imię i nazwisko',
    address: 'Adres'
  },
  correspondenceAddress: {
    title: 'Adres korespondencyjny',
    fullName: 'Imię i nazwisko',
    address: 'Adres'
  },
  deliveryPoint: {
    title: 'Punkt dostawy',
    fullName: 'Imię i nazwisko',
    address: 'Adres',
    ppeNumber: 'Numer PPE'
  }
};

export function formatAmount(amount: number): string {
  return `${amount.toFixed(2)} zł`;
} 
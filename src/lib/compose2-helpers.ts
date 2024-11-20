import { Compose2Result, DisplayInvoiceData } from '@/types/compose2';

function formatText(text: string): string {
  if (text === text.toUpperCase() && text !== text.toLowerCase()) {
    return text
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  return text;
}

function cleanText(text?: string): string {
  if (!text) return '';
  return text.replace(/,\s*,+/g, ',').replace(/\s*,\s*/g, ', ').trim();
}

export function mapToDisplayData(result: Compose2Result): DisplayInvoiceData {
  console.log("Nabywca street:", result.street?.content);
  console.log("PA street:", result.paStreet?.content);

  console.log("Correspondence address fields:", {
    street: result.paStreet?.content,
    building: result.paBuilding?.content,
    unit: result.paUnit?.content,
    postalCode: result.paPostalCode?.content,
    city: result.paCity?.content
  });

  const customerName = formatFullName(
    result.firstName?.content ? formatText(result.firstName.content) : undefined,
    result.lastName?.content ? formatText(result.lastName.content) : undefined
  );

  const customerAddress = formatAddress(
    result.street?.content ? formatText(result.street.content) : undefined,
    result.building?.content ? formatText(result.building.content) : undefined,
    result.unit?.content ? formatText(result.unit.content) : undefined,
    result.postalCode?.content,
    result.city?.content ? formatText(result.city.content) : undefined
  );

  const finalCustomerName = customerName || formatFullName(
    result.paFirstName?.content ? formatText(result.paFirstName.content) : undefined,
    result.paLastName?.content ? formatText(result.paLastName.content) : undefined
  );

  const finalCustomerAddress = customerAddress || formatAddress(
    result.paStreet?.content ? formatText(result.paStreet.content) : undefined,
    result.paBuilding?.content ? formatText(result.paBuilding.content) : undefined,
    result.paUnit?.content ? formatText(result.paUnit.content) : undefined,
    result.paPostalCode?.content,
    result.paCity?.content ? formatText(result.paCity.content) : undefined
  );

  const correspondenceAddress = formatAddress(
    result.paStreet?.content ? formatText(result.paStreet.content) : undefined,
    result.paBuilding?.content ? formatText(result.paBuilding.content) : undefined,
    result.paUnit?.content ? formatText(result.paUnit.content) : undefined,
    result.paPostalCode?.content,
    result.paCity?.content ? formatText(result.paCity.content) : undefined
  );

  return {
    supplierName: result.supplierName?.content ? formatText(result.supplierName.content) : '',
    
    customer: {
      fullName: finalCustomerName,
      address: finalCustomerAddress
    },
    
    correspondenceAddress: {
      fullName: formatFullName(
        result.paFirstName?.content ? formatText(result.paFirstName.content) : undefined,
        result.paLastName?.content ? formatText(result.paLastName.content) : undefined
      ),
      address: correspondenceAddress
    },
    
    deliveryPoint: {
      fullName: formatFullName(
        result.dpFirstName?.content ? formatText(result.dpFirstName.content) : undefined,
        result.dpLastName?.content ? formatText(result.dpLastName.content) : undefined
      ),
      address: formatAddress(
        result.dpStreet?.content ? formatText(result.dpStreet.content) : undefined,
        result.dpBuilding?.content ? formatText(result.dpBuilding.content) : undefined,
        result.dpUnit?.content ? formatText(result.dpUnit.content) : undefined,
        result.dpPostalCode?.content,
        result.dpCity?.content ? formatText(result.dpCity.content) : undefined
      ),
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
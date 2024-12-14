# Mapowanie Adresów w Systemie

## Struktura Adresów

System obsługuje cztery główne typy adresów:

1. Adres Nabywcy (Customer)
2. Adres Punktu Poboru Energii (PPE/Delivery)
3. Adres Sprzedawcy (Supplier, prefiks "sp")
4. Adres Korespondencyjny (Postal, prefiks "pa")

## Pola Adresowe

### Podstawowe pola dla każdego typu adresu:
- Ulica (Street)
- Numer budynku (Building)
- Numer lokalu (Unit)
- Kod pocztowy (PostalCode)
- Miejscowość (City)
- Województwo (Province)

### Dodatkowe pola specyficzne:

**Sprzedawca (prefiks "sp"):**
- NIP (spTaxID)
- Rachunek bankowy (spIBAN)
- Telefon (spPhoneNum)
- Strona WWW (spWebUrl)

**Punkt Poboru Energii (prefiks "dp"):**
- Numer licznika (dpMeterID)
- Numer PPE (ppeNum)

## Mapowanie Pól

### Format Legacy -> Modern

1. **Adres Nabywcy**
   - Street -> CustomerStreet
   - Building -> CustomerBuilding
   - Unit -> CustomerUnit
   - PostalCode -> CustomerPostalCode
   - City -> CustomerCity
   - Province -> CustomerProvince
   - FirstName -> (część CustomerName)
   - LastName -> (część CustomerName)
   - BusinessName -> CustomerName
   - taxID -> CustomerTaxId

2. **Adres PPE**
   - dpStreet -> DeliveryStreet
   - dpBuilding -> DeliveryBuilding
   - dpUnit -> DeliveryUnit
   - dpPostalCode -> DeliveryPostalCode
   - dpCity -> DeliveryCity
   - dpProvince -> DeliveryProvince
   - dpMeterID -> MeterNumber
   - ppeNum -> PPENumber

3. **Adres Sprzedawcy**
   - supplierName -> SupplierName
   - spStreet -> SupplierStreet
   - spBuilding -> SupplierBuilding
   - spUnit -> SupplierUnit
   - spPostalCode -> SupplierPostalCode
   - spCity -> SupplierCity
   - spProvince -> SupplierProvince
   - spTaxID -> SupplierTaxId
   - spIBAN -> SupplierBankAccount
   - spPhoneNum -> SupplierPhone
   - spWebUrl -> SupplierWebsite
   - OSD_name -> (alternatywa dla SupplierName)
   - OSD_region -> SupplierRegion

4. **Adres Korespondencyjny**
   - paStreet -> PostalStreet
   - paBuilding -> PostalBuilding
   - paUnit -> PostalUnit
   - paPostalCode -> PostalPostalCode
   - paCity -> PostalCity
   - paProvince -> PostalProvince
   - paFirstName -> (część PostalName)
   - paLastName -> (część PostalName)
   - paBusinessName -> PostalName
   - paTitle -> PostalTitle

## Formatowanie

Wszystkie pola adresowe są przetwarzane przez funkcje formatujące:

- Ulica: formatStreet() - Pierwsza litera każdego słowa wielka
- Numer budynku: bez formatowania
- Numer lokalu: bez formatowania
- Kod pocztowy: formatPostalCode() - Format XX-XXX
- Miejscowość: formatCity() - Pierwsza litera wielka
- Województwo: formatProvince() - Pierwsza litera wielka
- NIP: formatTaxId() - Usuwa białe znaki, format XXXXXXXXXX
- IBAN: formatIBAN() - Usuwa białe znaki, format PLXXXXXXXXXXXXXXXXXXXXXXXXXX
- Telefon: formatPhone() - Format +48XXXXXXXXX
- WWW: formatUrl() - Normalizacja URL

## Walidacja

Każdy typ adresu ma własny zestaw wymaganych pól, zdefiniowany w konfiguracji FIELD_GROUPS:

1. **Adres Nabywcy**
   - Wymagane: FirstName, LastName, Street, Building, PostalCode, City
   - Opcjonalne: Unit, Province, BusinessName, taxID

2. **Adres PPE**
   - Wymagane: ppeNum, dpMeterID
   - Opcjonalne: wszystkie pozostałe pola adresowe

3. **Adres Sprzedawcy**
   - Wymagane: supplierName, spTaxID
   - Opcjonalne: wszystkie pozostałe pola

4. **Adres Korespondencyjny**
   - Wymagane: paFirstName, paLastName, paStreet, paBuilding, paPostalCode, paCity
   - Opcjonalne: paUnit, paProvince, paBusinessName, paTitle

## Pewność Rozpoznania

Każde pole adresowe zawiera informację o pewności rozpoznania (confidence), która jest wykorzystywana do:
- Wizualizacji jakości rozpoznania (kolorowy wskaźnik)
- Filtrowania niepewnych wyników (próg: 0.7)
- Obliczania ogólnej jakości rozpoznania dokumentu
- Automatycznego odrzucania wyników poniżej progu pewności (0.5)

## Specjalne Przypadki

1. **Łączenie Imienia i Nazwiska**
   - W Modern format łączy FirstName i LastName w jedno pole Name
   - Przykład: "Jan" + "Kowalski" -> "Jan Kowalski"

2. **Alternatywne Źródła Danych**
   - SupplierName może pochodzić z supplierName lub OSD_name
   - Adres PPE może być pusty dla niektórych typów dokumentów

3. **Wartości Domyślne**
   - SupplierName: "Nieznany dostawca" jeśli brak danych
   - ConsumptionUnit: zawsze "kWh"
   - InvoiceType: "Faktura" jeśli nie określono

4. **Walidacja specjalnych pól**
   - spTaxID: Sprawdzanie poprawności NIP
   - spIBAN: Sprawdzanie poprawności numeru IBAN
   - spPhoneNum: Normalizacja do formatu międzynarodowego
   - spWebUrl: Walidacja i normalizacja URL
-- Tworzymy tabelę dla dokumentów
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT CHECK (status IN ('processing', 'completed', 'error')),
    confidence DOUBLE PRECISION,
    original_filename TEXT NOT NULL,
    file_url TEXT NOT NULL
);

-- Tworzymy tabelę dla danych PPE
CREATE TABLE ppe_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    ppe_number TEXT,
    meter_number TEXT,
    tariff_group TEXT,
    contract_number TEXT,
    contract_type TEXT,
    street TEXT,
    building TEXT,
    unit TEXT,
    postal_code TEXT,
    city TEXT,
    municipality TEXT,
    district TEXT,
    province TEXT,
    confidence DOUBLE PRECISION,
    UNIQUE(document_id)
);

-- Tworzymy tabelę dla danych korespondencyjnych
CREATE TABLE correspondence_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    business_name TEXT,
    title TEXT,
    street TEXT,
    building TEXT,
    unit TEXT,
    postal_code TEXT,
    city TEXT,
    confidence DOUBLE PRECISION,
    UNIQUE(document_id)
);

-- Tworzymy tabelę dla danych dostawcy
CREATE TABLE supplier_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    supplier_name TEXT,
    tax_id TEXT,
    street TEXT,
    building TEXT,
    unit TEXT,
    postal_code TEXT,
    city TEXT,
    bank_account TEXT,
    bank_name TEXT,
    email TEXT,
    phone TEXT,
    website TEXT,
    osd_name TEXT,
    osd_region TEXT,
    confidence DOUBLE PRECISION,
    UNIQUE(document_id)
);

-- Tworzymy tabelę dla danych rozliczeniowych
CREATE TABLE billing_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    billing_start_date DATE,
    billing_end_date DATE,
    billed_usage DOUBLE PRECISION,
    usage_12m DOUBLE PRECISION,
    confidence DOUBLE PRECISION,
    UNIQUE(document_id)
);

-- Tworzymy tabelę dla danych klienta
CREATE TABLE customer_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    business_name TEXT,
    tax_id TEXT,
    confidence DOUBLE PRECISION,
    UNIQUE(document_id)
);

-- Tworzymy funkcję do automatycznej aktualizacji updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Dodajemy trigger do tabeli documents
CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Dodajemy indeksy dla często używanych kolumn
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_created_at ON documents(created_at);
CREATE INDEX idx_ppe_data_ppe_number ON ppe_data(ppe_number);
CREATE INDEX idx_supplier_data_supplier_name ON supplier_data(supplier_name);
CREATE INDEX idx_customer_data_tax_id ON customer_data(tax_id);

-- Tworzymy polityki RLS dla documents
CREATE POLICY "Dokumenty dostępne tylko dla zalogowanych użytkowników"
ON documents FOR ALL USING (
    auth.role() = 'authenticated'
);

-- Tworzymy polityki RLS dla ppe_data
CREATE POLICY "Dane PPE dostępne tylko dla zalogowanych użytkowników"
ON ppe_data FOR ALL USING (
    auth.role() = 'authenticated'
);

-- Tworzymy polityki RLS dla correspondence_data
CREATE POLICY "Dane korespondencyjne dostępne tylko dla zalogowanych użytkowników"
ON correspondence_data FOR ALL USING (
    auth.role() = 'authenticated'
);

-- Tworzymy polityki RLS dla supplier_data
CREATE POLICY "Dane dostawcy dostępne tylko dla zalogowanych użytkowników"
ON supplier_data FOR ALL USING (
    auth.role() = 'authenticated'
);

-- Tworzymy polityki RLS dla billing_data
CREATE POLICY "Dane rozliczeniowe dostępne tylko dla zalogowanych użytkowników"
ON billing_data FOR ALL USING (
    auth.role() = 'authenticated'
);

-- Tworzymy polityki RLS dla customer_data
CREATE POLICY "Dane klienta dostępne tylko dla zalogowanych użytkowników"
ON customer_data FOR ALL USING (
    auth.role() = 'authenticated'
);

-- Dodaj nowe kolumny do tabeli documents
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS confidence DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS original_filename TEXT,
ADD COLUMN IF NOT EXISTS file_url TEXT; 
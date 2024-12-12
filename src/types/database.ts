export type Database = {
  public: {
    Tables: {
      documents: {
        Row: {
          id: string;
          created_at?: string | null;
          updated_at?: string | null;
          status: string;
          confidence?: number | null;
          original_filename?: string | null;
          file_url?: string | null;
          file_name?: string | null;
          file_type?: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string | null;
          updated_at?: string | null;
          status: string;
          confidence?: number | null;
          original_filename?: string | null;
          file_url?: string | null;
          file_name?: string | null;
          file_type?: string | null;
        };
      };
      ppe_data: {
        Row: {
          id: string;
          document_id: string;
          ppe_number: string | null;
          meter_number: string | null;
          tariff_group: string | null;
          contract_number: string | null;
          contract_type: string | null;
          street: string | null;
          building: string | null;
          unit: string | null;
          city: string | null;
          confidence: number | null;
          osd_name: string | null;
          osd_region: string | null;
        };
        Insert: {
          id?: string;
          document_id: string;
          ppe_number?: string | null;
          meter_number?: string | null;
          tariff_group?: string | null;
          contract_number?: string | null;
          contract_type?: string | null;
          street?: string | null;
          building?: string | null;
          unit?: string | null;
          city?: string | null;
          confidence?: number | null;
          osd_name?: string | null;
          osd_region?: string | null;
        };
        Update: {
          id?: string;
          document_id: string;
          ppe_number?: string | null;
          meter_number?: string | null;
          tariff_group?: string | null;
          contract_number?: string | null;
          contract_type?: string | null;
          street?: string | null;
          building?: string | null;
          unit?: string | null;
          city?: string | null;
          confidence?: number | null;
          osd_name?: string | null;
          osd_region?: string | null;
        };
      };
      correspondence_data: {
        Row: {
          id: string;
          document_id: string;
          first_name?: string | null;
          last_name?: string | null;
          business_name?: string | null;
          title?: string | null;
          street?: string | null;
          building?: string | null;
          unit?: string | null;
          postal_code?: string | null;
          city?: string | null;
          confidence?: number | null;
        };
        Insert: {
          id?: string;
          document_id: string;
          first_name?: string | null;
          last_name?: string | null;
          business_name?: string | null;
          title?: string | null;
          street?: string | null;
          building?: string | null;
          unit?: string | null;
          postal_code?: string | null;
          city?: string | null;
          confidence?: number | null;
        };
      };
      supplier_data: {
        Row: {
          id: string;
          document_id: string;
          supplier_name?: string | null;
          supplier_tax_id?: string | null;
          supplier_street?: string | null;
          supplier_building?: string | null;
          supplier_unit?: string | null;
          supplier_postal_code?: string | null;
          supplier_city?: string | null;
          supplier_bank_account?: string | null;
          supplier_bank_name?: string | null;
          supplier_email?: string | null;
          supplier_phone?: string | null;
          supplier_website?: string | null;
          osd_name?: string | null;
          osd_region?: string | null;
          confidence?: number | null;
        };
        Insert: {
          id?: string;
          document_id: string;
          supplier_name?: string | null;
          supplier_tax_id?: string | null;
          supplier_street?: string | null;
          supplier_building?: string | null;
          supplier_unit?: string | null;
          supplier_postal_code?: string | null;
          supplier_city?: string | null;
          supplier_bank_account?: string | null;
          supplier_bank_name?: string | null;
          supplier_email?: string | null;
          supplier_phone?: string | null;
          supplier_website?: string | null;
          osd_name?: string | null;
          osd_region?: string | null;
          confidence?: number | null;
        };
      };
      billing_data: {
        Row: {
          id: string;
          document_id: string;
          billing_start_date?: string | null;
          billing_end_date?: string | null;
          billed_usage?: number | null;
          usage_12m?: number | null;
          confidence?: number | null;
        };
        Insert: {
          id?: string;
          document_id: string;
          billing_start_date?: string | null;
          billing_end_date?: string | null;
          billed_usage?: number | null;
          usage_12m?: number | null;
          confidence?: number | null;
        };
      };
      customer_data: {
        Row: {
          id: string;
          document_id: string;
          first_name?: string | null;
          last_name?: string | null;
          business_name?: string | null;
          tax_id?: string | null;
          confidence?: number | null;
        };
        Insert: {
          id?: string;
          document_id: string;
          first_name?: string | null;
          last_name?: string | null;
          business_name?: string | null;
          tax_id?: string | null;
          confidence?: number | null;
        };
      };
    };
  };
};

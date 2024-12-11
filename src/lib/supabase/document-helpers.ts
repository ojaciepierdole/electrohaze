import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';
export type Tables = Database['public']['Tables'];
export type Document = Tables['documents']['Row'];
export type PPEData = Tables['ppe_data']['Row'];
export type CorrespondenceData = Tables['correspondence_data']['Row'];
export type SupplierData = Tables['supplier_data']['Row'];
export type BillingData = Tables['billing_data']['Row'];
export type CustomerData = Tables['customer_data']['Row'];

export interface DocumentInsertData {
  document: Tables['documents']['Insert'];
  ppeData?: Omit<Tables['ppe_data']['Insert'], 'document_id'>;
  correspondenceData?: Omit<Tables['correspondence_data']['Insert'], 'document_id'>;
  supplierData?: Omit<Tables['supplier_data']['Insert'], 'document_id'>;
  billingData?: Omit<Tables['billing_data']['Insert'], 'document_id'>;
  customerData?: Omit<Tables['customer_data']['Insert'], 'document_id'>;
}

interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
}

async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxAttempts = 3, delayMs = 1000 } = options;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.error(`Próba ${attempt}/${maxAttempts} nie powiodła się:`, error);
      
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      }
    }
  }

  throw lastError;
}

export async function insertDocumentWithData(data: DocumentInsertData) {
  const supabase = createClientComponentClient<Database>();

  return withRetry(async () => {
    console.log('Rozpoczynam zapis dokumentu:', {
      fileName: data.document.original_filename,
      status: data.document.status,
    });

    // Rozpocznij transakcję
    const { data: document, error: documentError } = await supabase
      .from('documents')
      .insert(data.document)
      .select()
      .single();

    if (documentError || !document) {
      console.error('Błąd podczas zapisu dokumentu:', documentError);
      throw new Error(`Błąd podczas zapisywania dokumentu: ${documentError?.message}`);
    }

    console.log('Dokument zapisany pomyślnie:', document.id);

    // Zapisz powiązane dane, dodając document_id
    const promises = [];
    const relationData: Record<string, any> = {};

    if (data.ppeData) {
      relationData.ppeData = { ...data.ppeData, document_id: document.id };
      promises.push(
        supabase
          .from('ppe_data')
          .insert(relationData.ppeData)
          .then(res => {
            if (res.error) throw new Error(`Błąd zapisu PPE: ${res.error.message}`);
            console.log('Dane PPE zapisane');
          })
      );
    }

    if (data.correspondenceData) {
      relationData.correspondenceData = { ...data.correspondenceData, document_id: document.id };
      promises.push(
        supabase
          .from('correspondence_data')
          .insert(relationData.correspondenceData)
          .then(res => {
            if (res.error) throw new Error(`Błąd zapisu korespondencji: ${res.error.message}`);
            console.log('Dane korespondencji zapisane');
          })
      );
    }

    if (data.supplierData) {
      relationData.supplierData = { ...data.supplierData, document_id: document.id };
      promises.push(
        supabase
          .from('supplier_data')
          .insert(relationData.supplierData)
          .then(res => {
            if (res.error) throw new Error(`Błąd zapisu dostawcy: ${res.error.message}`);
            console.log('Dane dostawcy zapisane');
          })
      );
    }

    if (data.billingData) {
      relationData.billingData = { ...data.billingData, document_id: document.id };
      promises.push(
        supabase
          .from('billing_data')
          .insert(relationData.billingData)
          .then(res => {
            if (res.error) throw new Error(`Błąd zapisu faktury: ${res.error.message}`);
            console.log('Dane faktury zapisane');
          })
      );
    }

    if (data.customerData) {
      relationData.customerData = { ...data.customerData, document_id: document.id };
      promises.push(
        supabase
          .from('customer_data')
          .insert(relationData.customerData)
          .then(res => {
            if (res.error) throw new Error(`Błąd zapisu klienta: ${res.error.message}`);
            console.log('Dane klienta zapisane');
          })
      );
    }

    try {
      await Promise.all(promises);
      console.log('Wszystkie powiązane dane zapisane pomyślnie');
      return document;
    } catch (error) {
      console.error('Błąd podczas zapisu powiązanych danych:', error);
      
      // Spróbuj usunąć główny dokument
      const { error: deleteError } = await supabase
        .from('documents')
        .delete()
        .match({ id: document.id });

      if (deleteError) {
        console.error('Nie udało się usunąć dokumentu po błędzie:', deleteError);
      }

      throw error;
    }
  }, { maxAttempts: 3, delayMs: 1000 });
}

export async function getDocumentWithData(documentId: string) {
  const supabase = createClientComponentClient<Database>();

  const { data: document, error: documentError } = await supabase
    .from('documents')
    .select(`
      *,
      ppe_data(*),
      correspondence_data(*),
      supplier_data(*),
      billing_data(*),
      customer_data(*)
    `)
    .eq('id', documentId)
    .single();

  if (documentError) {
    throw new Error(`Błąd podczas pobierania dokumentu: ${documentError.message}`);
  }

  return document;
} 
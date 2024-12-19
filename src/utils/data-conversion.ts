import type { DocumentAnalysisResult, DocumentField, FieldWithConfidence } from '@/types/processing';
import type { DocumentSections } from '@/utils/data-processing/completeness/confidence';

export function convertToDocumentSections(result: DocumentAnalysisResult): DocumentSections {
  const sections: DocumentSections = {};

  // Konwertuj każdą sekcję
  if (result.ppe) {
    sections.ppe = Object.entries(result.ppe).reduce<Record<string, DocumentField>>((acc, [key, field]) => {
      if (field) {
        acc[key] = {
          content: field.content,
          confidence: field.confidence,
          metadata: field.metadata
        };
      }
      return acc;
    }, {});
  }

  if (result.customer) {
    sections.customer = Object.entries(result.customer).reduce<Record<string, DocumentField>>((acc, [key, field]) => {
      if (field) {
        acc[key] = {
          content: field.content,
          confidence: field.confidence,
          metadata: field.metadata
        };
      }
      return acc;
    }, {});
  }

  if (result.correspondence) {
    sections.correspondence = Object.entries(result.correspondence).reduce<Record<string, DocumentField>>((acc, [key, field]) => {
      if (field) {
        acc[key] = {
          content: field.content,
          confidence: field.confidence,
          metadata: field.metadata
        };
      }
      return acc;
    }, {});
  }

  if (result.supplier) {
    sections.supplier = Object.entries(result.supplier).reduce<Record<string, DocumentField>>((acc, [key, field]) => {
      if (field) {
        acc[key] = {
          content: field.content,
          confidence: field.confidence,
          metadata: field.metadata
        };
      }
      return acc;
    }, {});
  }

  if (result.billing) {
    sections.billing = Object.entries(result.billing).reduce<Record<string, DocumentField>>((acc, [key, field]) => {
      if (field) {
        acc[key] = {
          content: field.content,
          confidence: field.confidence,
          metadata: field.metadata
        };
      }
      return acc;
    }, {});
  }

  return sections;
} 
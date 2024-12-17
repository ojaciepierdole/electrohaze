import type { DocumentData, TransformationRule, TransformationContext, DocumentField } from '@/types/processing';

/**
 * Klasa odpowiedzialna za transformacje dokumentów
 */
export class DocumentTransformer {
  private rules: TransformationRule[] = [];

  /**
   * Dodaje reguły transformacji
   */
  addRules(rules: TransformationRule[]): void {
    this.rules.push(...rules);
    // Sortuj reguły według priorytetu (wyższy priorytet = wcześniejsze wykonanie)
    this.rules.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Transformuje pojedyncze pole dokumentu
   */
  private transformField(value: string, context: TransformationContext): string {
    console.group(`Transformacja pola: ${context.field?.content || 'unknown'}`);
    console.log('Wartość wejściowa:', value);
    console.log('Kontekst:', context);

    try {
      // Znajdź pierwszą pasującą regułę
      for (const rule of this.rules) {
        console.log(`Sprawdzanie reguły: ${rule.name}`);

        // Jeśli reguła ma warunek i nie jest spełniony, pomiń ją
        if (rule.condition && !rule.condition(value, context)) {
          console.log('Warunek nie spełniony, pomijam regułę');
          continue;
        }

        console.log('Znaleziono pasującą regułę');

        // Zastosuj transformację
        const result = rule.transform(value, context);
        console.log('Wynik transformacji:', result);

        // Jeśli transformacja zwróciła dodatkowe pola, dodaj je do dokumentu
        if (result.additionalFields && context.document?.fields) {
          Object.entries(result.additionalFields).forEach(([fieldName, fieldData]) => {
            if (!context.document?.fields) return;

            const fieldType = fieldData.metadata?.fieldType;
            if (typeof fieldType !== 'string') return;

            const documentField: DocumentField = {
              content: fieldData.value,
              confidence: fieldData.confidence,
              metadata: {
                fieldType: fieldType,
                transformationType: 'additional',
                originalValue: value,
                ...(fieldData.metadata || {})
              }
            };
            context.document.fields[fieldName] = documentField;
          });
        }

        return result.value;
      }

      console.log('Nie znaleziono pasującej reguły');
      return value;
    } catch (error) {
      console.error('Błąd podczas transformacji:', error);
      return value;
    } finally {
      console.groupEnd();
    }
  }

  /**
   * Transformuje sekcję dokumentu
   */
  private transformSection(section: string, data: DocumentData[string]): DocumentData[string] {
    console.group(`Transformacja sekcji: ${section}`);
    console.log('Dane wejściowe:', data);

    try {
      const result = { ...data };

      // Transformuj każde pole w sekcji
      Object.entries(data).forEach(([fieldName, fieldData]) => {
        const context: TransformationContext = {
          value: fieldData.content,
          confidence: fieldData.confidence,
          section,
          field: {
            content: fieldData.content,
            confidence: fieldData.confidence,
            metadata: fieldData.metadata
          },
          document: {
            fields: result
          },
          metadata: fieldData.metadata
        };

        // Transformuj wartość pola
        const transformedValue = this.transformField(fieldData.content, context);

        // Zaktualizuj pole tylko jeśli wartość się zmieniła
        if (transformedValue !== fieldData.content) {
          result[fieldName] = {
            content: transformedValue,
            confidence: fieldData.confidence,
            metadata: {
              ...fieldData.metadata,
              transformationType: 'transformed',
              originalValue: fieldData.content
            }
          };
        }
      });

      console.log('Wynik transformacji sekcji:', result);
      return result;
    } catch (error) {
      console.error('Błąd podczas transformacji sekcji:', error);
      return data;
    } finally {
      console.groupEnd();
    }
  }

  /**
   * Transformuje cały dokument
   */
  transformDocument(document: DocumentData): DocumentData {
    console.group('Transformacja dokumentu');
    console.log('Dane wejściowe:', document);

    try {
      const result = { ...document };

      // Transformuj każdą sekcję dokumentu
      Object.entries(document).forEach(([section, data]) => {
        result[section] = this.transformSection(section, data);
      });

      console.log('Wynik transformacji dokumentu:', result);
      return result;
    } catch (error) {
      console.error('Błąd podczas transformacji dokumentu:', error);
      return document;
    } finally {
      console.groupEnd();
    }
  }
} 
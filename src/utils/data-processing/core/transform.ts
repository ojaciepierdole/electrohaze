import type { 
  TransformationRule, 
  TransformationContext, 
  TransformationResult,
  DocumentData
} from '@/types/document-processing';

/**
 * Klasa odpowiedzialna za transformację dokumentów
 */
export class DocumentTransformer {
  private rules: TransformationRule[] = [];

  /**
   * Dodaje nową regułę transformacji
   */
  addRule(rule: TransformationRule) {
    this.rules.push(rule);
    // Sortuj reguły według priorytetu (wyższy priorytet = wcześniejsze wykonanie)
    this.rules.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Dodaje zestaw reguł transformacji
   */
  addRules(rules: TransformationRule[]) {
    rules.forEach(rule => this.addRule(rule));
  }

  /**
   * Wykonuje transformację pojedynczej wartości
   */
  transform(value: string, context: TransformationContext): TransformationResult {
    console.group(`Transformacja wartości: "${value}"`);
    console.log('Kontekst:', {
      section: context.section,
      field: context.field,
      metadata: context.metadata
    });

    try {
      // Znajdź pierwszą pasującą regułę
      const matchingRule = this.rules.find(rule => {
        const matches = rule.condition(value, context);
        console.log(`Sprawdzanie reguły "${rule.name}":`, matches);
        return matches;
      });

      if (!matchingRule) {
        console.log('Nie znaleziono pasującej reguły');
        console.groupEnd();
        return { value };
      }

      // Zastosuj transformację
      console.log(`Stosowanie reguły "${matchingRule.name}"`);
      const result = matchingRule.transform(value, context);
      console.log('Wynik transformacji:', result);
      
      return {
        ...result,
        metadata: {
          ...result.metadata,
          appliedRule: matchingRule.name
        }
      };
    } catch (error) {
      console.error('Błąd podczas transformacji:', error);
      console.groupEnd();
      return { value };
    } finally {
      console.groupEnd();
    }
  }

  /**
   * Wykonuje transformację całego dokumentu
   */
  transformDocument(document: DocumentData): DocumentData {
    console.group('Transformacja dokumentu');
    const result = { ...document };

    try {
      // Przetwórz każdą sekcję
      for (const [section, fields] of Object.entries(document)) {
        console.group(`Przetwarzanie sekcji: ${section}`);

        // Przetwórz każde pole w sekcji
        for (const [field, data] of Object.entries(fields)) {
          console.group(`Przetwarzanie pola: ${field}`);

          if (!data.content) {
            console.log('Puste pole - pomijam');
            console.groupEnd();
            continue;
          }

          const context: TransformationContext = {
            section: section as any,
            field,
            document: result
          };

          // Zastosuj transformacje
          const transformed = this.transform(data.content, context);

          // Zaktualizuj główne pole
          result[section][field] = {
            ...data,
            content: transformed.value,
            metadata: {
              ...data.metadata,
              ...transformed.metadata
            }
          };

          // Dodaj dodatkowe pola
          if (transformed.additionalFields) {
            for (const [additionalField, additionalData] of Object.entries(transformed.additionalFields)) {
              result[section][additionalField] = {
                content: additionalData.value,
                confidence: additionalData.confidence,
                metadata: {
                  ...additionalData.metadata,
                  generatedFrom: `${section}.${field}`,
                  transformationType: transformed.metadata?.transformationType
                }
              };
            }
          }

          console.groupEnd(); // pole
        }
        console.groupEnd(); // sekcja
      }
    } catch (error) {
      console.error('Błąd podczas transformacji dokumentu:', error);
    } finally {
      console.groupEnd(); // dokument
    }

    return result;
  }
} 
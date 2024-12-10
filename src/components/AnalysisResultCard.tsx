'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FIELD_GROUPS } from '@/config/fields';
import type { ProcessingResult, FieldGroupKey, GroupedResult } from '@/types/processing';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { truncateFileName } from '@/utils/processing';
import { getVendorLogo } from '@/lib/vendors';
import { FIELD_LABELS } from '@/config/fields';
import { Button } from '@/components/ui/button';
import { formatText } from '@/utils/text';

interface AnalysisResultCardProps {
  result: GroupedResult;
  modelResults: ProcessingResult['results'][0][];
}

function formatFieldValue(value: string | null, type: string, fieldName: string): string {
  if (!value) return 'b/d';
  
  // Usuń znaki specjalne z końca
  value = value.replace(/[:.,]$/, '');
  
  // Formatuj daty
  if (type === 'date' || fieldName.toLowerCase().includes('date') || fieldName.toLowerCase().includes('okres')) {
    try {
      // Usuń część czasową jeśli istnieje
      const dateStr = value.split('T')[0];
      const date = new Date(dateStr);
      
      // Jeśli to okres (od/do), użyj krótszego formatu
      if (fieldName.toLowerCase().includes('okres')) {
        return format(date, 'yyyy-MM-dd', { locale: pl });
      }
      
      // Dla innych dat użyj pełnego formatu
      return format(date, 'd MMMM yyyy', { locale: pl });
    } catch {
      return value;
    }
  }

  // Formatuj liczby
  if (type === 'number' || !isNaN(Number(value))) {
    const num = Number(value);
    if (fieldName.toLowerCase().includes('usage')) {
      return `${num.toLocaleString('pl')} kWh`;
    }
    return num.toLocaleString('pl');
  }

  return value;
}

function getConfidenceBadgeVariant(confidence: number): "default" | "outline" | "secondary" | "destructive" {
  if (confidence >= 0.95) return "outline";
  if (confidence >= 0.85) return "secondary";
  if (confidence >= 0.75) return "default";
  return "destructive";
}

function getFieldLabel(fieldName: string): string {
  return FIELD_LABELS[fieldName] || fieldName;
}

interface ModelConfidence {
  modelId: string;
  confidence: number;
  fieldsCount: number;
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.95) return 'text-green-600 bg-green-50';
  if (confidence >= 0.85) return 'text-blue-600 bg-blue-50';
  if (confidence >= 0.75) return 'text-yellow-600 bg-yellow-50';
  return 'text-red-600 bg-red-50';
}

function GroupedFields({ 
  fields, 
  modelResults, 
  isRequired 
}: { 
  fields: [string, any][],
  modelResults: ProcessingResult['results'][0][],
  isRequired: (fieldName: string) => boolean
}) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const foundFields = fields.filter(([_, field]) => Boolean(field.content));
  const notFoundFields = fields.filter(([_, field]) => !field.content);

  return (
    <div className="space-y-1">
      {/* Znalezione pola */}
      {foundFields.map(([fieldName, field]) => (
        <FieldRow 
          key={fieldName}
          fieldName={fieldName}
          field={field}
          modelResults={modelResults}
          isRequired={isRequired(fieldName)}
        />
      ))}

      {/* Nieznalezione pola */}
      {notFoundFields.length > 0 && (
        <div className="mt-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronDown 
              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            />
            <span>Nieznalezione pola ({notFoundFields.length})</span>
          </button>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pt-2 space-y-1">
                  {notFoundFields.map(([fieldName, field]) => (
                    <FieldRow 
                      key={fieldName}
                      fieldName={fieldName}
                      field={field}
                      modelResults={modelResults}
                      isRequired={isRequired(fieldName)}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function FieldRow({ 
  fieldName, 
  field, 
  modelResults, 
  isRequired 
}: { 
  fieldName: string;
  field: any;
  modelResults: ProcessingResult['results'][0][];
  isRequired: boolean;
}) {
  const hasValue = Boolean(field.content);
  const formattedValue = formatFieldValue(
    field.content ? formatText(field.content) : field.content,
    field.type,
    fieldName
  );

  return (
    <div className={`flex items-center justify-between py-1.5 px-2 rounded ${
      hasValue ? 'hover:bg-muted/50' : 'opacity-75'
    } ${hasValue ? 'bg-muted/5' : ''}`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {getFieldLabel(fieldName)}:
        </span>
        <span className={`text-sm font-medium truncate ${
          hasValue ? 'text-foreground' : 'text-muted-foreground italic'
        }`}>
          {formattedValue}
        </span>
        {isRequired && (
          <Badge 
            variant="outline"
            className="text-xs px-1.5 py-0"
          >
            Wymagane
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {modelResults.map(model => {
          const confidence = field.confidences[model.modelId] || 0;
          return (
            <span 
              key={model.modelId}
              className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                getConfidenceColor(confidence)
              }`}
            >
              {(confidence * 100).toFixed(1)}%
            </span>
          );
        })}
      </div>
    </div>
  );
}

export function AnalysisResultCard({ result, modelResults }: AnalysisResultCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [logoError, setLogoError] = React.useState(false);
  const [logoLoaded, setLogoLoaded] = React.useState(false);
  const fields = modelResults[0].fields;

  // Grupuj wyniki z różnych modeli
  const combinedFields = React.useMemo(() => {
    const combined = {} as Record<FieldGroupKey, Record<string, {
      content: string | null;
      confidences: Record<string, number>;
      type: string;
      definition: any;
    }>>;

    // Inicjalizuj strukturę grup
    Object.keys(FIELD_GROUPS).forEach(groupKey => {
      combined[groupKey as FieldGroupKey] = {};
    });

    // Połącz wyniki z wszystkich modeli
    modelResults.forEach(modelResult => {
      Object.entries(modelResult.fields).forEach(([fieldName, field]) => {
        const group = field.definition.group;
        if (!combined[group][fieldName]) {
          combined[group][fieldName] = {
            content: field.content,
            confidences: {},
            type: field.type,
            definition: field.definition
          };
        }
        combined[group][fieldName].confidences[modelResult.modelId] = field.confidence;
      });
    });

    return combined;
  }, [modelResults]);

  // Znajdź nazwę sprzedawcy
  const vendorName = React.useMemo(() => {
    const supplierField = Object.values(fields).find(field => 
      field.definition.name.toLowerCase().includes('supplier') ||
      field.definition.name.toLowerCase().includes('sprzedawca') ||
      field.definition.name.toLowerCase().includes('vendor') ||
      field.definition.name === 'businessname'
    );
    return supplierField?.content || null;
  }, [fields]);

  const logoUrl = React.useMemo(() => {
    if (!vendorName) return '';
    return getVendorLogo(vendorName);
  }, [vendorName]);

  // Oblicz średnią pewność dla każdego modelu
  const modelConfidences = React.useMemo(() => {
    return modelResults.map(modelResult => ({
      modelId: modelResult.modelId,
      confidence: modelResult.confidence,
      fieldsCount: Object.keys(modelResult.fields).length
    }));
  }, [modelResults]);

  // Sprawdź czy wszystkie wymagane pola są wypełnione
  const hasAllRequiredFields = React.useMemo(() => {
    return Object.entries(FIELD_GROUPS).every(([groupKey, group]) => {
      return group.requiredFields.every(fieldName => {
        const field = fields[fieldName];
        return field && field.content;
      });
    });
  }, [fields]);

  // Sprawdź czy wszystkie pola mają wysoką pewność
  const hasHighConfidence = React.useMemo(() => {
    return Object.values(fields).every(field => field.confidence > 0.9);
  }, [fields]);

  return (
    <Card className="overflow-hidden">
      <button 
        onClick={() => setIsExpanded(prev => !prev)}
        className="w-full text-left"
      >
        <div className="p-6 border-b bg-muted/40 hover:bg-muted/60 transition-colors">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              {vendorName && !logoError && logoUrl && (
                <div className="flex-shrink-0 w-8 h-8">
                  <img 
                    src={logoUrl}
                    alt={`Logo ${vendorName}`}
                    className={`w-full h-full object-contain transition-opacity duration-200 ${
                      logoLoaded ? 'opacity-100' : 'opacity-0'
                    }`}
                    onError={(e) => {
                      console.error('Logo loading error:', e);
                      setLogoError(true);
                    }}
                    onLoad={() => {
                      console.log('Logo loaded successfully');
                      setLogoLoaded(true);
                    }}
                  />
                </div>
              )}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">
                  {truncateFileName(result.fileName)}
                </h3>
                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <span>Przeanalizowano przez {modelResults.length} {modelResults.length === 1 ? 'model' : 'modele'}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {modelConfidences.map(({ modelId, confidence }) => (
                      <Badge 
                        key={modelId}
                        variant={getConfidenceBadgeVariant(confidence)}
                        className="text-xs"
                      >
                        {modelId}: {(confidence * 100).toFixed(1)}%
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-2">
                <Badge variant={hasAllRequiredFields ? "outline" : "secondary"}>
                  Wymagane pola
                </Badge>
                <Badge variant={hasHighConfidence ? "outline" : "secondary"}>
                  Wysoka pewność
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsExpanded(prev => !prev)}
              >
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="divide-y divide-muted">
              {Object.entries(FIELD_GROUPS).map(([groupKey, group]) => {
                const groupFields = combinedFields[groupKey as FieldGroupKey];
                if (!Object.keys(groupFields).length) return null;

                const sectionConfidence = Object.values(groupFields).reduce((acc, field) => {
                  const avgFieldConfidence = Object.values(field.confidences)
                    .reduce((sum, conf) => sum + conf, 0) / modelResults.length;
                  return acc + avgFieldConfidence;
                }, 0) / Object.keys(groupFields).length;

                return (
                  <div key={groupKey} className="p-4">
                    <div className="flex items-center justify-between mb-3 pb-2 border-b">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-muted">
                          <group.icon className="w-4 h-4 text-foreground" />
                        </div>
                        <h4 className="text-lg font-semibold">{group.name}</h4>
                      </div>
                      <Badge 
                        variant="outline"
                        className={`px-3 py-1 ${getConfidenceColor(sectionConfidence)}`}
                      >
                        {(sectionConfidence * 100).toFixed(1)}%
                      </Badge>
                    </div>

                    <GroupedFields 
                      fields={Object.entries(groupFields)}
                      modelResults={modelResults}
                      isRequired={(fieldName) => group.requiredFields.includes(fieldName)}
                    />
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
} 
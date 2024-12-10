'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FIELD_GROUPS } from '@/config/fields';
import type { ProcessingResult, FieldGroupKey } from '@/types/processing';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { truncateFileName } from '@/utils/processing';
import { getVendorLogo } from '@/lib/vendors';
import { FIELD_LABELS } from '@/config/fields';
import { Button } from '@/components/ui/button';

interface AnalysisResultCardProps {
  result: ProcessingResult;
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

export function AnalysisResultCard({ result }: AnalysisResultCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [logoError, setLogoError] = React.useState(false);
  const [logoLoaded, setLogoLoaded] = React.useState(false);
  const modelResults = result.results;
  const fields = modelResults[0].fields;

  // Znajdź nazwę sprzedawcy
  const vendorName = React.useMemo(() => {
    const supplierField = Object.values(fields).find(field => 
      field.definition.name.toLowerCase().includes('supplier') ||
      field.definition.name.toLowerCase().includes('sprzedawca') ||
      field.definition.name.toLowerCase().includes('vendor') ||
      field.definition.name === 'businessname'
    );
    console.log('Found supplier field:', supplierField);
    return supplierField?.content || null;
  }, [fields]);

  const logoUrl = React.useMemo(() => {
    if (!vendorName) return '';
    const url = getVendorLogo(vendorName);
    console.log('Generated logo URL:', url);
    return url;
  }, [vendorName]);

  // Oblicz średnią pewność dla każdego modelu
  const modelConfidences = React.useMemo(() => {
    return modelResults.map(modelResult => ({
      modelId: modelResult.modelId,
      confidence: modelResult.confidence,
      fieldsCount: Object.keys(modelResult.fields).length
    }));
  }, [modelResults]);

  // Grupuj i sortuj pola
  const groupedFields = React.useMemo(() => {
    const groups = {} as Record<FieldGroupKey, typeof fields>;
    
    Object.entries(fields).forEach(([key, field]) => {
      const group = field.definition.group;
      if (!groups[group]) {
        groups[group] = {};
      }
      groups[group][key] = field;
    });

    // Sortuj pola w każdej grupie - najpierw znalezione, potem nie znalezione
    Object.keys(groups).forEach(groupKey => {
      const sortedFields = Object.entries(groups[groupKey as FieldGroupKey])
        .sort(([, a], [, b]) => {
          if (!!a.content === !!b.content) return 0;
          return a.content ? -1 : 1;
        })
        .reduce((acc, [key, value]) => ({
          ...acc,
          [key]: value
        }), {});
      
      groups[groupKey as FieldGroupKey] = sortedFields;
    });

    return groups;
  }, [fields]);

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
      <div className="p-6 border-b bg-muted/40">
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
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="divide-y">
              {Object.entries(FIELD_GROUPS).map(([groupKey, group]) => {
                const groupFields = groupedFields[groupKey as FieldGroupKey];
                if (!groupFields || Object.keys(groupFields).length === 0) return null;

                return (
                  <div key={groupKey} className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <group.icon className="w-5 h-5 text-muted-foreground" />
                      <h4 className="font-medium text-lg">{group.name}</h4>
                    </div>
                    <div className="grid gap-2">
                      {Object.entries(groupFields).map(([fieldName, field], index) => {
                        const isRequired = group.requiredFields.includes(fieldName);
                        const hasValue = Boolean(field.content);
                        const formattedValue = formatFieldValue(
                          field.content, 
                          field.type,
                          fieldName
                        );

                        return (
                          <div 
                            key={fieldName} 
                            className={`flex justify-between items-start p-3 rounded-md ${
                              hasValue ? 'hover:bg-muted/50' : 'opacity-75'
                            } ${index % 2 === 0 ? 'bg-muted/10' : ''}`}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {getFieldLabel(fieldName)}
                                </span>
                                {isRequired && (
                                  <Badge 
                                    variant={hasValue ? "outline" : "secondary"} 
                                    className="text-xs"
                                  >
                                    Wymagane
                                  </Badge>
                                )}
                              </div>
                              <div className={
                                hasValue 
                                  ? 'text-foreground mt-1' 
                                  : 'text-muted-foreground mt-1'
                              }>
                                {formattedValue}
                              </div>
                            </div>
                            <Badge 
                              variant={getConfidenceBadgeVariant(field.confidence)}
                              className="ml-2 self-start"
                            >
                              {(field.confidence * 100).toFixed(1)}%
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
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
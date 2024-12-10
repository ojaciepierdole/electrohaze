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

interface AnalysisResultCardProps {
  result: ProcessingResult;
}

function formatFieldValue(value: string | null, type: string): string {
  if (!value) return 'b/d';
  
  // Usuń znaki specjalne
  value = value.replace(/[:.,]$/, '');
  
  // Formatuj daty
  if (type === 'date' && value.includes('T')) {
    try {
      return format(new Date(value), 'd MMMM yyyy', { locale: pl });
    } catch {
      return value;
    }
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
      <button 
        onClick={() => setIsExpanded(prev => !prev)}
        className="w-full p-6 flex justify-between items-start hover:bg-muted/50 transition-colors"
      >
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
          <div>
            <h3 className="text-lg font-semibold text-left">
              {truncateFileName(result.fileName)}
            </h3>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Przeanalizowano przez {modelResults.length} model</p>
              <div className="flex flex-wrap gap-2">
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
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
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
            <div className="px-6 pb-6 space-y-6">
              {Object.entries(FIELD_GROUPS).map(([groupKey, group]) => {
                const groupFields = groupedFields[groupKey as FieldGroupKey];
                if (!groupFields || Object.keys(groupFields).length === 0) return null;

                return (
                  <div key={groupKey} className="space-y-2">
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <group.icon className="w-4 h-4" />
                      <h4 className="font-medium">{group.name}</h4>
                    </div>
                    <div className="grid gap-1">
                      {Object.entries(groupFields).map(([fieldName, field], index) => {
                        const isRequired = group.requiredFields.includes(fieldName);
                        const hasValue = Boolean(field.content);
                        const formattedValue = formatFieldValue(field.content, field.type);

                        return (
                          <div 
                            key={fieldName} 
                            className={`flex justify-between items-start p-2 rounded-md ${
                              hasValue ? 'hover:bg-muted/50' : 'opacity-75'
                            } ${index % 2 === 0 ? 'bg-muted/25' : ''}`}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{getFieldLabel(fieldName)}</span>
                                {isRequired && (
                                  <Badge variant={hasValue ? "outline" : "secondary"} className="text-xs">
                                    Wymagane
                                  </Badge>
                                )}
                              </div>
                              <div className={hasValue ? 'text-foreground' : 'text-muted-foreground'}>
                                {formattedValue}
                              </div>
                            </div>
                            <Badge 
                              variant={getConfidenceBadgeVariant(field.confidence)}
                              className="ml-2"
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
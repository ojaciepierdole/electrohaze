'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FIELD_GROUPS } from '@/config/fields';
import type { ProcessingResult, FieldGroupKey } from '@/types/processing';

interface AnalysisResultCardProps {
  result: ProcessingResult;
}

export function AnalysisResultCard({ result }: AnalysisResultCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const modelResult = result.results[0];
  const fields = modelResult.fields;

  // Grupuj pola według kategorii
  const groupedFields = React.useMemo(() => {
    const groups = {} as Record<FieldGroupKey, typeof fields>;
    
    Object.entries(fields).forEach(([key, field]) => {
      const group = field.definition.group;
      if (!groups[group]) {
        groups[group] = {};
      }
      groups[group][key] = field;
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
        <div>
          <h3 className="text-lg font-semibold text-left">{result.fileName}</h3>
          <p className="text-sm text-muted-foreground">
            Przeanalizowano przez {result.results.length} model
          </p>
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
            <div className="px-6 pb-6 grid gap-6">
              {Object.entries(FIELD_GROUPS).map(([groupKey, group]) => {
                const groupFields = groupedFields[groupKey as FieldGroupKey];
                if (!groupFields || Object.keys(groupFields).length === 0) return null;

                return (
                  <div key={groupKey} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <group.icon className="w-4 h-4" />
                      <h4 className="font-medium">{group.name}</h4>
                    </div>
                    <div className="grid gap-2">
                      {Object.entries(groupFields).map(([fieldName, field]) => {
                        const isRequired = group.requiredFields.includes(fieldName);
                        const hasValue = Boolean(field.content);
                        const hasHighConfidence = field.confidence > 0.9;

                        return (
                          <div key={fieldName} className="flex justify-between items-start text-sm">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{field.definition.name}</span>
                                {isRequired && (
                                  <Badge variant={hasValue ? "outline" : "secondary"} className="text-xs">
                                    Wymagane
                                  </Badge>
                                )}
                              </div>
                              <div className={`${hasValue ? 'text-foreground' : 'text-muted-foreground'}`}>
                                {field.content || 'Nie znaleziono'}
                              </div>
                            </div>
                            <Badge 
                              variant={hasHighConfidence ? "outline" : "secondary"}
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
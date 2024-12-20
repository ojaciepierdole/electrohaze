'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { ProcessingResult, DocumentField } from '@/types/processing';
import type { FieldGroupKey } from '@/types/fields';
import { FIELD_GROUPS } from '@/config/fields';

interface DocumentListProps {
  documents: ProcessingResult[];
  isProcessing: boolean;
}

export function DocumentList({ documents, isProcessing }: DocumentListProps) {
  const [expandedRows, setExpandedRows] = React.useState<string[]>([]);
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const toggleRow = (fileName: string) => {
    setExpandedRows(prev =>
      prev.includes(fileName)
        ? prev.filter(f => f !== fileName)
        : [...prev, fileName]
    );
  };

  const formatCompleteness = (value: number) => {
    return `${Math.round(value * 100)}%`;
  };

  const formatConfidence = (value: number) => {
    return `${Math.round(value * 100)}%`;
  };

  const formatTime = (ms: number) => {
    return `${(ms / 1000).toFixed(1)}s`;
  };

  // Grupuj pola według ich grup
  const groupFields = (doc: ProcessingResult) => {
    const groups = new Map<FieldGroupKey, { 
      label: string; 
      fields: Array<{ key: string; value: string; confidence: number }> 
    }>();

    // Inicjalizuj grupy
    Object.values(FIELD_GROUPS).forEach(({ name, label }) => {
      if (!groups.has(name)) {
        groups.set(name, { label, fields: [] });
      }
    });

    // Dodaj pola do odpowiednich grup
    for (const [groupKey, fields] of Object.entries(doc.mappedData || {})) {
      const group = groups.get(groupKey as FieldGroupKey);
      if (group) {
        for (const [fieldKey, field] of Object.entries(fields as Record<string, DocumentField>)) {
          const typedField = field as DocumentField;
          if (typedField.content) {
            group.fields.push({
              key: fieldKey,
              value: typedField.content,
              confidence: typedField.confidence
            });
          }
        }
      }
    }

    return Array.from(groups.entries())
      .filter(([_, group]) => group.fields.length > 0)
      .sort((a, b) => a[1].label.localeCompare(b[1].label));
  };

  return (
    <Collapsible
      open={!isCollapsed}
      onOpenChange={setIsCollapsed}
      className="w-full space-y-2"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Przetwarzanie dokumentów {isProcessing && "(w toku)"}
        </h3>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm">
            {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
      </div>

      <CollapsibleContent>
        <ScrollArea className="h-[500px] rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell className="w-8"></TableCell>
                <TableCell>Nazwa pliku</TableCell>
                <TableCell className="text-right">Kompletność PPE</TableCell>
                <TableCell className="text-right">Pewność</TableCell>
                <TableCell className="text-right">Czas przetwarzania</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => {
                const confidence = doc.documentConfidence?.confidence || doc.confidence || 0;
                const completeness = doc.documentConfidence?.groups.delivery_point?.completeness || 0;
                const timing = doc.timing?.total || (doc.timing?.end && doc.timing?.start ? 
                  doc.timing.end - doc.timing.start : 0);

                return (
                  <React.Fragment key={doc.fileName}>
                    <TableRow 
                      className={cn(
                        "cursor-pointer hover:bg-muted/50",
                        expandedRows.includes(doc.fileName) && "bg-muted/50"
                      )}
                      onClick={() => toggleRow(doc.fileName)}
                    >
                      <TableCell>
                        {expandedRows.includes(doc.fileName) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </TableCell>
                      <TableCell>{doc.fileName}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Progress 
                            value={completeness * 100} 
                            className="w-[60px]"
                          />
                          {formatCompleteness(completeness)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatConfidence(confidence)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatTime(timing)}
                      </TableCell>
                    </TableRow>
                    {expandedRows.includes(doc.fileName) && (
                      <TableRow className="bg-muted/50">
                        <TableCell colSpan={5} className="p-4">
                          <div className="space-y-6">
                            {groupFields(doc).map(([groupKey, group]) => (
                              <div key={groupKey} className="space-y-2">
                                <h4 className="font-medium">{group.label}</h4>
                                <div className="grid gap-2">
                                  {group.fields.map((field) => (
                                    <div key={field.key} className="flex items-center justify-between text-sm">
                                      <span className="text-muted-foreground">{field.key}:</span>
                                      <div className="flex items-center gap-2">
                                        <span>{field.value || '—'}</span>
                                        <Progress 
                                          value={field.confidence * 100} 
                                          className="w-[40px]"
                                        />
                                        <span className="text-xs text-muted-foreground">
                                          {formatConfidence(field.confidence)}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>
      </CollapsibleContent>
    </Collapsible>
  );
} 
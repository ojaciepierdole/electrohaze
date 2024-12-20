'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPercentage } from '@/lib/utils';
import type { DocumentField } from '@/types/processing';

interface DataGroupProps {
  title: string;
  icon?: React.ReactNode;
  fields: Record<string, DocumentField>;
  confidence: number;
  onEdit?: () => void;
}

export function DataGroup({ title, icon, fields, confidence, onEdit }: DataGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const getConfidenceVariant = (confidence: number) => {
    if (confidence >= 0.9) return 'success';
    if (confidence >= 0.7) return 'warning';
    return 'destructive';
  };

  return (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">{title}</CardTitle>
        <div className="flex items-center space-x-2">
          <Badge variant={getConfidenceVariant(confidence)}>
            {formatPercentage(confidence)}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronUp /> : <ChevronDown />}
          </Button>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent>
          <div className="grid gap-4">
            {Object.entries(fields).map(([key, field]) => (
              <div key={key} className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{key}</span>
                  <span className="text-sm text-muted-foreground">
                    {field.content || 'Brak danych'}
                  </span>
                </div>
                <Badge variant={getConfidenceVariant(field.confidence)}>
                  {formatPercentage(field.confidence)}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
} 
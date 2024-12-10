import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Clock, CheckCircle } from 'lucide-react';
import type { GroupedResult } from '@/types/processing';

interface OptimizedResultCardProps {
  result: GroupedResult;
  modelResults: Array<{
    modelId: string;
    fields: Record<string, any>;
    confidence: number;
    pageCount: number;
  }>;
}

// Komponent dla nagłówka karty
const CardHeader = React.memo(({ fileName, confidence }: { 
  fileName: string; 
  confidence: number;
}) => (
  <div className="flex items-center justify-between p-4 border-b">
    <div className="flex items-center gap-2">
      <FileText className="w-5 h-5 text-muted-foreground" />
      <h3 className="font-medium truncate max-w-[200px]" title={fileName}>
        {fileName}
      </h3>
    </div>
    <Badge variant={confidence > 0.8 ? "success" : confidence > 0.6 ? "warning" : "destructive"}>
      {(confidence * 100).toFixed(1)}%
    </Badge>
  </div>
));

CardHeader.displayName = 'CardHeader';

// Komponent dla pojedynczego pola
const FieldItem = React.memo(({ name, value, confidence }: {
  name: string;
  value: string | null;
  confidence: number;
}) => (
  <div className="flex items-center justify-between py-1">
    <span className="text-sm text-muted-foreground">{name}:</span>
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">{value || '—'}</span>
      <Badge variant="outline" className="text-xs">
        {(confidence * 100).toFixed(0)}%
      </Badge>
    </div>
  </div>
));

FieldItem.displayName = 'FieldItem';

// Komponent dla listy pól
const FieldsList = React.memo(({ fields }: {
  fields: Record<string, { content: string | null; confidence: number }>;
}) => {
  const sortedFields = React.useMemo(() => (
    Object.entries(fields)
      .sort(([, a], [, b]) => b.confidence - a.confidence)
      .slice(0, 5) // Pokazuj tylko 5 najlepszych wyników
  ), [fields]);

  return (
    <div className="space-y-1">
      {sortedFields.map(([name, field]) => (
        <FieldItem
          key={name}
          name={name}
          value={field.content}
          confidence={field.confidence}
        />
      ))}
    </div>
  );
});

FieldsList.displayName = 'FieldsList';

// Główny komponent karty
export const OptimizedResultCard = React.memo(({ result, modelResults }: OptimizedResultCardProps) => {
  if (!modelResults.length) {
    return null;
  }

  // Oblicz średnią pewność dla wszystkich modeli
  const avgConfidence = React.useMemo(() => (
    modelResults.reduce((sum, mr) => sum + mr.confidence, 0) / modelResults.length
  ), [modelResults]);

  return (
    <Card className="bg-white shadow-sm">
      <CardHeader
        fileName={result.fileName}
        confidence={avgConfidence}
      />
      <div className="p-4 space-y-4">
        {modelResults.map(modelResult => (
          <div key={modelResult.modelId} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{modelResult.modelId}</span>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{modelResult.pageCount} stron</span>
              </div>
            </div>
            <FieldsList fields={modelResult.fields} />
          </div>
        ))}
      </div>
    </Card>
  );
});

OptimizedResultCard.displayName = 'OptimizedResultCard'; 
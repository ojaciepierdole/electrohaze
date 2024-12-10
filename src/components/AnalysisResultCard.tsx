'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { FIELD_GROUPS, type FieldGroupKey, type FieldName } from '@/config/fields';
import { truncateFileName } from '@/utils/processing';
import type { ProcessingResult } from '@/types/processing';

interface AnalysisResultCardProps {
  result: ProcessingResult;
}

export function AnalysisResultCard({ result }: AnalysisResultCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-gray-400" />
          <div>
            <h3 className="font-medium">{truncateFileName(result.fileName)}</h3>
            <p className="text-sm text-gray-500">Model: {result.modelId}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {result.positiveBaseline && (
            <Badge variant="success" className="gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Baseline
            </Badge>
          )}
          {result.topScore && (
            <Badge variant="info" className="gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Top Score
            </Badge>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {(Object.keys(FIELD_GROUPS) as FieldGroupKey[]).map(groupKey => {
          const group = FIELD_GROUPS[groupKey];
          const groupFields = Object.entries(result.fields)
            .filter(([fieldName]) => {
              const field = fieldName as keyof typeof result.fields;
              return (group.fields as readonly string[]).includes(field);
            })
            .filter(([_, field]) => field.content !== null);

          if (groupFields.length === 0) return null;

          return (
            <div key={groupKey} className="border rounded-lg p-3">
              <div className="flex items-center gap-2 mb-3">
                <group.icon className="w-4 h-4 text-gray-500" />
                <h4 className="font-medium text-sm">{group.name}</h4>
              </div>

              <div className="space-y-2">
                {groupFields.map(([fieldName, field]) => (
                  <div
                    key={fieldName}
                    className="flex items-center justify-between py-1 border-b last:border-0"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{fieldName}</div>
                      <div className="text-sm text-gray-500 truncate">
                        {field.content}
                      </div>
                    </div>
                    <div className="ml-4 flex items-center gap-1">
                      {field.confidence < 0.7 && (
                        <AlertCircle className="w-4 h-4 text-yellow-500" />
                      )}
                      <span
                        className={`text-xs font-medium ${
                          field.confidence >= 0.9
                            ? 'text-green-600'
                            : field.confidence >= 0.7
                            ? 'text-blue-600'
                            : 'text-yellow-600'
                        }`}
                      >
                        {Math.round(field.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
} 
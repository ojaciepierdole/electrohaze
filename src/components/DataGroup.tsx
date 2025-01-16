import { Card } from "@/components/ui/card";

interface Field {
  key: string;
  label: string;
}

interface DataGroupProps {
  title: string;
  data: Record<string, any>;
  fields: Field[];
}

export function DataGroup({ title, data, fields }: DataGroupProps) {
  return (
    <Card className="p-4">
      <h3 className="text-sm font-medium text-gray-700 mb-3">{title}</h3>
      <div className="space-y-2">
        {fields.map(field => (
          <div key={field.key} className="flex items-baseline">
            <span className="text-sm text-gray-500 min-w-[150px]">{field.label}</span>
            <div className="flex-1 mx-2 border-b border-dotted border-gray-200" />
            <span className="text-sm text-gray-900">
              {data?.[field.key]?.content || "Nie znaleziono"}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
} 
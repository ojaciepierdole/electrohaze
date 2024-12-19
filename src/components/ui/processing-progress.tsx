import { Progress } from "@/components/ui/progress";

interface ProcessingTime {
  uploadTime: number;
  ocrTime: number;
  analysisTime: number;
  totalTime: number;
}

export function ProcessingProgress({ times }: { times: ProcessingTime }) {
  const totalTime = times.totalTime;
  
  // Oblicz procentowe udziały czasów
  const uploadPercent = (times.uploadTime / totalTime) * 100;
  const ocrPercent = (times.ocrTime / totalTime) * 100;
  const analysisPercent = (times.analysisTime / totalTime) * 100;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="text-sm font-medium">Upload</div>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold">{times.uploadTime.toFixed(1)}s</div>
            <div className="text-sm text-muted-foreground">
              {uploadPercent.toFixed(1)}%
            </div>
          </div>
        </div>
        <Progress value={uploadPercent} className="mt-2" />
        
        <div className="space-y-2">
          <div className="text-sm font-medium">OCR</div>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold">{times.ocrTime.toFixed(1)}s</div>
            <div className="text-sm text-muted-foreground">
              {ocrPercent.toFixed(1)}%
            </div>
          </div>
        </div>
        <Progress value={ocrPercent} className="mt-2" />
        
        <div className="space-y-2">
          <div className="text-sm font-medium">Analiza</div>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold">{times.analysisTime.toFixed(1)}s</div>
            <div className="text-sm text-muted-foreground">
              {analysisPercent.toFixed(1)}%
            </div>
          </div>
        </div>
        <Progress value={analysisPercent} className="mt-2" />
      </div>
      
      <div className="pt-4 border-t">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">Całkowity czas</div>
          <div className="text-2xl font-bold">{totalTime.toFixed(1)}s</div>
        </div>
      </div>
    </div>
  );
} 
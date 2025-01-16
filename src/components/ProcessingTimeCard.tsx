import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Clock, Upload, Search, Brain } from "lucide-react";

interface ProcessingTime {
  uploadTime: number;
  ocrTime: number;
  analysisTime: number;
  totalTime: number;
}

interface ProcessingTimeCardProps {
  processingTime: ProcessingTime;
}

export function ProcessingTimeCard({ processingTime }: ProcessingTimeCardProps) {
  const formatTime = (ms: number) => `${(ms / 1000).toFixed(1)}s`;
  
  const calculatePercentage = (time: number) => {
    return (time / processingTime.totalTime) * 100;
  };

  const timeSteps = [
    { 
      label: "Upload", 
      time: processingTime.uploadTime,
      icon: Upload,
      color: "bg-blue-500"
    },
    { 
      label: "OCR", 
      time: processingTime.ocrTime,
      icon: Search,
      color: "bg-purple-500"
    },
    { 
      label: "Analiza", 
      time: processingTime.analysisTime,
      icon: Brain,
      color: "bg-green-500"
    }
  ];

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-gray-500" />
        <h3 className="text-sm font-medium text-gray-700">
          Czas przetwarzania
        </h3>
        <span className="text-sm text-gray-500 ml-auto">
          Całkowity: {formatTime(processingTime.totalTime)}
        </span>
      </div>

      <div className="space-y-3">
        {timeSteps.map(({ label, time, icon: Icon, color }) => {
          const percentage = calculatePercentage(time);
          return (
            <div key={label} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">{label}</span>
                </div>
                <span className="text-gray-900 font-medium">
                  {formatTime(time)} ({percentage.toFixed(1)}%)
                </span>
              </div>
              <Progress value={percentage} className={color} />
            </div>
          );
        })}
      </div>
    </Card>
  );
} 
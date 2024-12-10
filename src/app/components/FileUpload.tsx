import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileType } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
}

export function FileUpload({ onFileSelect, isProcessing }: FileUploadProps) {
  const [error, setError] = useState<string | null>(null);
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    
    if (acceptedFiles.length === 0) {
      setError('Proszę wybrać plik PDF lub obraz');
      return;
    }
    
    const file = acceptedFiles[0];
    if (!file.type.match('application/pdf|image/*')) {
      setError('Dozwolone są tylko pliki PDF lub obrazy');
      return;
    }
    
    onFileSelect(file);
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.tiff']
    },
    multiple: false
  });

  return (
    <Card className="w-full max-w-2xl mx-auto p-6">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8
          flex flex-col items-center justify-center
          cursor-pointer transition-colors
          ${isDragActive ? 'border-primary bg-primary/10' : 'border-gray-300'}
          ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 text-gray-400 mb-4" />
        <p className="text-center text-gray-600">
          {isDragActive
            ? 'Upuść plik tutaj...'
            : 'Przeciągnij i upuść plik lub kliknij, aby wybrać'}
        </p>
        <Button 
          variant="outline" 
          className="mt-4"
          disabled={isProcessing}
        >
          Wybierz plik
        </Button>
        {error && (
          <p className="mt-4 text-red-500 text-sm">{error}</p>
        )}
      </div>
    </Card>
  );
} 
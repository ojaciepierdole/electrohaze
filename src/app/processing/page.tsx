import { ProcessingClient } from '@/components/ProcessingClient';

export const metadata = {
  title: 'Przetwarzanie | Document Analysis',
  description: 'Przetwarzanie wsadowe dokumentów',
};

export default function ProcessingPage() {
  return (
    <div className="container mx-auto px-4">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Przetwarzanie dokumentów</h1>
          <p className="mt-2 text-gray-600">
            Wybierz pliki PDF i modele do analizy
          </p>
        </div>
        
        <ProcessingClient />
      </div>
    </div>
  );
} 
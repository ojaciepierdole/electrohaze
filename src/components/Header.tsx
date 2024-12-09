'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ModelSelector } from './ModelSelector';
import { useModel } from '../context/ModelContext';
import { BarChart2 } from 'lucide-react';

export const Header = () => {
  const { setSelectedModel } = useModel();

  return (
    <div className="border-b bg-white">
      <div className="max-w-6xl mx-auto px-8 py-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          {/* Lewa strona - logo i tytuł */}
          <div className="flex items-start sm:items-center gap-2">
            <Image 
              src="/file.svg" 
              alt="Document icon" 
              width={24} 
              height={24} 
            />
            <div className="flex flex-col items-start">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-700">
                Analiza faktury za prąd
              </h1>
              <p className="text-xs text-gray-500 sm:text-right sm:hidden pl-0">
                Automatyczna analiza faktur i wyodrębnianie danych
              </p>
            </div>
          </div>
          
          {/* Prawa strona - ModelSelector i Analytics */}
          <div className="flex items-center gap-4">
            <ModelSelector 
              onModelSelect={setSelectedModel}
            />
            <Link 
              href="/analytics" 
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <BarChart2 className="w-4 h-4" />
              <span>Analityka</span>
            </Link>
            <p className="hidden sm:block text-xs text-gray-500 sm:text-right max-w-[200px]">
              Automatyczna analiza faktur i wyodrębnianie danych
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}; 
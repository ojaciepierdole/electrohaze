'use client';

import { useModel } from '../context/ModelContext';

export const SomeComponent = () => {
  const { selectedModel } = useModel();

  return (
    <div>
      <p>Aktualnie wybrany model: {selectedModel?.description || 'Nie wybrano'}</p>
      {/* Reszta komponentu */}
    </div>
  );
}; 
// Globalny obiekt do przechowywania emiterów dla każdej sesji
export const progressEmitters = new Map<string, (data: string) => void>();

// Funkcja pomocnicza do wysyłania aktualizacji postępu
export function sendProgress(sessionId: string, data: any) {
  console.log(`Sending progress update for session ${sessionId}:`, data);
  const emitter = progressEmitters.get(sessionId);
  if (emitter) {
    emitter(JSON.stringify(data));
  } else {
    console.warn(`No emitter found for session ${sessionId}`);
  }
} 
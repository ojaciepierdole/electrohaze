import { Logger } from '@/lib/logger';

const logger = Logger.getInstance();

// Globalny obiekt do przechowywania emiterów dla każdej sesji
export const progressEmitters = new Map<string, (data: string) => void>();

// Kolejka wiadomości oczekujących na emitter
const messageQueues = new Map<string, string[]>();

// Maksymalny czas oczekiwania na emitter (ms)
const MAX_WAIT_TIME = 5000;

// Interwał sprawdzania emittera (ms)
const CHECK_INTERVAL = 10;

// Maksymalna liczba prób wysłania wiadomości
const MAX_RETRIES = 5;

// Opóźnienie między wiadomościami (ms)
const MESSAGE_DELAY = 5;

// Funkcja do pobierania kolejki wiadomości
export function getMessageQueue(sessionId: string): string[] {
  return messageQueues.get(sessionId) || [];
}

// Funkcja pomocnicza do wysyłania aktualizacji postępu
export async function sendProgress(sessionId: string, data: any) {
  const isLastMessage = data.results !== undefined;
  const serializedData = JSON.stringify(data);
  
  // Zawsze dodaj wiadomość do kolejki
  addToQueue(sessionId, serializedData);
  
  let retries = 0;
  while (retries < MAX_RETRIES) {
    const emitter = progressEmitters.get(sessionId);
    if (emitter) {
      try {
        // Wyślij wszystkie zakolejkowane wiadomości
        const queuedMessages = messageQueues.get(sessionId) || [];
        for (const message of queuedMessages) {
          emitter(message);
          if (queuedMessages.length > 1) {
            await new Promise(resolve => setTimeout(resolve, MESSAGE_DELAY));
          }
        }
        
        // Wyczyść kolejkę po udanym wysłaniu
        messageQueues.set(sessionId, []);
        
        // Jeśli to ostatnia wiadomość, wyczyść zasoby
        if (isLastMessage) {
          clearSession(sessionId);
        }
        
        return;
      } catch (error) {
        retries++;
        await new Promise(resolve => setTimeout(resolve, 50 * retries));
      }
    } else {
      // Poczekaj na emitter
      const startTime = Date.now();
      while (!progressEmitters.has(sessionId) && Date.now() - startTime < MAX_WAIT_TIME) {
        await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL));
      }
      
      if (!progressEmitters.has(sessionId)) {
        retries++;
      }
    }
  }
}

// Funkcja do dodawania wiadomości do kolejki
function addToQueue(sessionId: string, data: string) {
  if (!messageQueues.has(sessionId)) {
    messageQueues.set(sessionId, []);
  }
  messageQueues.get(sessionId)!.push(data);
}

// Funkcja do czyszczenia zasobów dla sesji
function clearSession(sessionId: string) {
  messageQueues.delete(sessionId);
  progressEmitters.delete(sessionId);
}

// Funkcja do czyszczenia kolejki dla sesji
export function clearMessageQueue(sessionId: string) {
  messageQueues.delete(sessionId);
} 
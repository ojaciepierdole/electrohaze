import { NextResponse } from 'next/server';

// Globalny obiekt do przechowywania emiterów dla każdej sesji
const progressEmitters = new Map<string, (data: string) => void>();

export function GET(request: Request) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get('sessionId');
  
  console.log('SSE connection request:', {
    url: request.url,
    sessionId,
    headers: Object.fromEntries(request.headers.entries())
  });
  
  if (!sessionId) {
    console.warn('Missing session ID in SSE request');
    return NextResponse.json({ error: 'Missing session ID' }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      console.log(`Setting up SSE stream for session ${sessionId}`);
      // Zapisz emiter dla tej sesji
      progressEmitters.set(sessionId, (data: string) => {
        console.log(`Emitting data for session ${sessionId}:`, data);
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      });

      // Wyślij początkowy heartbeat
      console.log(`Sending initial heartbeat for session ${sessionId}`);
      controller.enqueue(encoder.encode(': heartbeat\n\n'));
    },
    cancel() {
      console.log(`Cancelling SSE stream for session ${sessionId}`);
      progressEmitters.delete(sessionId);
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}

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
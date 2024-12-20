import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  // Loguj request
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    type: 'request',
    requestId,
    method: request.method,
    url: request.url,
    headers: Object.fromEntries(request.headers)
  }, null, 2));

  // Kontynuuj przetwarzanie
  const response = NextResponse.next();

  // Dodaj requestId do response headers
  response.headers.set('X-Request-ID', requestId);

  // Loguj response
  const duration = Date.now() - startTime;
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    type: 'response',
    requestId,
    status: response.status,
    duration,
    headers: Object.fromEntries(response.headers)
  }, null, 2));

  return response;
}

export const config = {
  matcher: '/api/:path*',
}; 
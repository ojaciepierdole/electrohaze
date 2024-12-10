import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === '/processing') {
    return NextResponse.redirect(new URL('/', request.url))
  }
}

export const config = {
  matcher: '/processing',
} 
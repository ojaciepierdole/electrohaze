import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const domain = searchParams.get('domain');
  const size = searchParams.get('size') || '200';
  
  if (!domain) {
    return new NextResponse('Domain is required', { status: 400 });
  }

  try {
    const token = process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN;
    const response = await fetch(
      `https://img.logo.dev/${domain}?format=png&size=${size}&token=${token}`,
      {
        headers: {
          'Accept': 'image/png',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Logo API returned ${response.status}`);
    }

    const buffer = await response.arrayBuffer();
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400', // Cache na 24h
      },
    });
  } catch (error) {
    console.error('Error fetching logo:', error);
    return new NextResponse('Error fetching logo', { status: 500 });
  }
} 
import { NextRequest, NextResponse } from 'next/server';

const LOGO_DEV_API_KEY = process.env.LOGO_DEV_API_KEY;
const LOGO_DEV_API_URL = 'https://logo.dev/api/v1/logo';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');
    const size = searchParams.get('size') || '200';

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain parameter is required' },
        { status: 400 }
      );
    }

    if (!LOGO_DEV_API_KEY) {
      return NextResponse.json(
        { error: 'Logo.dev API key is not configured' },
        { status: 500 }
      );
    }

    const params = new URLSearchParams({
      domain,
      size,
      format: 'png',
      type: 'square'
    });

    const response = await fetch(`${LOGO_DEV_API_URL}?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${LOGO_DEV_API_KEY}`
      }
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch logo from logo.dev' },
        { status: response.status }
      );
    }

    const buffer = await response.arrayBuffer();
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800'
      }
    });

  } catch (error) {
    console.error('Error fetching logo:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
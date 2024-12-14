import { NextRequest, NextResponse } from 'next/server';
import Vibrant from 'node-vibrant';

export const runtime = 'nodejs'; // Wymuszamy runtime Node.js

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const domain = searchParams.get('domain');
  
  if (!domain) {
    return new NextResponse('Domain is required', { status: 400 });
  }

  try {
    const token = process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN;
    const logoUrl = `https://img.logo.dev/${domain}?format=png&size=200&token=${token}`;
    
    const palette = await Vibrant.from(logoUrl)
      .quality(1)
      .maxColorCount(64)
      .getPalette();
    
    const colors = {
      primary: palette.Vibrant?.hex || '#3b82f6',
      secondary: palette.LightVibrant?.hex,
      background: palette.Muted?.hex,
      muted: `${palette.Vibrant?.hex || '#3b82f6'}1A`
    };

    return NextResponse.json(colors, {
      headers: {
        'Cache-Control': 'public, max-age=86400', // Cache na 24h
      },
    });
  } catch (error) {
    console.error('Error extracting colors:', error);
    return NextResponse.json({ 
      primary: '#3b82f6',
      muted: '#3b82f61A'
    }, { status: 500 });
  }
} 
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('https://docs.opencv.org/4.7.0/opencv.js', {
      headers: {
        'Accept': 'application/javascript',
      },
    });

    if (!response.ok) {
      throw new Error(`OpenCV script fetch failed: ${response.status}`);
    }

    const script = await response.text();

    return new NextResponse(script, {
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'public, max-age=86400', // Cache na 24h
      },
    });
  } catch (error) {
    console.error('Error fetching OpenCV:', error);
    return new NextResponse('Error loading OpenCV', { status: 500 });
  }
} 
import Vibrant from 'node-vibrant';

export interface ColorPalette {
  primary: string;
  secondary?: string;
  background?: string;
}

export async function extractColorsFromLogo(imageUrl: string): Promise<ColorPalette> {
  try {
    const palette = await Vibrant.from(imageUrl).getPalette();
    
    return {
      primary: palette.Vibrant?.hex || '#3b82f6', // domyślny niebieski jako fallback
      secondary: palette.LightVibrant?.hex,
      background: palette.Muted?.hex,
    };
  } catch (error) {
    console.error('Error extracting colors:', error);
    return {
      primary: '#3b82f6', // domyślny niebieski
    };
  }
}

// Cache dla kolorów według domeny
const colorCache: Record<string, ColorPalette> = {};

export async function getSupplierColors(domain: string): Promise<ColorPalette> {
  if (colorCache[domain]) {
    return colorCache[domain];
  }

  try {
    const response = await fetch(`/api/logo?domain=${domain}`);
    if (!response.ok) throw new Error('Failed to fetch logo');
    
    const colors = await extractColorsFromLogo(response.url);
    colorCache[domain] = colors;
    return colors;
  } catch (error) {
    console.error('Error getting supplier colors:', error);
    return { primary: '#3b82f6' };
  }
} 
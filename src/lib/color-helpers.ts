import Vibrant from 'node-vibrant';

export interface ColorPalette {
  primary: string;
  secondary?: string;
  background?: string;
  muted?: string;
}

export async function extractColorsFromLogo(imageUrl: string): Promise<ColorPalette> {
  try {
    console.log('Extracting colors from:', imageUrl);
    
    const palette = await Vibrant.from(imageUrl)
      .quality(1)
      .maxColorCount(64)
      .getPalette();
    
    console.log('Vibrant palette:', palette);
    
    // Używamy Vibrant jako głównego koloru dla słupków i tła (z przezroczystością)
    const primaryColor = palette.Vibrant?.hex || '#3b82f6';
    const mutedColor = palette.Muted?.hex || primaryColor;
    
    const colors = {
      primary: primaryColor,
      secondary: palette.LightVibrant?.hex,
      background: mutedColor,
      // Używamy tego samego koloru primary z 10% przezroczystością dla tła
      muted: `${primaryColor}1A` // 1A w hex = 10% przezroczystości
    };
    
    console.log('Final color palette:', colors);
    return colors;
  } catch (error) {
    console.error('Error extracting colors:', error);
    return {
      primary: '#3b82f6',
      muted: '#3b82f61A'
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
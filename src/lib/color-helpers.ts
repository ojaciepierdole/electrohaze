// Importujemy node-vibrant dynamicznie tylko po stronie serwera
let Vibrant: any;

if (typeof window === 'undefined') {
  import('node-vibrant').then((module) => {
    Vibrant = module.default;
  });
}

export interface ColorPalette {
  primary: string;
  secondary?: string;
  background?: string;
  muted?: string;
}

export async function extractColorsFromLogo(imageUrl: string): Promise<ColorPalette> {
  try {
    if (!Vibrant) {
      throw new Error('Vibrant is not available on client side');
    }

    console.log('Extracting colors from:', imageUrl);
    
    const palette = await Vibrant.from(imageUrl)
      .quality(1)
      .maxColorCount(64)
      .getPalette();
    
    console.log('Vibrant palette:', palette);
    
    const primaryColor = palette.Vibrant?.hex || '#3b82f6';
    const mutedColor = palette.Muted?.hex || primaryColor;
    
    const colors = {
      primary: primaryColor,
      secondary: palette.LightVibrant?.hex,
      background: mutedColor,
      muted: `${primaryColor}1A`
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
    const response = await fetch(`/api/logo/colors?domain=${domain}`);
    if (!response.ok) throw new Error('Failed to fetch colors');
    
    const colors = await response.json();
    colorCache[domain] = colors;
    return colors;
  } catch (error) {
    console.error('Error getting supplier colors:', error);
    return { primary: '#3b82f6' };
  }
} 
import { NextRequest, NextResponse } from 'next/server';

const LOGO_TOKEN = process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN;

// Mapowanie nazw dostawców na domeny
const SUPPLIER_MAPPINGS: Array<{ pattern: RegExp; domain: string }> = [
  { pattern: /ORANGE/i, domain: 'orange.fr' },
  { pattern: /TAURON/i, domain: 'tauron.pl' },
  { pattern: /PGE/i, domain: 'gkpge.pl' },
  { pattern: /ENEA/i, domain: 'enea.pl' },
  { pattern: /ENERGA/i, domain: 'energa.pl' },
  { pattern: /POLKOMTEL|PLUS/i, domain: 'plus.pl' },
  { pattern: /E\.?ON|EON/i, domain: 'eon.com' },
  { pattern: /ENERGIA\s+POLSKA/i, domain: 'energiapolska.com.pl' },
  { pattern: /LUMI/i, domain: 'lumipge.pl' },
  { pattern: /FORTUM/i, domain: 'fortum.pl' },
  { pattern: /GREEN\s*S\.?A\.?|GREEN\s+ENERGIA/i, domain: 'green-sa.pl' }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');

    if (!name) {
      return NextResponse.json({ error: 'Name parameter is required' }, { status: 400 });
    }

    if (!LOGO_TOKEN) {
      return NextResponse.json({ error: 'Logo token not configured' }, { status: 500 });
    }

    // Znajdź mapowanie dla dostawcy na podstawie wzorca
    const mapping = SUPPLIER_MAPPINGS.find(m => m.pattern.test(name));
    
    // Jeśli nie ma mapowania, generuj domenę z nazwy
    const domain = mapping?.domain || name.toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .replace(/spzoo|spolkazo{1,2}|saz?o{0,2}|sp\.?z\.?o\.?o\.?/g, '')
      .replace(/spolka|akcyjna|sa|s\.?a\.?/g, '')
      .replace(/energia|energetyka|energetyczny/g, '')
      .trim();

    const logoUrl = `https://img.logo.dev/${domain}?format=png&size=120&token=${LOGO_TOKEN}`;

    // Zwróć URL do logo
    return NextResponse.json({ url: logoUrl });

  } catch (error) {
    console.error('Error generating logo URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate logo URL' }, 
      { status: 500 }
    );
  }
} 
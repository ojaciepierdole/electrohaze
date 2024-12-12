import { NextResponse } from 'next/server';
import { AlertService } from '@/lib/alert-service';
import { Logger } from '@/lib/logger';

const logger = Logger.getInstance();
const alertService = AlertService.getInstance();

// GET /api/alerts - Pobieranie alertów
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const alerts = alertService.getActiveAlerts({
      severity: searchParams.get('severity') as any,
      acknowledged: searchParams.get('acknowledged') === 'true',
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined
    });

    return NextResponse.json({ alerts });
  } catch (error) {
    logger.error('Błąd podczas pobierania alertów', { error });
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas pobierania alertów' },
      { status: 500 }
    );
  }
}

// POST /api/alerts/acknowledge - Potwierdzanie alertu
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { alertId, userId } = body;

    if (!alertId || !userId) {
      return NextResponse.json(
        { error: 'Brak wymaganych pól: alertId i userId' },
        { status: 400 }
      );
    }

    alertService.acknowledgeAlert(alertId, userId);

    return NextResponse.json({ 
      message: 'Alert potwierdzony',
      alertId
    });
  } catch (error) {
    logger.error('Błąd podczas potwierdzania alertu', { error });
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas potwierdzania alertu' },
      { status: 500 }
    );
  }
}

// DELETE /api/alerts - Czyszczenie alertów
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    alertService.clearAlerts({
      olderThan: searchParams.get('olderThan') ? new Date(searchParams.get('olderThan')!) : undefined,
      severity: searchParams.get('severity') as any,
      acknowledged: searchParams.get('acknowledged') === 'true'
    });

    return NextResponse.json({ message: 'Alerty wyczyszczone' });
  } catch (error) {
    logger.error('Błąd podczas czyszczenia alertów', { error });
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas czyszczenia alertów' },
      { status: 500 }
    );
  }
}

// PUT /api/alerts/config - Konfiguracja serwisu alertów
export async function PUT(request: Request) {
  try {
    const config = await request.json();
    
    alertService.configure(config);

    return NextResponse.json({ 
      message: 'Konfiguracja zaktualizowana',
      config: {
        hasWebhook: !!config.webhookUrl,
        hasEmailConfig: !!config.emailConfig,
        hasSlackConfig: !!config.slackConfig
      }
    });
  } catch (error) {
    logger.error('Błąd podczas aktualizacji konfiguracji alertów', { error });
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas aktualizacji konfiguracji' },
      { status: 500 }
    );
  }
} 
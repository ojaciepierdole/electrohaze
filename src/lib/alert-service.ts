import { Logger } from './logger';

export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';
export type AlertChannel = 'console' | 'email' | 'slack' | 'webhook';

export interface AlertConfig {
  severity: AlertSeverity;
  channels: AlertChannel[];
  threshold?: number;
  cooldown?: number; // w milisekundach
}

export interface Alert {
  id: string;
  severity: AlertSeverity;
  message: string;
  timestamp: Date;
  context?: Record<string, unknown>;
  acknowledged?: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}

interface AlertRule {
  name: string;
  condition: (context: Record<string, unknown>) => boolean;
  message: string | ((context: Record<string, unknown>) => string);
  config: AlertConfig;
  lastTriggered?: Date;
  triggerCount: number;
}

export class AlertService {
  private static instance: AlertService;
  private logger: Logger;
  private alerts: Alert[] = [];
  private rules: Map<string, AlertRule> = new Map();
  private webhookUrl?: string;
  private emailConfig?: {
    from: string;
    to: string[];
    apiKey: string;
  };
  private slackConfig?: {
    webhookUrl: string;
    channel: string;
  };

  private constructor() {
    this.logger = Logger.getInstance();
    this.initializeDefaultRules();
  }

  static getInstance(): AlertService {
    if (!AlertService.instance) {
      AlertService.instance = new AlertService();
    }
    return AlertService.instance;
  }

  private initializeDefaultRules(): void {
    // Reguła dla długiego czasu przetwarzania
    this.addRule({
      name: 'long-processing-time',
      condition: (context) => (context.processingTime as number) > 10000,
      message: (context) => 
        `Długi czas przetwarzania dokumentu: ${context.processingTime}ms (${context.fileName})`,
      config: {
        severity: 'warning',
        channels: ['console', 'slack'],
        cooldown: 5 * 60 * 1000 // 5 minut
      }
    });

    // Reguła dla niskiej pewności analizy
    this.addRule({
      name: 'low-confidence',
      condition: (context) => (context.confidence as number) < 0.6,
      message: (context) => 
        `Niska pewność analizy dokumentu: ${(context.confidence as number * 100).toFixed(1)}% (${context.fileName})`,
      config: {
        severity: 'warning',
        channels: ['console', 'email'],
        threshold: 3 // Alert po 3 wystąpieniach
      }
    });

    // Reguła dla błędów API
    this.addRule({
      name: 'api-error',
      condition: (context) => context.statusCode === 500,
      message: 'Błąd serwera podczas przetwarzania dokumentu',
      config: {
        severity: 'error',
        channels: ['console', 'slack', 'email'],
        cooldown: 15 * 60 * 1000 // 15 minut
      }
    });

    // Reguła dla przepełnienia cache'a
    this.addRule({
      name: 'cache-overflow',
      condition: (context) => 
        (context.cacheSize as number) > (context.maxCacheSize as number) * 0.9,
      message: (context) => 
        `Cache osiągnął ${Math.round((context.cacheSize as number) / (context.maxCacheSize as number) * 100)}% pojemności`,
      config: {
        severity: 'warning',
        channels: ['console'],
        cooldown: 60 * 60 * 1000 // 1 godzina
      }
    });
  }

  configure(config: {
    webhookUrl?: string;
    emailConfig?: {
      from: string;
      to: string[];
      apiKey: string;
    };
    slackConfig?: {
      webhookUrl: string;
      channel: string;
    };
  }): void {
    this.webhookUrl = config.webhookUrl;
    this.emailConfig = config.emailConfig;
    this.slackConfig = config.slackConfig;
  }

  addRule(rule: Omit<AlertRule, 'triggerCount'>): void {
    this.rules.set(rule.name, { ...rule, triggerCount: 0 });
  }

  removeRule(name: string): void {
    this.rules.delete(name);
  }

  private async sendToChannel(
    alert: Alert,
    channel: AlertChannel
  ): Promise<void> {
    switch (channel) {
      case 'console':
        this.logger.warn(`ALERT: ${alert.message}`, {
          severity: alert.severity,
          context: alert.context
        });
        break;

      case 'email':
        if (this.emailConfig) {
          // Implementacja wysyłania emaila
          // TODO: Dodać integrację z serwisem mailowym
        }
        break;

      case 'slack':
        if (this.slackConfig) {
          try {
            const response = await fetch(this.slackConfig.webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                channel: this.slackConfig.channel,
                text: `[${alert.severity.toUpperCase()}] ${alert.message}`,
                attachments: [
                  {
                    color: this.getSeverityColor(alert.severity),
                    fields: Object.entries(alert.context || {}).map(([key, value]) => ({
                      title: key,
                      value: JSON.stringify(value),
                      short: true
                    }))
                  }
                ]
              })
            });

            if (!response.ok) {
              throw new Error(`Błąd wysyłania do Slack: ${response.statusText}`);
            }
          } catch (error) {
            this.logger.error('Błąd wysyłania alertu do Slack', { error });
          }
        }
        break;

      case 'webhook':
        if (this.webhookUrl) {
          try {
            const response = await fetch(this.webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(alert)
            });

            if (!response.ok) {
              throw new Error(`Błąd wysyłania do webhooka: ${response.statusText}`);
            }
          } catch (error) {
            this.logger.error('Błąd wysyłania alertu do webhooka', { error });
          }
        }
        break;
    }
  }

  private getSeverityColor(severity: AlertSeverity): string {
    switch (severity) {
      case 'info': return '#2196F3';
      case 'warning': return '#FFC107';
      case 'error': return '#F44336';
      case 'critical': return '#D32F2F';
      default: return '#9E9E9E';
    }
  }

  private canTriggerAlert(rule: AlertRule): boolean {
    if (!rule.lastTriggered) return true;

    if (rule.config.cooldown) {
      const timeSinceLastTrigger = Date.now() - rule.lastTriggered.getTime();
      if (timeSinceLastTrigger < rule.config.cooldown) {
        return false;
      }
    }

    if (rule.config.threshold) {
      return rule.triggerCount >= rule.config.threshold;
    }

    return true;
  }

  async checkAndTrigger(context: Record<string, unknown>): Promise<void> {
    for (const [name, rule] of this.rules.entries()) {
      if (rule.condition(context)) {
        rule.triggerCount++;
        rule.lastTriggered = new Date();

        if (this.canTriggerAlert(rule)) {
          const alert: Alert = {
            id: `${name}-${Date.now()}`,
            severity: rule.config.severity,
            message: typeof rule.message === 'function' ? rule.message(context) : rule.message,
            timestamp: new Date(),
            context
          };

          this.alerts.push(alert);

          // Wysyłanie alertu wszystkimi skonfigurowanymi kanałami
          await Promise.all(
            rule.config.channels.map(channel => this.sendToChannel(alert, channel))
          );

          // Reset licznika po wysłaniu alertu
          if (rule.config.threshold) {
            rule.triggerCount = 0;
          }
        }
      }
    }
  }

  acknowledgeAlert(alertId: string, userId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert && !alert.acknowledged) {
      alert.acknowledged = true;
      alert.acknowledgedBy = userId;
      alert.acknowledgedAt = new Date();

      this.logger.info('Alert potwierdzony', {
        alertId,
        userId,
        severity: alert.severity
      });
    }
  }

  getActiveAlerts(options: {
    severity?: AlertSeverity;
    acknowledged?: boolean;
    limit?: number;
  } = {}): Alert[] {
    let filtered = this.alerts;

    if (options.severity) {
      filtered = filtered.filter(alert => alert.severity === options.severity);
    }

    if (options.acknowledged !== undefined) {
      filtered = filtered.filter(alert => alert.acknowledged === options.acknowledged);
    }

    if (options.limit) {
      filtered = filtered.slice(-options.limit);
    }

    return filtered;
  }

  clearAlerts(options: {
    olderThan?: Date;
    severity?: AlertSeverity;
    acknowledged?: boolean;
  } = {}): void {
    if (!options.olderThan && !options.severity && options.acknowledged === undefined) {
      this.alerts = [];
      return;
    }

    this.alerts = this.alerts.filter(alert => {
      if (options.olderThan && alert.timestamp < options.olderThan) return false;
      if (options.severity && alert.severity !== options.severity) return false;
      if (options.acknowledged !== undefined && alert.acknowledged !== options.acknowledged) return false;
      return true;
    });
  }
} 
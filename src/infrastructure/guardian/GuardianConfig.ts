import type { GuardianConfig } from '@/types/guardian/guardian';

/**
 * Guardian Medex API Configuration Service
 */
export class GuardianConfigService {
  private static instance: GuardianConfigService;
  private config: GuardianConfig;

  private constructor() {
    // Environment detection: use process.env for Node.js, import.meta.env for Vite
    const isBrowser = typeof window !== 'undefined';
    const isVite = typeof import.meta !== 'undefined' && import.meta.env;
    
    this.config = {
      baseUrl: 
        (isVite ? import.meta.env.VITE_GUARDIAN_API_BASE_URL : null) ||
        process.env.GUARDIAN_API_BASE_URL || 
        process.env.VITE_GUARDIAN_API_BASE_URL ||
        'https://api.medex.guardian-dev.com',
      privateKey: 
        (isVite ? import.meta.env.VITE_GUARDIAN_PRIVATE_KEY : null) ||
        process.env.GUARDIAN_PRIVATE_KEY || 
        process.env.VITE_GUARDIAN_PRIVATE_KEY ||
        '',
      publicKey: 
        (isVite ? import.meta.env.VITE_GUARDIAN_PUBLIC_KEY : null) ||
        process.env.GUARDIAN_PUBLIC_KEY || 
        process.env.VITE_GUARDIAN_PUBLIC_KEY ||
        '',
      apiKey: 
        (isVite ? import.meta.env.VITE_GUARDIAN_API_KEY : null) ||
        process.env.GUARDIAN_API_KEY || 
        process.env.VITE_GUARDIAN_API_KEY ||
        '',
      webhookUrl: 
        (isVite ? import.meta.env.VITE_GUARDIAN_DEFAULT_WEBHOOK_URL : null) ||
        process.env.GUARDIAN_DEFAULT_WEBHOOK_URL || 
        process.env.VITE_GUARDIAN_DEFAULT_WEBHOOK_URL ||
        '',
      webhookAuthKey: 
        (isVite ? import.meta.env.VITE_GUARDIAN_WEBHOOK_AUTH_KEY : null) ||
        process.env.GUARDIAN_WEBHOOK_AUTH_KEY || 
        process.env.VITE_GUARDIAN_WEBHOOK_AUTH_KEY ||
        '',
      eventsHandlerUrl: 
        (isVite ? import.meta.env.VITE_GUARDIAN_EVENTS_HANDLER_URL : null) ||
        process.env.GUARDIAN_EVENTS_HANDLER_URL || 
        process.env.VITE_GUARDIAN_EVENTS_HANDLER_URL ||
        ''
    };

    this.validateConfig();
  }

  static getInstance(): GuardianConfigService {
    if (!GuardianConfigService.instance) {
      GuardianConfigService.instance = new GuardianConfigService();
    }
    return GuardianConfigService.instance;
  }

  getConfig(): GuardianConfig {
    return { ...this.config };
  }

  isConfigured(): boolean {
    return !!(this.config.baseUrl && this.config.privateKey && this.config.apiKey);
  }

  updateConfig(updates: Partial<GuardianConfig>): void {
    this.config = { ...this.config, ...updates };
    this.validateConfig();
  }

  private validateConfig(): void {
    const required: (keyof GuardianConfig)[] = ['baseUrl', 'privateKey', 'apiKey'];
    const missing = required.filter(key => !this.config[key]);
    if (missing.length > 0) {
      console.warn(`Guardian configuration missing: ${missing.join(', ')}`);
      missing.forEach(key => {
        const envName = `VITE_GUARDIAN_${String(key).toUpperCase()}`;
        console.warn(`  - ${envName}`);
      });
    }
  }
}

export default GuardianConfigService;

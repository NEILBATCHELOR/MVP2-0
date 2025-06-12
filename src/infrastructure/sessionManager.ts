import { supabase } from '@/infrastructure/database/client';

export interface DeviceInfo {
  [key: string]: string | number;
  platform: string;
  language: string;
  screenSize: string;
  colorDepth: number;
  timezone: string;
}

export interface SessionInfo {
  sessionId: string;
  userId: string;
  createdAt: Date;
  lastActiveAt: Date;
}

class SessionManager {
  private static instance: SessionManager;
  private currentSessionId: string | null = null;
  private sessionUpdateInterval: NodeJS.Timeout | null = null;
  private readonly UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes

  private constructor() {
    // Initialize session from localStorage if exists
    this.currentSessionId = localStorage.getItem('sessionId');
    if (this.currentSessionId) {
      this.startSessionUpdateInterval();
    }
  }

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  private getDeviceInfo(): DeviceInfo {
    return {
      platform: navigator.platform,
      language: navigator.language,
      screenSize: `${window.screen.width}x${window.screen.height}`,
      colorDepth: window.screen.colorDepth,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }

  private startSessionUpdateInterval() {
    if (this.sessionUpdateInterval) {
      clearInterval(this.sessionUpdateInterval);
    }

    this.sessionUpdateInterval = setInterval(async () => {
      await this.updateLastActive();
    }, this.UPDATE_INTERVAL);
  }

  private async updateLastActive() {
    if (!this.currentSessionId) return;

    try {
      await supabase
        .from('user_sessions')
        .update({ last_active_at: new Date().toISOString() })
        .eq('session_id', this.currentSessionId);
    } catch (error) {
      console.error('Error updating session last_active_at:', error);
    }
  }

  public async createSession(userId: string): Promise<string | null> {
    try {
      const sessionId = crypto.randomUUID();
      const deviceInfo = this.getDeviceInfo();

      const { error } = await supabase
        .from('user_sessions')
        .insert({
          user_id: userId,
          session_id: sessionId,
          ip_address: 'web-client',
          user_agent: navigator.userAgent,
          device_info: deviceInfo
        });

      if (error) {
        console.error('Error creating session:', error);
        return null;
      }

      this.currentSessionId = sessionId;
      localStorage.setItem('sessionId', sessionId);
      this.startSessionUpdateInterval();

      return sessionId;
    } catch (error) {
      console.error('Error in createSession:', error);
      return null;
    }
  }

  public async endSession(): Promise<void> {
    if (!this.currentSessionId) return;

    try {
      await supabase
        .from('user_sessions')
        .update({ last_active_at: new Date().toISOString() })
        .eq('session_id', this.currentSessionId);

      if (this.sessionUpdateInterval) {
        clearInterval(this.sessionUpdateInterval);
        this.sessionUpdateInterval = null;
      }

      this.currentSessionId = null;
      localStorage.removeItem('sessionId');
    } catch (error) {
      console.error('Error ending session:', error);
    }
  }

  public async validateSession(): Promise<boolean> {
    if (!this.currentSessionId) return false;

    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('session_id', this.currentSessionId)
        .single();

      if (error || !data) {
        await this.endSession();
        return false;
      }

      // Check if session is still valid (e.g., not expired)
      const lastActiveAt = new Date(data.last_active_at);
      const now = new Date();
      const hoursSinceLastActive = (now.getTime() - lastActiveAt.getTime()) / (1000 * 60 * 60);

      // If session is inactive for more than 24 hours, end it
      if (hoursSinceLastActive > 24) {
        await this.endSession();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error validating session:', error);
      return false;
    }
  }

  public getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }

  public async clearAllSessions(): Promise<void> {
    try {
      // Delete all sessions from the database
      await supabase
        .from('user_sessions')
        .delete()
        .neq('session_id', 'dummy'); // Delete all records

      // Clear current session
      if (this.sessionUpdateInterval) {
        clearInterval(this.sessionUpdateInterval);
        this.sessionUpdateInterval = null;
      }

      this.currentSessionId = null;
      localStorage.removeItem('sessionId');
    } catch (error) {
      console.error('Error clearing all sessions:', error);
      throw error;
    }
  }
}

export const sessionManager = SessionManager.getInstance(); 
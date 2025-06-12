'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Settings, 
  Bell, 
  Mail, 
  MessageSquare, 
  CheckCircle, 
  Volume2,
  VolumeX
} from 'lucide-react';
import { cn } from '@/utils';

interface NotificationPreference {
  id: string;
  title: string;
  description: string;
  inApp: boolean;
  email: boolean;
  sms: boolean;
}

interface NotificationSettingsProps {
  className?: string;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  className
}) => {
  const [preferences, setPreferences] = useState<NotificationPreference[]>([
    {
      id: 'request_submitted',
      title: 'Request Submitted',
      description: 'When your redemption request is submitted',
      inApp: true,
      email: true,
      sms: false
    },
    {
      id: 'request_approved',
      title: 'Request Approved',
      description: 'When your redemption request is approved',
      inApp: true,
      email: true,
      sms: true
    },
    {
      id: 'request_rejected',
      title: 'Request Rejected',
      description: 'When your redemption request is rejected',
      inApp: true,
      email: true,
      sms: true
    },
    {
      id: 'settlement_complete',
      title: 'Settlement Complete',
      description: 'When your redemption settlement is complete',
      inApp: true,
      email: true,
      sms: true
    },
    {
      id: 'window_opening',
      title: 'Redemption Window Opening',
      description: 'For interval funds, when redemption windows open',
      inApp: true,
      email: true,
      sms: false
    },
    {
      id: 'window_closing',
      title: 'Redemption Window Closing',
      description: 'For interval funds, when redemption windows are about to close',
      inApp: true,
      email: true,
      sms: false
    }
  ]);

  const [globalSettings, setGlobalSettings] = useState({
    enableNotifications: true,
    enableSounds: true,
    quietHours: false,
    quietStart: '22:00',
    quietEnd: '08:00'
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const updatePreference = (id: string, channel: 'inApp' | 'email' | 'sms', value: boolean) => {
    setPreferences(prev => prev.map(pref => 
      pref.id === id ? { ...pref, [channel]: value } : pref
    ));
  };

  const updateGlobalSetting = (key: string, value: boolean | string) => {
    setGlobalSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Global Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Global Notification Settings
          </CardTitle>
          <CardDescription>
            Configure general notification preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enable-notifications">Enable Notifications</Label>
              <div className="text-sm text-muted-foreground">
                Turn off all notifications
              </div>
            </div>
            <Switch
              id="enable-notifications"
              checked={globalSettings.enableNotifications}
              onCheckedChange={(value) => updateGlobalSetting('enableNotifications', value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enable-sounds">Sound Notifications</Label>
              <div className="text-sm text-muted-foreground">
                Play sounds for important notifications
              </div>
            </div>
            <div className="flex items-center gap-2">
              {globalSettings.enableSounds ? (
                <Volume2 className="h-4 w-4 text-muted-foreground" />
              ) : (
                <VolumeX className="h-4 w-4 text-muted-foreground" />
              )}
              <Switch
                id="enable-sounds"
                checked={globalSettings.enableSounds}
                onCheckedChange={(value) => updateGlobalSetting('enableSounds', value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="quiet-hours">Quiet Hours</Label>
              <div className="text-sm text-muted-foreground">
                Disable notifications during specified hours
              </div>
            </div>
            <Switch
              id="quiet-hours"
              checked={globalSettings.quietHours}
              onCheckedChange={(value) => updateGlobalSetting('quietHours', value)}
            />
          </div>

          {globalSettings.quietHours && (
            <div className="pl-4 border-l-2 border-muted space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quiet-start">Quiet Start</Label>
                  <input
                    id="quiet-start"
                    type="time"
                    value={globalSettings.quietStart}
                    onChange={(e) => updateGlobalSetting('quietStart', e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md"
                  />
                </div>
                <div>
                  <Label htmlFor="quiet-end">Quiet End</Label>
                  <input
                    id="quiet-end"
                    type="time"
                    value={globalSettings.quietEnd}
                    onChange={(e) => updateGlobalSetting('quietEnd', e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md"
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event-Specific Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Event Notifications
          </CardTitle>
          <CardDescription>
            Choose how you want to be notified for different events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Header */}
            <div className="grid grid-cols-12 gap-4 items-center text-sm font-medium text-muted-foreground">
              <div className="col-span-6">Event</div>
              <div className="col-span-2 text-center">In-App</div>
              <div className="col-span-2 text-center">Email</div>
              <div className="col-span-2 text-center">SMS</div>
            </div>

            <Separator />

            {/* Preferences */}
            {preferences.map((pref, index) => (
              <div key={pref.id}>
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-6">
                    <div className="space-y-1">
                      <div className="font-medium">{pref.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {pref.description}
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-span-2 flex justify-center">
                    <Switch
                      checked={pref.inApp}
                      onCheckedChange={(value) => updatePreference(pref.id, 'inApp', value)}
                      disabled={!globalSettings.enableNotifications}
                    />
                  </div>
                  
                  <div className="col-span-2 flex justify-center">
                    <Switch
                      checked={pref.email}
                      onCheckedChange={(value) => updatePreference(pref.id, 'email', value)}
                      disabled={!globalSettings.enableNotifications}
                    />
                  </div>
                  
                  <div className="col-span-2 flex justify-center">
                    <Switch
                      checked={pref.sms}
                      onCheckedChange={(value) => updatePreference(pref.id, 'sms', value)}
                      disabled={!globalSettings.enableNotifications}
                    />
                  </div>
                </div>
                
                {index < preferences.length - 1 && <Separator className="mt-6" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Save Success */}
      {saved && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Notification settings saved successfully!
          </AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
        <Button 
          variant="outline" 
          onClick={() => {
            // Reset to defaults
            setGlobalSettings({
              enableNotifications: true,
              enableSounds: true,
              quietHours: false,
              quietStart: '22:00',
              quietEnd: '08:00'
            });
          }}
        >
          Reset to Defaults
        </Button>
      </div>
    </div>
  );
};

export default NotificationSettings;

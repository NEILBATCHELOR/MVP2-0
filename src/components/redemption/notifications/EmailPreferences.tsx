'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Mail, 
  Clock, 
  Calendar, 
  CheckCircle, 
  AlertCircle,
  Settings
} from 'lucide-react';
import { cn } from '@/utils';

interface EmailPreferencesProps {
  className?: string;
}

export const EmailPreferences: React.FC<EmailPreferencesProps> = ({
  className
}) => {
  const [emailSettings, setEmailSettings] = useState({
    primaryEmail: 'investor@example.com',
    backupEmail: '',
    enableEmails: true,
    immediateNotifications: true,
    dailyDigest: false,
    weeklyDigest: true,
    digestTime: '09:00',
    digestDay: 'monday'
  });

  const [emailTypes, setEmailTypes] = useState({
    statusUpdates: true,
    approvalNotifications: true,
    settlementConfirmations: true,
    windowReminders: true,
    securityAlerts: true,
    systemMaintenance: false,
    marketingUpdates: false,
    productAnnouncements: true
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testEmailSent, setTestEmailSent] = useState(false);

  const updateEmailSetting = (key: string, value: boolean | string) => {
    setEmailSettings(prev => ({ ...prev, [key]: value }));
  };

  const updateEmailType = (key: string, value: boolean) => {
    setEmailTypes(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save email preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  const sendTestEmail = async () => {
    try {
      // Simulate sending test email
      await new Promise(resolve => setTimeout(resolve, 500));
      setTestEmailSent(true);
      setTimeout(() => setTestEmailSent(false), 3000);
    } catch (error) {
      console.error('Failed to send test email:', error);
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Email Addresses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Addresses
          </CardTitle>
          <CardDescription>
            Manage your email addresses for notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="primary-email">Primary Email Address</Label>
            <Input
              id="primary-email"
              type="email"
              value={emailSettings.primaryEmail}
              onChange={(e) => updateEmailSetting('primaryEmail', e.target.value)}
              placeholder="your@email.com"
            />
            <p className="text-sm text-muted-foreground">
              This is your main email for all notifications
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="backup-email">Backup Email Address (Optional)</Label>
            <Input
              id="backup-email"
              type="email"
              value={emailSettings.backupEmail}
              onChange={(e) => updateEmailSetting('backupEmail', e.target.value)}
              placeholder="backup@email.com"
            />
            <p className="text-sm text-muted-foreground">
              Used for important notifications if primary email fails
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="space-y-0.5">
              <Label>Enable Email Notifications</Label>
              <div className="text-sm text-muted-foreground">
                Turn off all email notifications
              </div>
            </div>
            <Switch
              checked={emailSettings.enableEmails}
              onCheckedChange={(value) => updateEmailSetting('enableEmails', value)}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={sendTestEmail}
              disabled={!emailSettings.enableEmails}
            >
              Send Test Email
            </Button>
            {testEmailSent && (
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <CheckCircle className="h-4 w-4" />
                Test email sent!
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Email Delivery Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Delivery Preferences
          </CardTitle>
          <CardDescription>
            Choose how you want to receive email notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Immediate Notifications</Label>
              <div className="text-sm text-muted-foreground">
                Send emails immediately when events occur
              </div>
            </div>
            <Switch
              checked={emailSettings.immediateNotifications}
              onCheckedChange={(value) => updateEmailSetting('immediateNotifications', value)}
              disabled={!emailSettings.enableEmails}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Daily Digest</Label>
              <div className="text-sm text-muted-foreground">
                Receive a daily summary of all notifications
              </div>
            </div>
            <Switch
              checked={emailSettings.dailyDigest}
              onCheckedChange={(value) => updateEmailSetting('dailyDigest', value)}
              disabled={!emailSettings.enableEmails}
            />
          </div>

          {emailSettings.dailyDigest && (
            <div className="pl-4 border-l-2 border-muted">
              <div className="space-y-2">
                <Label htmlFor="digest-time">Digest Time</Label>
                <input
                  id="digest-time"
                  type="time"
                  value={emailSettings.digestTime}
                  onChange={(e) => updateEmailSetting('digestTime', e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Weekly Digest</Label>
              <div className="text-sm text-muted-foreground">
                Receive a weekly summary every Monday
              </div>
            </div>
            <Switch
              checked={emailSettings.weeklyDigest}
              onCheckedChange={(value) => updateEmailSetting('weeklyDigest', value)}
              disabled={!emailSettings.enableEmails}
            />
          </div>
        </CardContent>
      </Card>

      {/* Email Types */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Email Types
          </CardTitle>
          <CardDescription>
            Choose which types of emails you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Transactional Emails */}
            <div>
              <h4 className="font-medium mb-4 text-green-700">Transactional (Cannot be disabled)</h4>
              <div className="space-y-4 opacity-60">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Status Updates</Label>
                    <div className="text-sm text-muted-foreground">
                      Updates on your redemption request status
                    </div>
                  </div>
                  <Switch checked={true} disabled />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Approval Notifications</Label>
                    <div className="text-sm text-muted-foreground">
                      When your requests are approved or rejected
                    </div>
                  </div>
                  <Switch checked={true} disabled />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Settlement Confirmations</Label>
                    <div className="text-sm text-muted-foreground">
                      Confirmations of completed settlements
                    </div>
                  </div>
                  <Switch checked={true} disabled />
                </div>
              </div>
            </div>

            <Separator />

            {/* Optional Emails */}
            <div>
              <h4 className="font-medium mb-4">Optional</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Window Reminders</Label>
                    <div className="text-sm text-muted-foreground">
                      Reminders about redemption window openings/closings
                    </div>
                  </div>
                  <Switch
                    checked={emailTypes.windowReminders}
                    onCheckedChange={(value) => updateEmailType('windowReminders', value)}
                    disabled={!emailSettings.enableEmails}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Security Alerts</Label>
                    <div className="text-sm text-muted-foreground">
                      Important security-related notifications
                    </div>
                  </div>
                  <Switch
                    checked={emailTypes.securityAlerts}
                    onCheckedChange={(value) => updateEmailType('securityAlerts', value)}
                    disabled={!emailSettings.enableEmails}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>System Maintenance</Label>
                    <div className="text-sm text-muted-foreground">
                      Scheduled maintenance and downtime notifications
                    </div>
                  </div>
                  <Switch
                    checked={emailTypes.systemMaintenance}
                    onCheckedChange={(value) => updateEmailType('systemMaintenance', value)}
                    disabled={!emailSettings.enableEmails}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Product Announcements</Label>
                    <div className="text-sm text-muted-foreground">
                      New features and product updates
                    </div>
                  </div>
                  <Switch
                    checked={emailTypes.productAnnouncements}
                    onCheckedChange={(value) => updateEmailType('productAnnouncements', value)}
                    disabled={!emailSettings.enableEmails}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Marketing Updates</Label>
                    <div className="text-sm text-muted-foreground">
                      Promotional emails and newsletters
                    </div>
                  </div>
                  <Switch
                    checked={emailTypes.marketingUpdates}
                    onCheckedChange={(value) => updateEmailType('marketingUpdates', value)}
                    disabled={!emailSettings.enableEmails}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Success */}
      {saved && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Email preferences saved successfully!
          </AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Preferences'}
        </Button>
        <Button 
          variant="outline" 
          onClick={() => {
            // Reset to defaults
            setEmailSettings({
              primaryEmail: 'investor@example.com',
              backupEmail: '',
              enableEmails: true,
              immediateNotifications: true,
              dailyDigest: false,
              weeklyDigest: true,
              digestTime: '09:00',
              digestDay: 'monday'
            });
            setEmailTypes({
              statusUpdates: true,
              approvalNotifications: true,
              settlementConfirmations: true,
              windowReminders: true,
              securityAlerts: true,
              systemMaintenance: false,
              marketingUpdates: false,
              productAnnouncements: true
            });
          }}
        >
          Reset to Defaults
        </Button>
      </div>
    </div>
  );
};

export default EmailPreferences;

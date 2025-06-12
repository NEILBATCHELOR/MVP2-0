/**
 * Security Settings Page
 * 
 * Page for managing account security settings including TOTP/2FA
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Key, Smartphone, Settings } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { TOTPManagement, TOTPSetupForm } from '@/components/auth/components';

export const SecuritySettingsPage: React.FC = () => {
  const [showTOTPSetup, setShowTOTPSetup] = useState(false);
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/dashboard');
  };

  const handleSetupTOTP = () => {
    setShowTOTPSetup(true);
  };

  const handleTOTPSetupSuccess = () => {
    setShowTOTPSetup(false);
  };

  const handleTOTPSetupCancel = () => {
    setShowTOTPSetup(false);
  };

  if (showTOTPSetup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <Button
              variant="ghost"
              onClick={handleTOTPSetupCancel}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Security
            </Button>
            
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold">Set Up Authenticator</h1>
            </div>
            
            <div className="w-32" />
          </div>

          <div className="max-w-lg mx-auto">
            <TOTPSetupForm
              onSuccess={handleTOTPSetupSuccess}
              onCancel={handleTOTPSetupCancel}
              showHeader={true}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">Security Settings</h1>
          </div>
          
          <div className="w-40" /> {/* Spacer for centering */}
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="2fa" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="2fa" className="flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                Two-Factor Auth
              </TabsTrigger>
              <TabsTrigger value="password" className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                Password
              </TabsTrigger>
              <TabsTrigger value="sessions" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Sessions
              </TabsTrigger>
            </TabsList>

            {/* Two-Factor Authentication Tab */}
            <TabsContent value="2fa" className="space-y-6">
              <TOTPManagement onSetupNew={handleSetupTOTP} />
            </TabsContent>

            {/* Password Management Tab */}
            <TabsContent value="password" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="w-5 h-5" />
                    Password Settings
                  </CardTitle>
                  <CardDescription>
                    Manage your account password and security preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Change Password</h4>
                        <p className="text-sm text-muted-foreground">
                          Update your account password
                        </p>
                      </div>
                      <Button variant="outline">
                        Change Password
                      </Button>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h4 className="font-medium">Password Requirements</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• At least 8 characters long</li>
                        <li>• Contains uppercase and lowercase letters</li>
                        <li>• Contains at least one number</li>
                        <li>• Contains at least one special character</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Password Reset Options</CardTitle>
                  <CardDescription>
                    Configure how you can recover your account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Email Recovery</h4>
                        <p className="text-sm text-muted-foreground">
                          Receive password reset links via email
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Configure
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Session Management Tab */}
            <TabsContent value="sessions" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Active Sessions
                  </CardTitle>
                  <CardDescription>
                    Manage your active login sessions across devices
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Current Session</h4>
                        <p className="text-sm text-muted-foreground">
                          This device • Active now
                        </p>
                      </div>
                      <Button variant="outline" size="sm" disabled>
                        Current
                      </Button>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h4 className="font-medium">Session Settings</h4>
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h5 className="font-medium">Sign Out All Other Sessions</h5>
                          <p className="text-sm text-muted-foreground">
                            This will sign you out on all other devices
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          Sign Out Others
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Security Notifications</CardTitle>
                  <CardDescription>
                    Get notified about important security events
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Login Notifications</h4>
                        <p className="text-sm text-muted-foreground">
                          Get notified when someone signs into your account
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Configure
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default SecuritySettingsPage;

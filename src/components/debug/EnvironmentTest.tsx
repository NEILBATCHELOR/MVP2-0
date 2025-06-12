import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/**
 * Environment Variables Debug Component
 * Helps debug whether VITE_ prefixed environment variables are loaded correctly
 */
export function EnvironmentTest() {
  const guardianVars = {
    VITE_GUARDIAN_API_BASE_URL: import.meta.env.VITE_GUARDIAN_API_BASE_URL,
    VITE_GUARDIAN_PRIVATE_KEY: import.meta.env.VITE_GUARDIAN_PRIVATE_KEY,
    VITE_GUARDIAN_PUBLIC_KEY: import.meta.env.VITE_GUARDIAN_PUBLIC_KEY,
    VITE_GUARDIAN_API_KEY: import.meta.env.VITE_GUARDIAN_API_KEY,
    VITE_GUARDIAN_DEFAULT_WEBHOOK_URL: import.meta.env.VITE_GUARDIAN_DEFAULT_WEBHOOK_URL,
    VITE_GUARDIAN_WEBHOOK_AUTH_KEY: import.meta.env.VITE_GUARDIAN_WEBHOOK_AUTH_KEY,
    VITE_GUARDIAN_EVENTS_HANDLER_URL: import.meta.env.VITE_GUARDIAN_EVENTS_HANDLER_URL
  };

  const allViteVars = Object.keys(import.meta.env).filter(key => key.startsWith('VITE_GUARDIAN'));

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>🔍 Environment Variables Debug</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold mb-2">Guardian Environment Variables:</h3>
          <div className="space-y-2">
            {Object.entries(guardianVars).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between p-2 border rounded">
                <code className="text-sm">{key}</code>
                <Badge variant={value ? 'default' : 'destructive'}>
                  {value ? 'SET' : 'NOT SET'}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">All VITE_GUARDIAN_* Variables Found:</h3>
          <div className="bg-gray-50 p-3 rounded text-sm">
            {allViteVars.length > 0 ? (
              <ul className="space-y-1">
                {allViteVars.map(key => (
                  <li key={key}>• {key}</li>
                ))}
              </ul>
            ) : (
              <span className="text-red-600">No VITE_GUARDIAN_* variables found</span>
            )}
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Sample Variable Values (truncated):</h3>
          <div className="space-y-1 text-sm">
            <div>Base URL: {guardianVars.VITE_GUARDIAN_API_BASE_URL || 'NOT SET'}</div>
            <div>Private Key: {guardianVars.VITE_GUARDIAN_PRIVATE_KEY ? `${guardianVars.VITE_GUARDIAN_PRIVATE_KEY.substring(0, 10)}...` : 'NOT SET'}</div>
            <div>API Key: {guardianVars.VITE_GUARDIAN_API_KEY ? `${guardianVars.VITE_GUARDIAN_API_KEY.substring(0, 10)}...` : 'NOT SET'}</div>
          </div>
        </div>

        <div className="p-3 bg-blue-50 rounded">
          <p className="text-sm text-blue-700">
            <strong>Note:</strong> Environment variables must be prefixed with <code>VITE_</code> to be accessible in Vite frontend applications.
            Make sure your .env file contains the VITE_GUARDIAN_* variables and restart the dev server if you just added them.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default EnvironmentTest;

/**
 * Password Reset Page
 * 
 * Handles both password reset request and password update
 */

import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams } from 'react-router-dom';
import { GuestGuard } from '@/components/auth/ProtectedRoute';
import { PasswordResetForm } from '@/components/auth/components';

const PasswordResetPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  
  // Check if this is a password update (has token) or reset request
  const hasToken = searchParams.get('token') || searchParams.get('access_token');
  const mode = hasToken ? 'update' : 'request';

  return (
    <GuestGuard>
      <Helmet>
        <title>
          {mode === 'update' ? 'Update Password' : 'Reset Password'} - Chain Capital
        </title>
        <meta 
          name="description" 
          content={
            mode === 'update' 
              ? 'Set your new password' 
              : 'Reset your Chain Capital account password'
          } 
        />
      </Helmet>
      
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 px-4 py-12">
        <div className="w-full max-w-md">
          <PasswordResetForm 
            mode={mode}
            showHeader={true}
          />
        </div>
      </div>
    </GuestGuard>
  );
};

export default PasswordResetPage;

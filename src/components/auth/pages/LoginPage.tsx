/**
 * Login Page
 * 
 * Login page with guest guard protection
 */

import React from 'react';
import { Helmet } from 'react-helmet-async';
import { GuestGuard } from '@/components/auth/ProtectedRoute';
import { LoginForm } from '@/components/auth/components';

const LoginPage: React.FC = () => {
  return (
    <GuestGuard>
      <Helmet>
        <title>Sign In - Chain Capital</title>
        <meta name="description" content="Sign in to your Chain Capital account" />
      </Helmet>
      
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 px-4 py-12">
        <div className="w-full max-w-md">
          <LoginForm 
            showHeader={true}
            showAlternativeAuth={true}
          />
        </div>
      </div>
    </GuestGuard>
  );
};

export default LoginPage;

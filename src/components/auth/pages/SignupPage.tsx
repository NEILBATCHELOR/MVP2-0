/**
 * Signup Page
 * 
 * User registration page with guest guard protection
 */

import React from 'react';
import { Helmet } from 'react-helmet-async';
import { GuestGuard } from '@/components/auth/ProtectedRoute';
import { SignupForm } from '@/components/auth/components';

const SignupPage: React.FC = () => {
  return (
    <GuestGuard>
      <Helmet>
        <title>Create Account - Chain Capital</title>
        <meta name="description" content="Create your Chain Capital account and start investing" />
      </Helmet>
      
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 px-4 py-12">
        <div className="w-full max-w-md">
          <SignupForm 
            showHeader={true}
          />
        </div>
      </div>
    </GuestGuard>
  );
};

export default SignupPage;

/**
 * Magic Link Page
 * 
 * Passwordless authentication via email magic links
 */

import React from 'react';
import { Helmet } from 'react-helmet-async';
import { GuestGuard } from '@/components/auth/ProtectedRoute';
import { MagicLinkForm } from '@/components/auth/components';

const MagicLinkPage: React.FC = () => {
  return (
    <GuestGuard>
      <Helmet>
        <title>Magic Link Sign In - Chain Capital</title>
        <meta name="description" content="Sign in to Chain Capital with a magic link - no password required" />
      </Helmet>
      
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 px-4 py-12">
        <div className="w-full max-w-md">
          <MagicLinkForm 
            showHeader={true}
            allowResend={true}
          />
        </div>
      </div>
    </GuestGuard>
  );
};

export default MagicLinkPage;

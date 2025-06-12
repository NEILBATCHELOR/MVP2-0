/**
 * Conditional AppKit Provider
 * Disables WalletConnect/AppKit for Guardian-only routes to prevent unnecessary initialization errors
 */

import React, { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import AppKitProvider from './AppKitProvider';

interface ConditionalAppKitProviderProps {
  children: ReactNode;
}

// Routes that should NOT initialize WalletConnect/AppKit
const GUARDIAN_ONLY_ROUTES = [
  '/wallet/demo',
  '/wallet/guardian'
];

export function ConditionalAppKitProvider({ children }: ConditionalAppKitProviderProps) {
  const location = useLocation();
  
  // Check if current route is Guardian-only
  const isGuardianOnlyRoute = GUARDIAN_ONLY_ROUTES.some(route => 
    location.pathname.startsWith(route)
  );

  // For Guardian-only routes, skip AppKit initialization
  if (isGuardianOnlyRoute) {
    console.log('Guardian-only route detected, skipping WalletConnect initialization');
    return <>{children}</>;
  }

  // For all other routes, use normal AppKit provider
  return <AppKitProvider>{children}</AppKitProvider>;
}

export default ConditionalAppKitProvider;

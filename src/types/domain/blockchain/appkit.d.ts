/**
 * Global TypeScript declarations for Reown AppKit
 * 
 * This file ensures TypeScript recognizes the AppKit web components
 */

import 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      /**
       * The AppKit button web component. Registered globally by AppKit.
       */
      'appkit-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      
      /**
       * The AppKit network button web component.
       */
      'appkit-network-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      
      /**
       * The AppKit account button web component.
       */
      'appkit-account-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}

// Ensures file is treated as a module
export {};

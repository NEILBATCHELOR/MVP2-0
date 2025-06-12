/**
 * Higher-Order Component for Token Configuration Mode
 * 
 * This HOC wraps token edit forms and provides configuration mode handling,
 * ensuring the right fields from min/max configurations are used.
 */
import React, { useState, useEffect } from 'react';
import { TokenStandard } from '@/types/core/centralModels';
import { StorageConfigMode } from './configModeUtils';
import { shouldUseAdvancedConfig } from './configModeUtils';
import { getFieldDefinitions, getDefaultValues } from './configComponentLoader';

// Props that the HOC expects
interface WithConfigModeProps {
  token: any;
  onSave: (token: any) => void;
  [key: string]: any;
}

/**
 * Higher-order component that adds configuration mode handling to token edit forms
 * @param WrappedComponent The component to wrap
 * @returns A new component with configuration mode handling
 */
export function withConfigMode<P extends WithConfigModeProps>(
  WrappedComponent: React.ComponentType<P>
) {
  return function WithConfigMode(props: P) {
    const { token } = props;
    const tokenStandard = token?.standard as TokenStandard;
    
    // Determine if we should use advanced config based on token properties
    const [useAdvancedConfig, setUseAdvancedConfig] = useState(false);
    const [configMode, setConfigMode] = useState<'min' | 'max'>('min');
    
    useEffect(() => {
      if (token) {
        // Check if token has advanced properties or explicit config_mode
        const shouldUseAdvanced = shouldUseAdvancedConfig(token);
        const storageMode = token.config_mode === 'max' || shouldUseAdvanced ? 'max' : 'min';
        
        setUseAdvancedConfig(shouldUseAdvanced || token.config_mode === 'max');
        setConfigMode(storageMode);
        
        console.log(`Using ${storageMode} configuration for ${token.standard} token`);
      }
    }, [token]);
    
    // Get field definitions for the current token standard and config mode
    const fieldDefinitions = tokenStandard 
      ? getFieldDefinitions(tokenStandard, configMode)
      : [];
      
    // Get default values for the current token standard and config mode
    const defaultValues = tokenStandard
      ? getDefaultValues(tokenStandard, configMode)
      : {};
    
    // Merge props with configuration-related props
    const enhancedProps = {
      ...props,
      useAdvancedConfig,
      configMode,
      fieldDefinitions,
      defaultValues
    };
    
    return <WrappedComponent {...enhancedProps as P} />;
  };
}

export default withConfigMode;
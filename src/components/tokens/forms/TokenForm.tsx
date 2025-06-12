import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { TokenStandard, TokenConfigMode } from '@/types/core/centralModels';
import { useParams, useNavigate } from 'react-router-dom';
import { createToken, updateToken, getToken } from '@/components/tokens/services/tokenService';
import { 
  EnhancedERC1400Service
} from '@/components/tokens/services/enhancedERC1400Service';

// Import FinancialProductCategory from the AssetTypeSelector
import { FinancialProductCategory } from '@/components/tokens/components/AssetTypeSelector';

// Config mode components
import ConfigModeToggle, { ConfigMode } from '@/components/tokens/components/ConfigModeToggle';
import StandardSelector from '@/components/tokens/components/StandardSelector';
import TokenMetadataEditor from '@/components/tokens/components/TokenMetadataEditor';

// Import token configurations
import ERC20MinConfig from '@/components/tokens/config/min/ERC20Config';
import ERC721MinConfig from '@/components/tokens/config/min/ERC721Config';
import ERC1155MinConfig from '@/components/tokens/config/min/ERC1155Config';
import ERC1400MinConfig from '@/components/tokens/config/min/ERC1400Config';
import ERC3525MinConfig from '@/components/tokens/config/min/ERC3525Config';
import ERC4626MinConfig from '@/components/tokens/config/min/ERC4626Config';

import ERC20MaxConfig from '@/components/tokens/config/max/ERC20Config';
import ERC721MaxConfig from '@/components/tokens/config/max/ERC721Config';
import ERC1155MaxConfig from '@/components/tokens/config/max/ERC1155Config';
import ERC1400MaxConfig from '@/components/tokens/config/max/ERC1400Config';
import ERC3525MaxConfig from '@/components/tokens/config/max/ERC3525Config';
import ERC4626MaxConfig from '@/components/tokens/config/max/ERC4626Config';

// Import token edit forms
import ERC20EditForm from '@/components/tokens/forms/ERC20EditForm';
import ERC721EditForm from '@/components/tokens/forms/ERC721EditForm';
import ERC1155EditForm from '@/components/tokens/forms/ERC1155EditForm';
import ERC1400EditForm from '@/components/tokens/forms/ERC1400EditForm';
import ERC3525EditForm from '@/components/tokens/forms/ERC3525EditForm';
import ERC4626EditForm from '@/components/tokens/forms/ERC4626EditForm';

// Initial token data
const initialTokenData = {
  name: '',
  symbol: '',
  description: '',
  decimals: 18,
  standard: TokenStandard.ERC20,
  blocks: {},
  metadata: {},
};

interface TokenFormProps {
  projectId: string;
  onSuccess?: (tokenId: string) => void;
  isEditing?: boolean;
  tokenData?: any;
  standard?: TokenStandard;
  configMode?: ConfigMode;
  onChange?: (updates: Record<string, any>) => void;
  errors?: string[];
  assetType?: string;
  validationPaused?: boolean;
}

type TokenFormData = typeof initialTokenData;

const TokenForm: React.FC<TokenFormProps> = ({ 
  projectId, 
  onSuccess, 
  isEditing = false, 
  tokenData: externalTokenData,
  standard: externalStandard,
  configMode: externalConfigMode,
  onChange: externalOnChange,
  errors: externalErrors,
  assetType,
  validationPaused = false
}) => {
  const { tokenId } = useParams<{ tokenId: string }>();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [tokenForm, setTokenForm] = useState<TokenFormData>({
    ...initialTokenData,
    standard: externalStandard || TokenStandard.ERC20,
    // Apply external token data if provided
    ...(externalTokenData || {})
  });
  
  const [configMode, setConfigMode] = useState<ConfigMode>(
    externalConfigMode || 'min'
  );
  
  // If external errors are provided, use them for validation display
  useEffect(() => {
    if (externalErrors && externalErrors.length > 0) {
      setValidationErrors(externalErrors);
    }
  }, [externalErrors]);
  
  // Initial data loading for edit mode
  useEffect(() => {
    const loadTokenData = async () => {
      if (isEditing && tokenId && !externalTokenData) {
        setIsLoading(true);
        setError(null);
        
        try {
          const tokenData = await getToken(tokenId);
          
          if (tokenData) {
            // Transform token data for form
            const formData = {
              ...initialTokenData,
              ...tokenData,
              // Handle nested properties from token data
            };
            
            setTokenForm(formData as TokenFormData);
            
            // Set advanced mode based on token data
            const mode = tokenData.config_mode === 'max' || tokenData.config_mode === 'advanced'
              ? 'max'
              : 'min';
            
            setConfigMode(mode);
          } else {
            setError('Token not found');
          }
        } catch (err: any) {
          setError(`Error loading token: ${err.message}`);
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    loadTokenData();
  }, [isEditing, tokenId, externalTokenData]);
  
  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    // Validate form
    const errors = validateForm(tokenForm);
    
    if (errors.length > 0) {
      setValidationErrors(errors);
      setIsLoading(false);
      return;
    }
    
    try {
      // Add project ID to token data
      const tokenWithProject = {
        ...tokenForm,
        project_id: projectId
      };
      
      let result;
      
      if (isEditing && tokenId) {
        result = await updateToken(tokenId, tokenWithProject);
      } else {
        result = await createToken(projectId, tokenWithProject);
      }
      
      // Call success callback if provided
      if (onSuccess && result.id) {
        onSuccess(result.id);
      } else {
        // Navigate to token detail page
        navigate(`/projects/${projectId}/tokens/${result.id}`);
      }
    } catch (err: any) {
      setError(`Failed to ${isEditing ? 'update' : 'create'} token: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Input change handler
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    let newValue: any = value;
    
    // Convert number inputs to actual numbers
    if (type === 'number') {
      newValue = value === '' ? '' : Number(value);
    }
    
    setTokenForm(prev => ({
      ...prev,
      [name]: newValue
    }));
    
    // Call external onChange if provided
    if (externalOnChange) {
      externalOnChange({ [name]: newValue });
    }
  };

  const handleMetadataChange = (metadata: Record<string, any>) => {
    setTokenForm(prev => ({
      ...prev,
      metadata
    }));
  };

  // Handle config changes from configuration components
  const handleConfigChange = (config: Record<string, any>) => {
    // Update token form with new configuration
    setTokenForm(prev => ({
      ...prev,
      ...config
    }));
    
    // Notify parent component if callback provided
    if (externalOnChange) {
      externalOnChange(config);
    }
  };

  const handleStandardChange = (standard: TokenStandard) => {
    // Reset blocks when changing standards to avoid mismatched data
    setTokenForm((prev) => ({ 
      ...prev, 
      standard,
      blocks: {} 
    }));
  };

  const handleConfigModeChange = (mode: ConfigMode) => {
    setConfigMode(mode);
  };

  const validateForm = (data: TokenFormData): string[] => {
    // Skip validation if validation is paused
    if (validationPaused) return [];
    
    const errors: string[] = [];
    
    // Basic validation
    if (!data.name) errors.push('Token name is required');
    if (!data.symbol) errors.push('Token symbol is required');
    
    // Standard-specific validation
    if (data.standard === TokenStandard.ERC20 && typeof data.decimals !== 'number') {
      errors.push('Decimals must be a number for ERC-20 tokens');
    }
    
    return errors;
  };
  
  const renderErrors = () => {
    if (error || validationErrors.length > 0) {
      return (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error && <div>{error}</div>}
            {validationErrors.length > 0 && (
              <ul className="list-disc pl-5 mt-2">
                {validationErrors.map((err, index) => (
                  <li key={index}>{err}</li>
                ))}
              </ul>
            )}
          </AlertDescription>
        </Alert>
      );
    }
    
    return null;
  };

  // Generic function to handle token save operations
  const handleTokenSave = async (data: any) => {
    if (!tokenId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Update the token with the provided data
      const result = await updateToken(tokenId, data);
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess(tokenId);
      } else {
        // Navigate to token detail page
        navigate(`/projects/${projectId}/tokens/${tokenId}`);
      }
      
      return result;
    } catch (err: any) {
      setError(`Failed to update token: ${err.message}`);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle ERC20 token form submission
  const handleERC20Save = async (data: any) => {
    await handleTokenSave(data);
  };

  // Handle ERC721 token form submission
  const handleERC721Save = async (data: any) => {
    await handleTokenSave(data);
  };

  // Handle ERC1155 token form submission
  const handleERC1155Save = async (data: any) => {
    await handleTokenSave(data);
  };

  // Handle ERC3525 token form submission
  const handleERC3525Save = async (data: any) => {
    await handleTokenSave(data);
  };

  // Handle ERC4626 token form submission
  const handleERC4626Save = async (data: any) => {
    await handleTokenSave(data);
  };
  
  // Handle ERC1400 token form submission
  const handleERC1400Save = async (data: any) => {
    if (!tokenId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Use the enhanced ERC1400 service
      const erc1400Service = new EnhancedERC1400Service();
      
      // Update the token with properties using enhanced service
      const result = await erc1400Service.updateTokenWithProperties(
        tokenId, 
        {
          name: data.name,
          symbol: data.symbol,
          decimals: data.decimals,
          metadata: data.metadata,
          blocks: data.blocks
        },
        data.standardProperties || {}
      );
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update token');
      }
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess(tokenId);
      } else {
        // Navigate to token detail page
        navigate(`/projects/${projectId}/tokens/${tokenId}`);
      }
      
      return; // Return void instead of tokenId
    } catch (err: any) {
      setError(`Failed to update ERC1400 token: ${err.message}`);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Render appropriate configuration component based on standard and mode
  const renderConfigComponent = () => {
    const { standard } = tokenForm;
    
    // Common props to pass to all config components
    const configProps = {
      tokenForm,
      handleInputChange,
      setTokenForm,
      onConfigChange: handleConfigChange,
      validationPaused // Pass validation paused state to prevent flickering
    };
    
    if (configMode === 'min') {
      // Basic configuration components
      switch (standard) {
        case TokenStandard.ERC20:
          return <ERC20MinConfig {...configProps} />;
        case TokenStandard.ERC721:
          return <ERC721MinConfig {...configProps} />;
        case TokenStandard.ERC1155:
          return <ERC1155MinConfig {...configProps} />;
        case TokenStandard.ERC1400:
          return <ERC1400MinConfig {...configProps} />;
        case TokenStandard.ERC3525:
          return <ERC3525MinConfig {...configProps} />;
        case TokenStandard.ERC4626:
          return <ERC4626MinConfig {...configProps} />;
        default:
          return <div>Basic configuration not available for {standard}</div>;
      }
    } else {
      // Advanced configuration components
      switch (standard) {
        case TokenStandard.ERC20:
          return <ERC20MaxConfig {...configProps} />;
        case TokenStandard.ERC721:
          return <ERC721MaxConfig {...configProps} />;
        case TokenStandard.ERC1155:
          return <ERC1155MaxConfig {...configProps} />;
        case TokenStandard.ERC1400:
          return <ERC1400MaxConfig {...configProps} />;
        case TokenStandard.ERC3525:
          return <ERC3525MaxConfig {...configProps} />;
        case TokenStandard.ERC4626:
          return <ERC4626MaxConfig {...configProps} />;
        default:
          return <div>Advanced configuration not available for {standard}</div>;
      }
    }
  };
  
  // Render forms for direct editing of token properties
  const renderEditForms = () => {
    const { standard } = tokenForm;
    
    // Cast tokenForm to EnhancedTokenData with required properties
    const enhancedToken = {
      ...tokenForm,
      id: tokenId || 'temp-id',
      status: 'draft',
      projectId,
      configMode
    } as any; // Cast as any to avoid type issues
    
    // Convert string configMode to TokenConfigMode enum
    const tokenConfigMode = configMode === 'max' ? TokenConfigMode.MAX : TokenConfigMode.MIN;
    
    // Properties to pass to all edit forms
    const formProps = {
      token: enhancedToken,
      validationPaused,
      configMode: tokenConfigMode,
      useAdvancedConfig: configMode === 'max',
    };
    
    // Render the appropriate edit form component based on token standard
    switch (standard) {
      case TokenStandard.ERC20:
        return <ERC20EditForm {...formProps} onSave={handleERC20Save} />;
      case TokenStandard.ERC721:
        return <ERC721EditForm {...formProps} onSave={handleERC721Save} />;
      case TokenStandard.ERC1155:
        return <ERC1155EditForm {...formProps} onSave={handleERC1155Save} />;
      case TokenStandard.ERC1400:
        return <ERC1400EditForm {...formProps} onSave={handleERC1400Save} />;
      case TokenStandard.ERC3525:
        return <ERC3525EditForm {...formProps} onSave={handleERC3525Save} />;
      case TokenStandard.ERC4626:
        return <ERC4626EditForm 
          token={enhancedToken} 
          projectId={projectId} 
          onSubmit={handleERC4626Save} 
          onSave={handleERC4626Save} 
          configMode={tokenConfigMode}
          failedFields={[]}
        />;
      default:
        return <div>Edit form not available for {standard}</div>;
    }
  };
  
  // If direct editing is requested, render the standard-specific edit form
  if (externalOnChange && externalTokenData) {
    return renderEditForms();
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{isEditing ? 'Edit Token' : 'Create New Token'}</CardTitle>
            <CardDescription>
              {isEditing 
                ? 'Update the properties of your existing token'
                : 'Define the basic properties of your token'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {renderErrors()}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Token Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="My Token"
                    value={tokenForm.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="symbol">Token Symbol</Label>
                  <Input
                    id="symbol"
                    name="symbol"
                    placeholder="TKN"
                    value={tokenForm.symbol}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe your token"
                  value={tokenForm.description}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <StandardSelector
                  selectedStandard={tokenForm.standard}
                  onStandardChange={handleStandardChange}
                  disabled={isEditing} // Don't allow changing standard when editing
                />
                
                <div className="space-y-2">
                  <Label htmlFor="decimals">Decimals</Label>
                  <Input
                    id="decimals"
                    name="decimals"
                    type="number"
                    min="0"
                    max="18"
                    value={tokenForm.decimals}
                    onChange={handleInputChange}
                    required
                    disabled={[TokenStandard.ERC721, TokenStandard.ERC1155].includes(tokenForm.standard)}
                  />
                </div>
              </div>

              <ConfigModeToggle
                mode={configMode}
                onChange={handleConfigModeChange}
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Render standard-specific configuration */}
          {renderConfigComponent()}
          
          {/* Token Metadata Editor */}
          <TokenMetadataEditor
            metadata={tokenForm.metadata || {}}
            onChange={handleMetadataChange}
          />
        </div>

        <Card>
          <CardFooter className="flex justify-between pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : isEditing ? 'Update Token' : 'Create Token'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </form>
  );
};

export default TokenForm;
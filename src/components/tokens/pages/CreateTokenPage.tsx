/**
 * CreateTokenPage
 * 
 * A comprehensive page for creating new tokens with validation and feedback.
 * Supports all token standards and configuration modes.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, ArrowRight, ArrowLeft, FileText, Download, Upload, Save, Info, CheckCircle, PlusCircle, Eye, RefreshCw, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import AssetTypeSelector, { FinancialProductCategory } from '@/components/tokens/components/AssetTypeSelector';
import StandardRecommender from '@/components/tokens/components/StandardRecommender';
import TokenStandardSelector from '@/components/tokens/components/TokenStandardSelector';
import { createToken } from '@/components/tokens/services/tokenService';
import TokenForm from '@/components/tokens/forms/TokenForm';
import AssetTypeConfigAdapter from '@/components/tokens/components/AssetTypeConfigAdapter';
import TokenNavigation from '@/components/tokens/components/TokenNavigation';
import TokenPageLayout from '../layout/TokenPageLayout';
import { TokenStandard, TokenStatus } from '@/types/core/centralModels';
import { Stepper } from '@/components/ui/stepper';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { TokenFormData } from '@/components/tokens/types';
import ValidationErrorDisplay from '@/components/tokens/components/ValidationErrorDisplay';
import { uiModeToStorageMode, UIConfigMode, StorageConfigMode } from '@/components/tokens/utils/configModeUtils';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ToastAction
} from "@/components/ui/toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

// Import validation services
import { validateTokenData } from '@/components/tokens/services/tokenDataValidation';
// ProductSelector import removed
import { validateFoundryConfig, mapTokenToFoundryConfig, tokenStandardToFoundryType } from '@/components/tokens/utils/foundryConfigMapper';
import enhancedTokenDeploymentService from '@/components/tokens/services/tokenDeploymentService';
import TokenSecurityValidator from '@/components/tokens/components/TokenSecurityValidator';

// Import configuration components
import ERC20SimpleConfig from '@/components/tokens/config/min/ERC20Config';
import ERC721SimpleConfig from '@/components/tokens/config/min/ERC721Config';
import ERC1155SimpleConfig from '@/components/tokens/config/min/ERC1155Config';
import ERC1400SimpleConfig from '@/components/tokens/config/min/ERC1400Config';
import ERC3525SimpleConfig from '@/components/tokens/config/min/ERC3525Config';
import ERC4626SimpleConfig from '@/components/tokens/config/min/ERC4626Config';

import ERC20DetailedConfig from '@/components/tokens/config/max/ERC20Config';
import ERC721DetailedConfig from '@/components/tokens/config/max/ERC721Config';
import ERC1155DetailedConfig from '@/components/tokens/config/max/ERC1155Config';
import ERC1400DetailedConfig from '@/components/tokens/config/max/ERC1400Config';
import ERC3525DetailedConfig from '@/components/tokens/config/max/ERC3525Config';
import ERC4626DetailedConfig from '@/components/tokens/config/max/ERC4626Config';

// Define creation status type
type CreateStatus = 'idle' | 'validating' | 'submitting' | 'success' | 'error';

// Define creation logs type
interface CreationLog {
  status: 'success' | 'error';
  message?: string;
  count?: number;
}

interface CreationLogs {
  mainToken?: CreationLog;
  standardProperties?: CreationLog;
  arrayData?: Record<string, CreationLog>;
}

import useTokenProjectContext from '@/hooks/project/useTokenProjectContext';
import { logger } from '@/utils/shared/logging/contextLogger';
import { 
  checkMissingCriticalFields,
  validateTokenBeforeSubmission,
  formatValidationErrors,
  formatValidationErrorsByField
} from '../utils/validationHelpers';

const CreateTokenPage: React.FC = () => {
  const { projectId, project, isLoading: projectLoading } = useTokenProjectContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  const logContext = 'CreateTokenPage';
  
  // Reference to validation timer
  const validationTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // State for token creation
  const [selectedStandard, setSelectedStandard] = useState<TokenStandard>(TokenStandard.ERC20);
  const [configMode, setConfigMode] = useState<'basic' | 'advanced'>('basic');
  const [assetType, setAssetType] = useState<FinancialProductCategory | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [validationPaused, setValidationPaused] = useState(false);
  const [tokenData, setTokenData] = useState<Partial<TokenFormData>>({
    name: '',
    symbol: '',
    standard: TokenStandard.ERC20,
    project_id: projectId,
    config_mode: 'min',
  });
  
  // UI state
  const [error, setError] = useState<string | null>(null);
  const [createStatus, setCreateStatus] = useState<CreateStatus>('idle');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationErrorsByField, setValidationErrorsByField] = useState<Record<string, string[]>>({});
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [createdTokenId, setCreatedTokenId] = useState<string | null>(null);
  const [creationLogs, setCreationLogs] = useState<CreationLogs>({});
  const [advancedMode, setAdvancedMode] = useState(false);
  // Template selector state removed
  
  // State for Foundry validation
  const [foundryValidationResults, setFoundryValidationResults] = useState<{valid: boolean; errors: string[]} | null>(null);
  const [showFoundryValidation, setShowFoundryValidation] = useState(false);
  const [deploymentStrategy, setDeploymentStrategy] = useState<'foundry' | 'legacy' | 'auto'>('auto');
  
  // Steps for the token creation process
  const steps = [
    { label: 'Select Standard', description: 'Choose a token standard' },
    { label: 'Configure', description: 'Set token properties' },
    { label: 'Review', description: 'Review and create' }
  ];

  // Update token data when standard changes
  useEffect(() => {
    setTokenData(prev => ({
      ...prev,
      standard: selectedStandard,
      config_mode: configMode === 'basic' ? 'min' : 'max'
    }));
  }, [selectedStandard, configMode]);

  // Update config mode when advanced mode changes
  useEffect(() => {
    setConfigMode(advancedMode ? 'advanced' : 'basic');
  }, [advancedMode]);

  /**
   * Handle standard selection
   */
  const handleStandardChange = (standard: TokenStandard) => {
    setSelectedStandard(standard);
    logger.info(logContext, `Standard changed to ${standard}`);
    
    // Reset form data but keep project ID and name/symbol if present
    const { name, symbol, project_id } = tokenData;
    setTokenData({
      name: name || '',
      symbol: symbol || '',
      standard,
      project_id,
      config_mode: configMode === 'basic' ? 'min' : 'max',
    });
  };

  /**
   * Handle asset type selection
   */
  const handleAssetTypeChange = (type: FinancialProductCategory | null) => {
    setAssetType(type);
    logger.info(logContext, `Asset type changed to ${type}`);
  };

  /**
   * Handle configuration mode toggle
   */
  const handleConfigModeChange = (checked: boolean) => {
    const newUIMode: UIConfigMode = checked ? 'advanced' : 'basic';
    const newStorageMode: StorageConfigMode = uiModeToStorageMode(newUIMode);
    
    // Update UI state
    setConfigMode(newUIMode);
    setAdvancedMode(checked);
    
    // Update token data with new config mode for database storage
    setTokenData(prev => ({
      ...prev,
      config_mode: newStorageMode
    }));
    
    logger.info(logContext, `Config mode changed to ${newUIMode} (storage: ${newStorageMode})`);
  };

  /**
   * Handle form data changes
   */
  const handleFormChange = (data: Partial<TokenFormData>) => {
    setTokenData(prev => ({
      ...prev,
      ...data
    }));
  };

  /**
   * Validate token data before submission
   */
  const validateToken = () => {
    // If validation is paused (during JSON loading), skip validation
    if (validationPaused) {
      return true;
    }
    
    setCreateStatus('validating');
    setValidationErrors([]);
    setValidationErrorsByField({});
    setFoundryValidationResults(null);
    setError(null);
    
    try {
      // Check for missing critical fields
      const missingFields = checkMissingCriticalFields(tokenData);
      if (missingFields.length > 0) {
        setValidationErrors([
          "Missing required fields: " + missingFields.join(', ')
        ]);
        
        // Create field-specific errors for missing fields
        const fieldErrors: Record<string, string[]> = {};
        missingFields.forEach(field => {
          fieldErrors[field] = ['This field is required'];
        });
        setValidationErrorsByField(fieldErrors);
        
        setCreateStatus('error');
        return false;
      }
      
      // Validate using the validation helper with the proper storage config mode
      const storageConfigMode = uiModeToStorageMode(configMode);
      const validationResult = validateTokenBeforeSubmission(
        tokenData,
        storageConfigMode,
        logContext
      );
      
      // Log the validation result for debugging
      logger.info(logContext, `Validation result for ${selectedStandard} with ${configMode} UI mode (${storageConfigMode} storage mode): ${validationResult.valid ? 'valid' : 'invalid'}`);
      
      if (!validationResult.valid) {
        // Format and display validation errors
        const formattedErrors = formatValidationErrors(validationResult.errors);
        setValidationErrors(formattedErrors);
        
        // Format errors by field for more detailed display
        const errorsByField = formatValidationErrorsByField(validationResult);
        setValidationErrorsByField(errorsByField);
        
        setCreateStatus('error');
        
        toast({
          variant: "destructive",
          title: "Validation Failed",
          description: "Please fix the errors before submitting.",
        });
        
        return false;
      }
      
      // Additional Foundry validation if strategy supports it
      if (deploymentStrategy === 'foundry' || deploymentStrategy === 'auto') {
        try {
          // Check if Foundry deployment is supported for this standard
          const shouldUseFoundry = enhancedTokenDeploymentService.shouldUseFoundryDeployment(selectedStandard);
          
          if (shouldUseFoundry) {
            // Validate Foundry configuration
            const foundryConfig = mapTokenToFoundryConfig(tokenData, selectedStandard, 'temp-owner');
            const foundryType = tokenStandardToFoundryType(selectedStandard);
            const foundryValidation = validateFoundryConfig(foundryConfig, foundryType);
            
            setFoundryValidationResults(foundryValidation);
            
            if (!foundryValidation.valid) {
              setShowFoundryValidation(true);
              logger.warn(logContext, `Foundry validation failed: ${foundryValidation.errors.join(', ')}`);
              
              // Show warning but allow to continue
              toast({
                variant: "destructive",
                title: "Foundry Validation Warning",
                description: "Some Foundry-specific validations failed. You can proceed with legacy deployment.",
              });
            } else {
              logger.info(logContext, 'Foundry validation passed');
            }
          }
        } catch (foundryError) {
          logger.warn(logContext, `Foundry validation error: ${foundryError}`);
          // Don't fail the overall validation for Foundry issues
        }
      }
      
      // Validation passed
      setCreateStatus('idle');
      return true;
    } catch (error) {
      logger.error(logContext, "Error during validation", error);
      setError("An unexpected error occurred during validation.");
      setCreateStatus('error');
      return false;
    }
  };

  /**
   * Submit token data for creation
   */
  const handleSubmit = async () => {
    // Validate token data first
    if (!validateToken()) {
      return;
    }
    
    // Proceed with submission
    setCreateStatus('submitting');
    
    try {
      // Prepare token data for submission
      const submissionData = {
        ...tokenData,
        config_mode: configMode === 'basic' ? 'min' : 'max',
        project_id: projectId
      };
      
      logger.info(logContext, "Submitting token data", submissionData);
      
      // Create token
      try {
        const result = await createToken(projectId || '', submissionData);
        
        // Handle success
        if (result && result.id) {
          logger.info(logContext, "Token created successfully", result);
          setCreatedTokenId(result.id);
          
          // Create simplified logs structure from the result
          const simplifiedLogs: CreationLogs = {
            mainToken: { status: 'success' },
            standardProperties: { status: 'success' },
            arrayData: {}
          };
          
          // If we have standardInsertionResults, use them to populate arrayData
          if (result.standardInsertionResults) {
            Object.entries(result.standardInsertionResults).forEach(([key, value]) => {
              simplifiedLogs.arrayData![key] = { 
                status: 'success',
                count: Array.isArray(value) ? value.length : 1
              };
            });
          }
          
          setCreationLogs(simplifiedLogs);
          setCreateStatus('success');
          setShowSuccessDialog(true);
        } else {
          // Handle API error
          logger.error(logContext, "Token creation failed - invalid result", result);
          setError("Failed to create token. Please try again.");
          setCreateStatus('error');
          
          toast({
            variant: "destructive",
            title: "Creation Failed",
            description: "Failed to create token. Please try again.",
          });
        }
      } catch (apiError: any) {
        // Handle API error
        logger.error(logContext, "Token creation failed", apiError);
        setError(apiError?.message || "Failed to create token. Please try again.");
        setCreateStatus('error');
        
        toast({
          variant: "destructive",
          title: "Creation Failed",
          description: apiError?.message || "Failed to create token. Please try again.",
        });
      }
    } catch (error) {
      // Handle unexpected error
      logger.error(logContext, "Unexpected error during token creation", error);
      setError("An unexpected error occurred. Please try again.");
      setCreateStatus('error');
      
      toast({
        variant: "destructive",
        title: "Creation Failed",
        description: "An unexpected error occurred. Please try again.",
      });
    }
  };

  /**
   * Navigate to view the created token
   */
  const handleViewCreatedToken = () => {
    if (createdTokenId) {
      navigate(`/tokens/${createdTokenId}`);
    }
    setShowSuccessDialog(false);
  };

  /**
   * Reset form to create another token
   */
  const handleCreateAnotherToken = () => {
    setShowSuccessDialog(false);
    setTokenData({
      name: '',
      symbol: '',
      standard: selectedStandard,
      project_id: projectId,
      config_mode: configMode === 'basic' ? 'min' : 'max',
    });
    setCreateStatus('idle');
    setValidationErrors([]);
    setValidationErrorsByField({});
    setError(null);
  };

  /**
   * Render configuration component based on standard and mode
   */
  const renderConfigComponent = () => {
    // Common props for all config components
    const configProps = {
      tokenForm: tokenData as any,
      handleInputChange: (e: any) => handleFormChange({ [e.target.name]: e.target.value }),
      setTokenForm: setTokenData,
      onConfigChange: (config: any) => handleFormChange(config)
    };
    
    // Determine the storage config mode based on UI config mode
    const storageConfigMode: StorageConfigMode = uiModeToStorageMode(configMode);
    
    // Log the configuration mode for debugging
    logger.info(logContext, `Rendering config component for ${selectedStandard} with ${configMode} UI mode (${storageConfigMode} storage mode)`);
    
    if (configMode === 'basic') {
      switch (selectedStandard) {
        case TokenStandard.ERC20:
          return <ERC20SimpleConfig {...configProps} />;
        case TokenStandard.ERC721:
          return <ERC721SimpleConfig {...configProps} />;
        case TokenStandard.ERC1155:
          return <ERC1155SimpleConfig {...configProps} />;
        case TokenStandard.ERC1400:
          return <ERC1400SimpleConfig {...configProps} />;
        case TokenStandard.ERC3525:
          return <ERC3525SimpleConfig {...configProps} />;
        case TokenStandard.ERC4626:
          return <ERC4626SimpleConfig {...configProps} />;
        default:
          return <div className="p-4">Configuration not available for {selectedStandard}</div>;
      }
    } else {
      switch (selectedStandard) {
        case TokenStandard.ERC20:
          return <ERC20DetailedConfig {...configProps} />;
        case TokenStandard.ERC721:
          return <ERC721DetailedConfig {...configProps} />;
        case TokenStandard.ERC1155:
          return <ERC1155DetailedConfig {...configProps} />;
        case TokenStandard.ERC1400:
          return <ERC1400DetailedConfig {...configProps} />;
        case TokenStandard.ERC3525:
          return <ERC3525DetailedConfig {...configProps} />;
        case TokenStandard.ERC4626:
          return <ERC4626DetailedConfig {...configProps} />;
        default:
          return <div className="p-4">Configuration not available for {selectedStandard}</div>;
      }
    }
  };

  /**
   * Display validation errors in a visible area
   */
  const renderValidationErrors = () => {
    const hasErrors = validationErrors.length > 0 || Object.keys(validationErrorsByField).length > 0;
    if (!hasErrors) return null;
    
    return (
      <div className="space-y-4">
        {validationErrors.length > 0 && (
          <ValidationErrorDisplay errors={validationErrors} title="Validation Issues" />
        )}
        
        {Object.keys(validationErrorsByField).length > 0 && (
          <ValidationErrorDisplay errors={validationErrorsByField} title="Field Validation Issues" />
        )}
      </div>
    );
  };

  /**
   * Render step content based on current step
   */
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            {/* Validation Errors Display */}
            {renderValidationErrors()}
            
            <Card>
              <CardHeader>
                <CardTitle>Asset Type (Optional)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Selecting an asset type will help recommend the most appropriate token standard.
                </p>
                <AssetTypeSelector
                  selectedCategory={assetType}
                  onChange={handleAssetTypeChange}
                />
                {assetType && (
                  <div className="pt-6">
                    <h3 className="text-lg font-medium mb-4">Recommended Standards</h3>
                    <StandardRecommender
                      assetCategory={assetType}
                      onSelectStandard={handleStandardChange}
                    />
                    <div className="mt-4">
                      <Button
                        variant="default"
                        onClick={() => setCurrentStep(1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Select Token Standard</CardTitle>
              </CardHeader>
              <CardContent>
                <TokenStandardSelector
                  selectedStandard={selectedStandard}
                  onChange={handleStandardChange}
                />
              </CardContent>
            </Card>
          </div>
        );
      
      case 1:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configure Token</CardTitle>
                <div className="flex items-center space-x-2 pt-2">
                  <Switch
                    id="advanced-mode"
                    checked={advancedMode}
                    onCheckedChange={handleConfigModeChange}
                  />
                  <Label htmlFor="advanced-mode">Advanced Mode</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Advanced mode enables additional configuration options.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex justify-between mb-4">
                    <div>
                      {/* Load Template button removed */}
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="deployment-strategy" className="text-sm font-medium">Deployment Strategy:</Label>
                        <Select value={deploymentStrategy} onValueChange={(value: 'foundry' | 'legacy' | 'auto') => setDeploymentStrategy(value)}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="auto">Auto</SelectItem>
                            <SelectItem value="foundry">Foundry</SelectItem>
                            <SelectItem value="legacy">Legacy</SelectItem>
                          </SelectContent>
                        </Select>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Auto: Uses Foundry for supported standards, Legacy otherwise<br/>
                                 Foundry: Modern contracts with gas optimization<br/>
                                 Legacy: Traditional deployment method</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </div>
                  
                  {/* Create a simplified token form for basic details */}
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle>Basic Token Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Token Name</Label>
                          <div className="relative">
                            <input
                              id="name"
                              name="name"
                              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                              value={tokenData.name || ''}
                              onChange={(e) => handleFormChange({ name: e.target.value })}
                              placeholder="My Token"
                              required
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="symbol">Token Symbol</Label>
                          <div className="relative">
                            <input
                              id="symbol"
                              name="symbol"
                              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                              value={tokenData.symbol || ''}
                              onChange={(e) => handleFormChange({ symbol: e.target.value })}
                              placeholder="TKN"
                              required
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="description">Description</Label>
                          <div className="relative">
                            <textarea
                              id="description"
                              name="description"
                              className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                              value={tokenData.description || ''}
                              onChange={(e) => handleFormChange({ description: e.target.value })}
                              placeholder="Describe your token's purpose and features"
                              rows={3}
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="decimals">Decimals</Label>
                          <div className="relative">
                            <input
                              id="decimals"
                              name="decimals"
                              type="number"
                              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                              min="0"
                              max="18"
                              value={tokenData.decimals || 18}
                              onChange={(e) => handleFormChange({ decimals: parseInt(e.target.value) })}
                              disabled={[TokenStandard.ERC721, TokenStandard.ERC1155].includes(selectedStandard)}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {renderConfigComponent()}
                  
                  {assetType && (
                    <div>
                      {/* Asset type configuration will be handled by the config components */}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Review and Create</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Token Details</h3>
                      <div className="space-y-2">
                        <p><span className="font-medium">Name:</span> {tokenData.name}</p>
                        <p><span className="font-medium">Symbol:</span> {tokenData.symbol}</p>
                        <p><span className="font-medium">Standard:</span> {tokenData.standard}</p>
                        <p><span className="font-medium">Configuration:</span> {configMode}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-2">Additional Information</h3>
                      <div className="space-y-2">
                        <p><span className="font-medium">Project ID:</span> {projectId}</p>
                        {tokenData.description && (
                          <p><span className="font-medium">Description:</span> {tokenData.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Validation Errors */}
                  {validationErrors.length > 0 && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Validation Errors</AlertTitle>
                      <AlertDescription>
                        <ul className="list-disc list-inside">
                          {validationErrors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {/* Foundry Validation Results */}
                  {foundryValidationResults && !foundryValidationResults.valid && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Foundry Deployment Warnings</AlertTitle>
                      <AlertDescription>
                        <ul className="list-disc list-inside">
                          {foundryValidationResults.errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                        <p className="mt-2 text-sm">You can proceed with legacy deployment or fix these issues for Foundry deployment.</p>
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {/* Deployment Strategy Info */}
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Deployment Strategy</AlertTitle>
                    <AlertDescription>
                      <div className="space-y-1">
                        <p><span className="font-medium">Selected Strategy:</span> {deploymentStrategy}</p>
                        {deploymentStrategy === 'auto' && (
                          <p className="text-sm text-muted-foreground">
                            Will automatically choose Foundry for supported standards ({enhancedTokenDeploymentService.configureDeploymentStrategy.getConfiguration().SUPPORTED_FOUNDRY_STANDARDS.join(', ')}) or fallback to legacy deployment.
                          </p>
                        )}
                        {deploymentStrategy === 'foundry' && (
                          <p className="text-sm text-muted-foreground">
                            Will use modern Foundry contracts with gas optimization and enhanced security features.
                          </p>
                        )}
                        {deploymentStrategy === 'legacy' && (
                          <p className="text-sm text-muted-foreground">
                            Will use traditional deployment method for maximum compatibility.
                          </p>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                  
                  {/* General Error */}
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <TokenPageLayout 
      title="Create Token"
      description="Configure and deploy a new token"
    >
      
      <div className="container mx-auto py-6 space-y-6">
      
      <div className="mb-6">
        <Stepper
          steps={steps.map(step => ({ title: step.label, description: step.description }))}
          currentStep={currentStep}
          onStepChange={setCurrentStep}
        />
      </div>
      
      {renderStepContent()}
      
      <div className="flex justify-between mt-6">
        {currentStep > 0 ? (
          <Button
            variant="outline"
            onClick={() => setCurrentStep(currentStep - 1)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        ) : (
          <div></div>
        )}
        
        {currentStep < steps.length - 1 ? (
          <Button
            onClick={() => setCurrentStep(currentStep + 1)}
          >
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={createStatus === 'submitting'}
          >
            {createStatus === 'submitting' ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Create Token
              </>
            )}
          </Button>
        )}
      </div>
      
      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
              Token Created Successfully
            </DialogTitle>
            <DialogDescription>
              Your token has been created and is ready to use.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <p className="font-medium">Token ID: {createdTokenId}</p>
            </div>
            
            {Object.keys(creationLogs).length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Creation Details:</h4>
                <div className="space-y-2 text-sm">
                  {/* Main Token */}
                  <div className="border rounded p-2">
                    <p className="font-medium">Main Token: 
                      <span className={creationLogs.mainToken?.status === 'success' ? 'text-green-500' : 'text-red-500'}>
                        {' '}{creationLogs.mainToken?.status}
                      </span>
                    </p>
                  </div>
                  
                  {/* Standard Properties */}
                  <div className="border rounded p-2">
                    <p className="font-medium">Standard Properties: 
                      <span className={creationLogs.standardProperties?.status === 'success' ? 'text-green-500' : 'text-red-500'}>
                        {' '}{creationLogs.standardProperties?.status}
                      </span>
                    </p>
                  </div>
                  
                  {/* Related Records */}
                  {creationLogs.arrayData && Object.keys(creationLogs.arrayData).length > 0 && (
                    <div className="border rounded p-2">
                      <p className="font-medium">Related Records:</p>
                      <ul className="list-disc list-inside">
                        {Object.entries(creationLogs.arrayData).map(([key, value]: [string, any]) => (
                          <li key={key}>
                            {key.replace(/_/g, ' ')}: 
                            <span className={value?.status === 'success' ? 'text-green-500' : 'text-red-500'}>
                              {' '}{value?.status} 
                            </span>
                            {value?.count && <span> ({value.count} records)</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter className="space-x-2">
            <Button variant="outline" onClick={handleCreateAnotherToken}>
              Create Another
            </Button>
            <Button onClick={handleViewCreatedToken}>
              View Token
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Template Selector Dialog removed */}
      </div>
    </TokenPageLayout>
  );
};

export default CreateTokenPage;
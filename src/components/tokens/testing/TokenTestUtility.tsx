/**
 * Token Test Utility
 * 
 * A comprehensive utility component for testing CRUD operations on tokens
 * through a JSON editor interface. Supports all token standards and both
 * basic and advanced modes.
 */
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Check, AlertCircle, Play, RefreshCw, Copy, X } from 'lucide-react';

import { TokenStandard } from '@/types/core/centralModels';
import { 
  createToken, 
  getToken, 
  updateToken, 
  deleteToken, 
  getCompleteToken,
  getTokensByProject 
} from '../services/tokenService';
import { validateTokenData } from '../services/tokenDataValidation';
import { getTemplateForStandard } from './tokenTemplates';
import { JsonViewer } from './JsonViewer';
import ProductSelector, { FileSelectionResult } from '../components/ProductSelector';

// Available modes for the editor
type EditorMode = 'create' | 'read' | 'update' | 'delete';

// Configuration modes
type ConfigMode = 'min' | 'max';

// Logger helper for consistent console logging
const logger = {
  error: (message: string, details: any) => {
    console.error(`[TokenTestUtility] ${message}`, details);
    return message;
  },
  info: (message: string, details?: any) => {
    console.info(`[TokenTestUtility] ${message}`, details || '');
    return message;
  }
};

const TokenTestUtility: React.FC = () => {
  const { projectId = '' } = useParams<{ projectId: string }>();
  
  // State for different aspects of the utility
  const [tokenId, setTokenId] = useState<string>('');
  const [tokens, setTokens] = useState<any[]>([]);
  const [editorMode, setEditorMode] = useState<EditorMode>('create');
  const [configMode, setConfigMode] = useState<ConfigMode>('min');
  const [tokenStandard, setTokenStandard] = useState<TokenStandard>(TokenStandard.ERC20);
  const [jsonData, setJsonData] = useState<string>('');
  const [responseData, setResponseData] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Load existing token IDs when component mounts
  useEffect(() => {
    const fetchTokenIds = async () => {
      try {
        setIsLoading(true);
        logger.info(`Fetching tokens for project: ${projectId}`);
        // Use the token service to get tokens by project
        const tokens = await getTokensByProject(projectId);
        if (tokens && Array.isArray(tokens)) {
          setTokens(tokens);
          logger.info(`Found ${tokens.length} tokens for project`, tokens);
        } else {
          const message = "No tokens found or invalid response format";
          setError(message);
          logger.error(message, tokens);
        }
      } catch (err: any) {
        const errorMessage = `Failed to fetch token IDs: ${err.message}`;
        console.error('Full error details:', err);
        setError(errorMessage);
        logger.error(errorMessage, {
          error: err,
          stack: err.stack,
          projectId
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    // Only fetch if we have a valid project ID
    if (projectId) {
      fetchTokenIds();
    } else {
      const message = "No project ID provided. Please navigate to this page from a project context.";
      setError(message);
      logger.error(message, { projectId });
    }
  }, [projectId]);
  
  // Generate template data when standard or config mode changes
  useEffect(() => {
    const template = getTemplateForStandard(tokenStandard, configMode);
    setJsonData(JSON.stringify(template, null, 2));
    logger.info(`Template generated for standard: ${tokenStandard}, mode: ${configMode}`);
  }, [tokenStandard, configMode]);
  
  // Reset the form
  const handleReset = () => {
    const template = getTemplateForStandard(tokenStandard, configMode);
    setJsonData(JSON.stringify(template, null, 2));
    setResponseData('');
    setError(null);
    setSuccess(null);
    logger.info('Form reset to template defaults');
  };

  // Clear the response data
  const handleClearResponse = () => {
    setResponseData('');
    setError(null);
    setSuccess(null);
    logger.info('Response cleared');
  };
  
  // Handle loading a token
  const handleLoadToken = async () => {
    if (!tokenId) {
      const message = 'Please select a token ID to load';
      setError(message);
      logger.error(message, { tokenId });
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      logger.info(`Loading token with ID: ${tokenId}`);
      const token = await getCompleteToken(tokenId);
      setJsonData(JSON.stringify(token, null, 2));
      setSuccess('Token loaded successfully');
      logger.info('Token loaded successfully', token);
    } catch (err: any) {
      const errorMessage = `Failed to load token: ${err.message}`;
      setError(errorMessage);
      logger.error(errorMessage, {
        error: err,
        stack: err.stack,
        tokenId
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle loading a JSON file from the ProductSelector
  const handleLoadJsonFile = (result: FileSelectionResult) => {
    setJsonData(result.content);
    setResponseData('');
    setError(null);
    setSuccess(null);
    
    // Automatically set the token standard and configuration mode
    setTokenStandard(result.tokenStandard);
    setConfigMode(result.configMode);
    
    logger.info('JSON file loaded from product selector', {
      tokenStandard: result.tokenStandard,
      configMode: result.configMode
    });
  };
  
  // Parse, normalize, and validate JSON data
  const parseAndValidateJson = async (tokenStandard?: TokenStandard) => {
    try {
      const parsedData = JSON.parse(jsonData);
      let normalizedData = parsedData;
      // If properties exist, use them as they are (assuming they're already normalized)
      // Robust normalization: ensure all required fields are present
      if (parsedData.properties) {
        normalizedData = {
          ...parsedData,
          ...parsedData.properties
        };
      }
      // Fallback: fill required fields from blocks if missing
      if (parsedData.blocks) {
        if (normalizedData.decimals === undefined && parsedData.blocks.decimals !== undefined) {
          normalizedData.decimals = parsedData.blocks.decimals;
        }
        if (!normalizedData.securityType && parsedData.blocks.security_type) {
          normalizedData.securityType = parsedData.blocks.security_type;
        }
        if (normalizedData.isIssuable === undefined && (parsedData.blocks.is_issuable !== undefined || parsedData.blocks.issuance_modules !== undefined)) {
          normalizedData.isIssuable = parsedData.blocks.is_issuable ?? parsedData.blocks.issuance_modules;
        }
      }
      
      // Set default decimals if not present
      if (normalizedData.decimals === undefined) {
        normalizedData.decimals = 18;
      }
      
      // Fallback: fill required fields from top-level if missing in normalizedData
      if (normalizedData.issuanceModules !== undefined && normalizedData.isIssuable === undefined) {
        normalizedData.isIssuable = normalizedData.issuanceModules;
      }
      if (normalizedData.security_type && !normalizedData.securityType) {
        normalizedData.securityType = normalizedData.security_type;
      }
      
      // Always ensure standard is present at the top level and is a valid enum
      const standardString = parsedData.standard || parsedData.blocks?.standard;
      if (!normalizedData.standard && standardString) {
        // Map string to enum if needed
        const enumMap = {
          'ERC-20': TokenStandard.ERC20,
          'ERC-721': TokenStandard.ERC721,
          'ERC-1155': TokenStandard.ERC1155,
          'ERC-1400': TokenStandard.ERC1400,
          'ERC-3525': TokenStandard.ERC3525,
          'ERC-4626': TokenStandard.ERC4626
        };
        normalizedData.standard = enumMap[standardString] || standardString;
      }
      
      // Force standard value to be present
      if (!normalizedData.standard && tokenStandard) {
        normalizedData.standard = tokenStandard;
      }
      
      // Special handling for ERC-3525 slots
      if ((normalizedData.standard === TokenStandard.ERC3525 || normalizedData.standard === 'ERC-3525') && !normalizedData.slots) {
        // Try to get slots from standardArrays
        if (normalizedData.standardArrays?.slots && Array.isArray(normalizedData.standardArrays.slots)) {
          normalizedData.slots = normalizedData.standardArrays.slots.map(slot => ({
            id: slot.id,
            name: slot.name,
            description: slot.description || ''
          }));
        } else {
          // Add default slot if none exists
          normalizedData.slots = [{ id: "1", name: "Default Slot", description: "Default slot for basic token setup" }];
        }
      }
      
      // Special handling for ERC-1400 partitions
      if ((normalizedData.standard === TokenStandard.ERC1400 || normalizedData.standard === 'ERC-1400') && 
          normalizedData.partitions && Array.isArray(normalizedData.partitions)) {
        // Ensure each partition has an amount field
        normalizedData.partitions = normalizedData.partitions.map(partition => ({
          ...partition,
          amount: partition.amount || "0"
        }));
      }
      
      // Special handling for ERC-4626 validation issues
      if (normalizedData.standard === TokenStandard.ERC4626 || normalizedData.standard === 'ERC-4626') {
        // Default address for required address fields
        const defaultAddress = '0x0000000000000000000000000000000000000000';
        
        // Ensure assetAddress is present and valid
        if (!normalizedData.assetAddress || !/^0x[0-9a-fA-F]{40}$/.test(normalizedData.assetAddress)) {
          normalizedData.assetAddress = defaultAddress;
        }
        
        // Handle strategyController
        if (!normalizedData.strategyController || !/^0x[0-9a-fA-F]{40}$/.test(normalizedData.strategyController)) {
          normalizedData.strategyController = defaultAddress;
        }
        
        // Handle yieldStrategy - convert string to object if needed
        if (typeof normalizedData.yieldStrategy === 'string') {
          normalizedData.yieldStrategy = {
            protocol: [normalizedData.yieldStrategy],
            rebalancingFrequency: 'weekly'
          };
        } else if (!normalizedData.yieldStrategy) {
          normalizedData.yieldStrategy = {
            protocol: ['simple'],
            rebalancingFrequency: 'weekly'
          };
        }
        
        // Ensure vaultStrategy is valid
        const validStrategies = ['simple', 'compound', 'yearn', 'aave', 'custom', 'short_term_treasury', 'long_term_treasury'];
        if (!normalizedData.vaultStrategy || !validStrategies.includes(normalizedData.vaultStrategy)) {
          normalizedData.vaultStrategy = 'simple';
        }
      }
      
      // Validate the data
      const validation = validateTokenData(normalizedData);
      if (!validation.valid) {
        const validationErrors = validation.errors.map(e => `${e.field} - ${e.message}`).join(', ');
        const errorMessage = `Invalid JSON: ${validationErrors}`;
        setError(errorMessage);
        logger.error(errorMessage, {
          validationResult: validation,
          parsedData: normalizedData
        });
        return null;
      }
      return normalizedData;
    } catch (err: any) {
      const errorMessage = `Invalid JSON: ${err.message}`;
      setError(errorMessage);
      logger.error(errorMessage, {
        error: err,
        jsonData,
        stack: err.stack
      });
      return null;
    }
  };

  
  // Execute the current operation
  const handleExecute = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    setResponseData('');
    
    try {
      let result;
      logger.info(`Executing operation: ${editorMode}`);
      
      switch (editorMode) {
        case 'create':
          // Parse JSON first without validation to extract necessary fields
          try {
            const rawData = JSON.parse(jsonData);
            
            // Extract standard from the input data
            const standardStr = rawData.standard || 'ERC-1400';
            const isERC1400 = standardStr === 'ERC-1400' || standardStr === TokenStandard.ERC1400;
            const isERC3525 = standardStr === 'ERC-3525' || standardStr === TokenStandard.ERC3525;
            const isERC4626 = standardStr === 'ERC-4626' || standardStr === TokenStandard.ERC4626;

            // Create a normalized copy with proper standard format
            const createData = {
              ...rawData,
              // Ensure proper standard format using TokenStandard enum
              standard: isERC1400 ? TokenStandard.ERC1400 : (isERC3525 ? TokenStandard.ERC3525 : (isERC4626 ? TokenStandard.ERC4626 : tokenStandard)),
              // Ensure decimals is present
              decimals: rawData.decimals || 18,
              // Ensure config_mode is present
              config_mode: rawData.config_mode || 'max',
              // Ensure name is present
              name: rawData.name || rawData.blocks?.name || 'New Token',
              // Ensure symbol is present
              symbol: rawData.symbol || rawData.blocks?.symbol || 'TKN',
            };
            
            // Add special handling for ERC-1400 tokens
            if (isERC1400) {
              Object.assign(createData, {
                // Required fields for ERC-1400
                isIssuable: rawData.isIssuable || rawData.issuanceModules || true,
                initialSupply: rawData.initialSupply || rawData.blocks?.initial_supply || "1000000",
                isMintable: rawData.isMintable ?? rawData.blocks?.is_mintable ?? false,
                isBurnable: rawData.isBurnable ?? rawData.blocks?.is_burnable ?? true,
                isPausable: rawData.isPausable ?? rawData.blocks?.is_pausable ?? true,
                requireKyc: rawData.requireKyc ?? rawData.blocks?.require_kyc ?? true,
                securityType: rawData.securityType || rawData.blocks?.security_type || 'derivative',
                documentUri: rawData.documentUri || rawData.blocks?.document_uri || 'https://example.com/doc.pdf',
                controllerAddress: rawData.controllerAddress || rawData.blocks?.controller_address || '0x1111111111111111111111111111111111111111',
                // Optional arrays
                partitions: rawData.standardArrays?.partitions || [],
                // Format controllers as objects with address property
                controllers: (() => {
                  try {
                    if (Array.isArray(rawData.standardArrays?.controllers)) {
                      return rawData.standardArrays.controllers.map(ctrl => 
                        typeof ctrl === 'string' 
                          ? { address: ctrl } 
                          : ctrl
                      );
                    }
                    // Fallback if no controllers provided
                    return rawData.controllerAddress 
                      ? [{ address: rawData.controllerAddress }] 
                      : [];
                  } catch (e) {
                    // Fallback with default controller
                    return [{ address: '0x1111111111111111111111111111111111111111' }];
                  }
                })(),
              });
            }
            
            // Add special handling for ERC-3525 tokens
            if (isERC3525) {
              Object.assign(createData, {
                // Required fields for ERC-3525
                slots: rawData.slots || (rawData.standardArrays && rawData.standardArrays.slots 
                  ? rawData.standardArrays.slots.map(slot => ({
                      id: slot.id,
                      name: slot.name,
                      description: slot.description || ''
                    }))
                  : [{ id: "1", name: "Default Slot", description: "Default slot for basic token setup" }]),
                baseUri: rawData.baseUri || rawData.blocks?.base_uri || 'https://example.com/metadata/',
                metadataStorage: rawData.metadataStorage || rawData.blocks?.metadata_storage || 'ipfs',
                valueDecimals: rawData.valueDecimals || rawData.blocks?.value_decimals || 0
              });
            }
            
            // Add special handling for ERC-4626 tokens
            if (isERC4626) {
              // Ensure we have a valid Ethereum address for assetAddress
              const defaultAddress = '0x0000000000000000000000000000000000000000';
              
              // Prepare standardArrays for ERC-4626
              const standardArrays = rawData.standardArrays || {};
              
              // Handle strategy params
              let strategyParams = standardArrays.strategyParams || [];
              if (strategyParams.length === 0 && rawData.yieldStrategy?.protocol) {
                // Convert protocol array to strategyParams if needed
                if (Array.isArray(rawData.yieldStrategy.protocol)) {
                  strategyParams = rawData.yieldStrategy.protocol.map((p: string) => ({
                    name: 'protocol',
                    value: p,
                    description: `Protocol: ${p}`
                  }));
                } else if (typeof rawData.yieldStrategy === 'string') {
                  strategyParams = [{
                    name: 'protocol',
                    value: rawData.yieldStrategy,
                    description: `Protocol: ${rawData.yieldStrategy}`
                  }];
                }
              }
              
              // Handle asset allocations
              let assetAllocations = standardArrays.assetAllocations || [];
              if (assetAllocations.length === 0 && rawData.assetAllocation) {
                assetAllocations = Array.isArray(rawData.assetAllocation) 
                  ? rawData.assetAllocation 
                  : [];
              }
              
              Object.assign(createData, {
                // Required fields for ERC-4626
                assetAddress: rawData.assetAddress || rawData.blocks?.asset_address || defaultAddress,
                assetName: rawData.assetName || rawData.blocks?.asset_name || 'USDC',
                assetSymbol: rawData.assetSymbol || rawData.blocks?.asset_symbol || 'USDC',
                assetDecimals: rawData.assetDecimals || rawData.blocks?.asset_decimals || 6,
                vaultType: rawData.vaultType || rawData.blocks?.vault_type || 'yield',
                isMintable: rawData.isMintable ?? rawData.blocks?.is_mintable ?? true,
                isBurnable: rawData.isBurnable ?? rawData.blocks?.is_burnable ?? true,
                isPausable: rawData.isPausable ?? rawData.blocks?.is_pausable ?? true,
                
                // Handle yieldStrategy - convert string to object if needed
                yieldStrategy: (() => {
                  if (typeof rawData.yieldStrategy === 'string') {
                    return { 
                      protocol: [rawData.yieldStrategy],
                      rebalancingFrequency: 'weekly'
                    };
                  } else if (rawData.yieldStrategy && typeof rawData.yieldStrategy === 'object') {
                    return rawData.yieldStrategy;
                  } else {
                    return { 
                      protocol: ['simple'],
                      rebalancingFrequency: 'weekly'
                    };
                  }
                })(),
                
                // Ensure valid vaultStrategy
                vaultStrategy: (() => {
                  const strategy = rawData.vaultStrategy || rawData.blocks?.vault_strategy;
                  // Check if the strategy is one of the allowed values
                  const validStrategies = ['simple', 'compound', 'yearn', 'aave', 'custom', 'short_term_treasury', 'long_term_treasury'];
                  return validStrategies.includes(strategy) ? strategy : 'simple';
                })(),
                
                // Ensure valid strategyController address
                strategyController: rawData.strategyController || rawData.blocks?.strategy_controller || defaultAddress,
                
                // Add standardArrays with properly named fields
                standardArrays: {
                  ...standardArrays,
                  strategyParams,
                  assetAllocations
                }
              });
            }
            
            // Create the token
            logger.info('Creating token with data', createData);
            result = await createToken(projectId, createData);
            setSuccess(`Token created successfully with ID: ${result.id}`);
            setTokenId(result.id);
            // Add the new token to the list
            setTokens(prev => [...prev, result]);
            logger.info('Token created successfully', result);
          } catch (parseErr: any) {
            const errorMessage = `Invalid JSON: ${parseErr.message}`;
            setError(errorMessage);
            logger.error(errorMessage, {
              error: parseErr,
              jsonData,
              stack: parseErr.stack
            });
            setIsLoading(false);
            return;
          }
          break;
          
        case 'read':
          if (!tokenId) {
            const message = 'Please select a token ID to read';
            setError(message);
            logger.error(message, { tokenId });
            setIsLoading(false);
            return;
          }
          
          // Read the token
          logger.info(`Reading token with ID: ${tokenId}`);
          result = await getCompleteToken(tokenId);
          setSuccess('Token read successfully');
          logger.info('Token read successfully', result);
          break;
          
        case 'update':
          if (!tokenId) {
            const message = 'Please select a token ID to update';
            setError(message);
            logger.error(message, { tokenId });
            setIsLoading(false);
            return;
          }
          
          // Parse, normalize, and validate JSON
          let updateData = await parseAndValidateJson(tokenStandard);
          if (!updateData) {
            setIsLoading(false);
            return;
          }
          // Update the token
          logger.info(`Updating token with ID: ${tokenId}`, updateData);
          result = await updateToken(tokenId, updateData);
          setSuccess('Token updated successfully');
          logger.info('Token updated successfully', result);
          break;
          
        case 'delete':
          if (!tokenId) {
            const message = 'Please select a token ID to delete';
            setError(message);
            logger.error(message, { tokenId });
            setIsLoading(false);
            return;
          }
          
          // Delete the token
          logger.info(`Deleting token with ID: ${tokenId}`);
          result = await deleteToken(projectId, tokenId);
          setSuccess('Token deleted successfully');
          // Remove the token from the list
          setTokens(prev => prev.filter(token => token.id !== tokenId));
          setTokenId('');
          logger.info('Token deleted successfully', result);
          // Only display serializable fields for delete
          try {
            const { success, message, results } = result || {};
            setResponseData(JSON.stringify({ success, message, results }, null, 2));
          } catch (err) {
            setResponseData(typeof result === 'string' ? result : '[Unserializable result: circular structure]');
          }
          break;
      }
      
      // Set the response data, handling circular structure errors
      try {
        setResponseData(JSON.stringify(result, null, 2));
      } catch (err) {
        setResponseData(typeof result === 'string' ? result : '[Unserializable result: circular structure]');
      }
    } catch (err: any) {
      const errorMessage = `Operation failed: ${err.message}`;
      setError(errorMessage);
      logger.error(`${editorMode} operation failed`, {
        error: err,
        stack: err.stack,
        tokenId,
        projectId,
        mode: editorMode
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Render helper for token selection
  const renderTokenSelection = () => {
    // Filter and sort tokens by standard and config_mode
    const filteredTokens = tokens
      .filter(token => token.standard === tokenStandard && (token.config_mode === configMode || token.config_mode === undefined))
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

    if (filteredTokens.length === 0) {
      return (
        <div className="mb-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No tokens available</AlertTitle>
            <AlertDescription>
              There are no tokens available for this project. Use the "Create Token" operation to create a new token.
            </AlertDescription>
          </Alert>
        </div>
      );
    }
    
    return (
      <div className="mb-4">
        <Label htmlFor="tokenId">Select Token</Label>
        <Select
          value={tokenId}
          onValueChange={setTokenId}
        >
          <SelectTrigger id="tokenId">
            <SelectValue placeholder="Select a token" />
          </SelectTrigger>
          <SelectContent>
            {filteredTokens.map(token => (
              <SelectItem key={token.id} value={token.id}>
                <div className="flex flex-col">
                  <span className="font-mono text-xs">{token.id}</span>
                  <span className="text-sm font-medium">{token.name} <span className="text-muted-foreground">({token.symbol})</span></span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  };
  
  return (
    <div className="container mx-auto py-8">
      {/* Product Selector */}
      <ProductSelector onFileSelect={handleLoadJsonFile} />
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Token Test Utility</CardTitle>
          <CardDescription>
            Test CRUD operations on tokens using a JSON editor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="editorMode">Operation</Label>
              <Select
                value={editorMode}
                onValueChange={(value) => setEditorMode(value as EditorMode)}
              >
                <SelectTrigger id="editorMode">
                  <SelectValue placeholder="Select operation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="create">Create Token</SelectItem>
                  <SelectItem value="read">Read Token</SelectItem>
                  <SelectItem value="update">Update Token</SelectItem>
                  <SelectItem value="delete">Delete Token</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="tokenStandard">Token Standard</Label>
              <Select
                value={tokenStandard}
                onValueChange={(value) => setTokenStandard(value as TokenStandard)}
              >
                <SelectTrigger id="tokenStandard">
                  <SelectValue placeholder="Select token standard" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TokenStandard.ERC20}>ERC-20</SelectItem>
                  <SelectItem value={TokenStandard.ERC721}>ERC-721</SelectItem>
                  <SelectItem value={TokenStandard.ERC1155}>ERC-1155</SelectItem>
                  <SelectItem value={TokenStandard.ERC1400}>ERC-1400</SelectItem>
                  <SelectItem value={TokenStandard.ERC3525}>ERC-3525</SelectItem>
                  <SelectItem value={TokenStandard.ERC4626}>ERC-4626</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="configMode">Configuration Mode</Label>
              <Select
                value={configMode}
                onValueChange={(value) => setConfigMode(value as ConfigMode)}
              >
                <SelectTrigger id="configMode">
                  <SelectValue placeholder="Select configuration mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="min">Basic</SelectItem>
                  <SelectItem value="max">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {editorMode !== 'create' && renderTokenSelection()}
          </div>
          
          <div className="flex flex-wrap gap-2 mb-4">
            <Button onClick={handleReset} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset Form
            </Button>
            
            {(editorMode === 'read' || editorMode === 'update') && (
              <Button onClick={handleLoadToken} variant="outline" size="sm">
                <Copy className="h-4 w-4 mr-2" />
                Load Token
              </Button>
            )}

            {(responseData || error || success) && (
              <Button onClick={handleClearResponse} variant="outline" size="sm">
                <X className="h-4 w-4 mr-2" />
                Clear Response
              </Button>
            )}
          </div>
          
          {/* JSON Editor */}
          <div className="grid grid-cols-1 gap-6">
            <div>
              <Label htmlFor="jsonData">Token Data (JSON)</Label>
              <Textarea
                id="jsonData"
                value={jsonData}
                onChange={(e) => setJsonData(e.target.value)}
                className="font-mono h-80"
                disabled={isLoading}
              />
            </div>
            
            {/* Error display */}
            {error && (
              <Alert className="border-red-400 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertTitle className="text-red-600">Error</AlertTitle>
                <AlertDescription className="text-red-600">
                  {error}
                </AlertDescription>
              </Alert>
            )}
            
            {/* Success display */}
            {success && (
              <Alert className="border-green-400 bg-green-50">
                <Check className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-600">Success</AlertTitle>
                <AlertDescription className="text-green-600">
                  {success}
                </AlertDescription>
              </Alert>
            )}
            
            {/* Loading indicator */}
            {isLoading && (
              <div className="flex items-center justify-center p-4">
                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                <span>Processing...</span>
              </div>
            )}
            
            {/* Result display */}
            {responseData && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label htmlFor="responseData">Response Data</Label>
                  <Button onClick={handleClearResponse} variant="ghost" size="sm">
                    <X className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                </div>
                <JsonViewer data={responseData} />
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <div>
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={isLoading}
              className="mr-2"
            >
              Reset
            </Button>
            
            {editorMode !== 'create' && (
              <Button
                variant="outline"
                onClick={handleLoadToken}
                disabled={isLoading || !tokenId}
                className="mr-2"
              >
                Load Token
              </Button>
            )}
          </div>
          
          <Button
            onClick={handleExecute}
            disabled={isLoading || (editorMode !== 'create' && !tokenId)}
            className="bg-primary hover:bg-primary/90"
          >
            <Play className="h-4 w-4 mr-2" />
            {editorMode === 'create' ? 'Create' : editorMode === 'read' ? 'Read' : editorMode === 'update' ? 'Update' : 'Delete'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default TokenTestUtility;
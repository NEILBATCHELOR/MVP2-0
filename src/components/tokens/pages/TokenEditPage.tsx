import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TokenPageLayout from '../layout/TokenPageLayout';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from '@/components/ui/card';
import { 
  Button 
} from '@/components/ui/button';
import { 
  AlertCircle, 
  Save,
  ArrowLeft
} from 'lucide-react';
import { 
  Alert, 
  AlertDescription, 
  AlertTitle 
} from '@/components/ui/alert';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  TokenStandard,
  TokenConfigMode
} from '@/types/core/centralModels';
import { 
  useTokenization 
} from '@/components/tokens/hooks/useTokenization';
import { 
  updateToken
} from '@/components/tokens/services/tokenUpdateService';
import { 
  getEnhancedTokenData
} from '@/components/tokens/services/tokenDataService';
import { Json } from '@/types/core/database';
import TokenNavigation from '@/components/tokens/components/TokenNavigation';
import SaveErrorDisplay from '@/components/tokens/components/SaveErrorDisplay';
import { compareTokenStates, FailedSaveField } from '@/components/tokens/utils/saveStateComparison';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import useTokenProjectContext from '@/hooks/project/useTokenProjectContext';

// Import all specialized edit form components
import ERC20EditForm from '@/components/tokens/forms/ERC20EditForm';
import ERC721EditForm from '@/components/tokens/forms/ERC721EditForm';
import ERC1155EditForm from '@/components/tokens/forms/ERC1155EditForm';
import ERC1400EditForm from '@/components/tokens/forms/ERC1400EditForm';
import ERC3525EditForm from '@/components/tokens/forms/ERC3525EditForm';
import ERC4626EditForm from '@/components/tokens/forms/ERC4626EditForm';
import { EnhancedTokenData } from '../types';

interface TokenDetails {
  id: string;
  name: string;
  symbol: string;
  description?: string;
  decimals: number;
  standard: string;
  address?: string;
  blockchain?: string;
  blocks?: Json;
  metadata?: Json;
  total_supply?: string;
  status?: string;
  // Additional fields from API response
  approvals?: string[];
  contract_preview?: string;
  project_id?: string;
  reviewers?: string[];
  created_at?: string;
  updated_at?: string;
  // Token standard-specific properties
  erc1400Properties?: any;
  erc1400Partitions?: any;
  erc1400Controllers?: any;
}

// Helper function to fetch token by ID
const fetchTokenById = async (tokenId: string) => {
  return await getEnhancedTokenData(tokenId);
};

const TokenEditPage: React.FC = () => {
  const { tokenId } = useParams<{ tokenId: string }>();
  const { projectId, project, isLoading: projectLoading } = useTokenProjectContext();
  const navigate = useNavigate();
  const [token, setToken] = useState<EnhancedTokenData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('general');
  const [formData, setFormData] = useState<any>(null);
  const [failedSaveFields, setFailedSaveFields] = useState<FailedSaveField[]>([]);

  // Fetch enhanced token data
  useEffect(() => {
    const fetchToken = async () => {
      if (!tokenId) return;
      
      try {
        setLoading(true);
        const tokenData = await fetchTokenById(tokenId);
        setToken(tokenData);
      } catch (err) {
        console.error('Error fetching token:', err);
        setError('Failed to load token data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchToken();
  }, [tokenId, projectId]);

  // Handle form submission
  const handleSave = async (formData: any = null) => {
    if (!tokenId || !token) return;
    
    try {
      setSaving(true);
      // Store the form data for comparison after save
      setFormData(formData || token);
      
      // Keep a reference to the original token state
      const originalToken = { ...token };
      
      // Use the formData if provided, otherwise use the current token state
      const dataToSave = formData || token;
      await updateToken(tokenId, dataToSave);
      
      // Fetch the updated token to check what actually saved
      const updatedToken = await fetchTokenById(tokenId);
      
      // Compare the original token with the updated token
      const failedFields = compareTokenStates(originalToken, updatedToken, dataToSave);
      setFailedSaveFields(failedFields);
      
      // Update the token state with the fetched data
      setToken(updatedToken);
      
      // Only navigate away if there are no failed fields
      if (failedFields.length === 0) {
        navigate(`/projects/${projectId}/tokens/${tokenId}`);
      }
    } catch (err) {
      console.error('Error updating token:', err);
      setError('Failed to update token. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Handle retry save
  const handleRetrySave = () => {
    if (formData) {
      handleSave(formData);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate(`/projects/${projectId}/tokens/${tokenId}`);
  };

  // Render standard-specific edit form
  const renderStandardSpecificForm = () => {
    if (!token || !projectId) return null;

    // Convert string configMode to enum value
    const configModeValue = token.configMode === 'max' ? TokenConfigMode.MAX : TokenConfigMode.MIN;

    switch (token.standard) {
      case TokenStandard.ERC20:
        return <ERC20EditForm 
          token={token} 
          onSave={handleSave}
          configMode={configModeValue} 
          failedFields={failedSaveFields}
        />;
      case TokenStandard.ERC721:
        return <ERC721EditForm 
          token={token} 
          onSave={handleSave}
          configMode={configModeValue}
        />;
      case TokenStandard.ERC1155:
        return <ERC1155EditForm 
          token={token} 
          onSave={handleSave}
          configMode={configModeValue}
        />;
      case TokenStandard.ERC3525:
        return <ERC3525EditForm 
          token={token} 
          onSave={handleSave}
        />;
      case TokenStandard.ERC4626:
        return <ERC4626EditForm 
          token={token} 
          projectId={projectId} 
          onSave={handleSave}
          onSubmit={handleSave}
          isLoading={saving}
          configMode={configModeValue}
        />;
      case TokenStandard.ERC1400:
        return <ERC1400EditForm 
          token={token} 
          onSave={handleSave}
          configMode={configModeValue}
        />;
      default:
        return (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Under Development</AlertTitle>
            <AlertDescription>
              We're currently implementing the edit functionality for {token.standard} tokens.
              Please check back soon for updates.
            </AlertDescription>
          </Alert>
        );
    }
  };

  return (
    <TokenPageLayout
      title={token ? `Edit ${token.name} (${token.symbol})` : 'Edit Token'}
      description="Update token properties and configuration"
      onRefresh={() => {
      if (!tokenId) return;
      
      setLoading(true);
      fetchTokenById(tokenId)
        .then(tokenData => setToken(tokenData))
        .catch(err => {
          console.error('Error fetching token:', err);
          setError('Failed to load token data. Please try again.');
        })
        .finally(() => setLoading(false));
    }}
      actionButton={
        <Button 
          variant="default" 
          size="sm"
          onClick={() => handleSave(token)}
          disabled={saving || !token}
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      }
    >
        {/* Display any failed save fields */}
        {failedSaveFields.length > 0 && (
          <SaveErrorDisplay 
            failedFields={failedSaveFields} 
            onRetry={handleRetrySave} 
          />
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : token ? (
          // For all token standards, render the specialized form directly
          token.standard === TokenStandard.ERC20 || 
          token.standard === TokenStandard.ERC721 || 
          token.standard === TokenStandard.ERC1155 || 
          token.standard === TokenStandard.ERC3525 || 
          token.standard === TokenStandard.ERC4626 || 
          token.standard === TokenStandard.ERC1400 ? (
            renderStandardSpecificForm()
          ) : (
            // For other token standards, use the tabs-based interface
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="properties">Token Properties</TabsTrigger>
                {token.standard === TokenStandard.ERC1400 && (
                  <TabsTrigger value="partitions">Partitions</TabsTrigger>
                )}
                {token.standard === TokenStandard.ERC1155 && (
                  <TabsTrigger value="types">Token Types</TabsTrigger>
                )}
              </TabsList>
              
              <TabsContent value="general">
                <Card>
                  <CardHeader>
                    <CardTitle>General Information</CardTitle>
                    <CardDescription>Basic token information</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Token Name</label>
                          <Input 
                            value={token.name} 
                            onChange={(e) => {
                              const updatedToken = {...token};
                              updatedToken.name = e.target.value;
                              setToken(updatedToken);
                            }}
                          />
                          <p className="text-sm text-muted-foreground">The full name of the token</p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Token Symbol</label>
                          <Input 
                            value={token.symbol} 
                            onChange={(e) => {
                              const updatedToken = {...token};
                              updatedToken.symbol = e.target.value;
                              setToken(updatedToken);
                            }}
                          />
                          <p className="text-sm text-muted-foreground">The symbol of the token</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Description</label>
                        <Textarea 
                          value={token.description || ''} 
                          onChange={(e) => {
                            const updatedToken = {...token};
                            updatedToken.description = e.target.value;
                            setToken(updatedToken);
                          }}
                        />
                        <p className="text-sm text-muted-foreground">A brief description of the token</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="properties">
                <Card>
                  <CardHeader>
                    <CardTitle>Token Properties</CardTitle>
                    <CardDescription>Standard-specific token properties</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {renderStandardSpecificForm()}
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Additional tab contents for specific token standards */}
              {token.standard === TokenStandard.ERC1400 && (
                <TabsContent value="partitions">
                  <Card>
                    <CardHeader>
                      <CardTitle>Token Partitions</CardTitle>
                      <CardDescription>Manage ERC-1400 token partitions</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {/* Partition management form will be implemented here */}
                      <p className="text-muted-foreground">Partition management functionality will be available soon.</p>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
              
              {token.standard === TokenStandard.ERC1155 && (
                <TabsContent value="types">
                  <Card>
                    <CardHeader>
                      <CardTitle>Token Types</CardTitle>
                      <CardDescription>Manage ERC-1155 token types</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {/* Token types management form will be implemented here */}
                      <p className="text-muted-foreground">Token type management functionality will be available soon.</p>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          )
        ) : (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Token Not Found</AlertTitle>
            <AlertDescription>
              The requested token could not be found.
            </AlertDescription>
          </Alert>
        )}
    </TokenPageLayout>
  );
};

export default TokenEditPage;

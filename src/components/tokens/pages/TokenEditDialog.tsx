import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, RefreshCw, Trash2 } from 'lucide-react';
import { EnhancedTokenData } from '../types';
import withConfigMode from '../utils/withConfigMode';
import { updateToken, validateTokenUpdateData } from '../services/tokenUpdateService';
import { TokenConfigMode, TokenStandard } from '@/types/core/centralModels';
import ERC20EditForm from '../forms/ERC20EditForm';
import ERC721EditForm from '../forms/ERC721EditForm';
import ERC1155EditForm from '../forms/ERC1155EditForm';
import ERC1400EditForm from '../forms/ERC1400EditForm';
import ERC3525EditForm from '../forms/ERC3525EditForm';
import ERC4626EditForm from '../forms/ERC4626EditForm';
import { 
  EnhancedERC1400Service
} from '../services/enhancedERC1400Service';

interface TokenEditDialogProps {
  token: EnhancedTokenData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  onError: (error: Error) => void;
  onDelete?: (tokenId: string) => Promise<void>;
}

const TokenEditDialog: React.FC<TokenEditDialogProps> = ({
  token,
  open,
  onOpenChange,
  onSuccess,
  onError,
  onDelete
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Reset error message when dialog opens/closes
  useEffect(() => {
    setErrorMessage(null);
  }, [open]);
  
  // Use useCallback to create a stable function reference
  const handleSubmit = useCallback(async (data: any) => {
    if (!token) return;
    
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      
      console.log(`[TokenEditDialog] Submitting token update for ${token.standard}:`, data);
      
      // Validate the data before sending it to the server
      const validatedData = validateTokenUpdateData({
        ...token,
        ...data
      }) as any; // Type assertion to avoid TypeScript errors with property access
      
      console.log(`[TokenEditDialog] Validated data for ${token.standard}:`, validatedData);
      
      try {
        // Handle ERC1400 tokens differently, using the specialized service
        if (token.standard === TokenStandard.ERC1400) {
          // Use the enhanced ERC1400 service
          const erc1400Service = new EnhancedERC1400Service();
          
          // Update the token with properties using enhanced service
          const result = await erc1400Service.updateTokenWithProperties(
            token.id, 
            {
              name: validatedData.name,
              symbol: validatedData.symbol,
              decimals: validatedData.decimals,
              metadata: validatedData.metadata,
              blocks: validatedData.blocks
            },
            validatedData.standardProperties || {}
          );
          
          if (!result.success) {
            throw new Error(result.error || 'Failed to update token');
          }
          
          console.log(`[TokenEditDialog] ERC1400 Token ${token.id} updated successfully using enhanced service`);
        } else {
          // For other token types, use the general updateToken function
          const result = await updateToken(token.id, validatedData);
          console.log(`[TokenEditDialog] Token ${token.id} updated successfully:`, result);
        }
        
        onSuccess();
      } catch (apiError: any) {
        console.error('[TokenEditDialog] API error updating token:', apiError);
        
        // Extract more detailed error information if available
        let errorMsg = 'An error occurred while updating the token';
        
        if (apiError.message) {
          errorMsg = apiError.message;
        }
        
        if (apiError.details) {
          errorMsg += `: ${JSON.stringify(apiError.details)}`;
        }
        
        setErrorMessage(errorMsg);
        onError(apiError);
      }
    } catch (error: any) {
      console.error('[TokenEditDialog] Error preparing token update:', error);
      setErrorMessage(error.message || 'An error occurred while preparing the token update');
      onError(error as Error);
    } finally {
      setIsSubmitting(false);
    }
  }, [token, onSuccess, onError]);

  // Handler for token deletion
  const handleDeleteToken = useCallback(async () => {
    if (!token || !onDelete) return;
    
    try {
      setIsDeleting(true);
      setErrorMessage(null);
      await onDelete(token.id);
      // Close both dialogs and notify success
      setDeleteDialogOpen(false);
      onOpenChange(false); // Close the main edit dialog
      onSuccess(); // Notify parent component of success
    } catch (error: any) {
      console.error('[TokenEditDialog] Error deleting token:', error);
      setErrorMessage(error.message || 'An error occurred while deleting the token');
      onError(error as Error);
    } finally {
      setIsDeleting(false);
    }
  }, [token, onDelete, onOpenChange, onSuccess, onError]);
  
  if (!token) return null;

  // Determine the appropriate configuration mode based on the token's data
  const hasAdvancedProperties = token.configurationLevel === 'advanced' || token.configurationLevel === 'max';
  const configMode = hasAdvancedProperties ? TokenConfigMode.MAX : TokenConfigMode.MIN;
  
  // Pre-calculated props - no hooks inside here
  const configProps = {
    token,
    onSave: handleSubmit,
    configMode,
    useAdvancedConfig: hasAdvancedProperties,
    isSubmitting
  };

  // Form rendering function with no hooks
  const renderEditForm = () => {
    const standard = token.standard.toUpperCase().replace('-', '');
    
    // Log the configuration mode for debugging
    console.log(`[TokenEditDialog] Rendering ${standard} edit form with ${configMode} configuration mode`);
    
    // Render the appropriate edit form based on the token standard
    switch (token.standard) {
      case TokenStandard.ERC20:
        return <ERC20EditForm {...configProps} />;
      case TokenStandard.ERC721:
        return <ERC721EditForm {...configProps} />;
      case TokenStandard.ERC1155:
        return <ERC1155EditForm {...configProps} />;
      case TokenStandard.ERC1400:
        return <ERC1400EditForm {...configProps} />;
      case TokenStandard.ERC3525:
        return <ERC3525EditForm {...configProps} />;
      case TokenStandard.ERC4626:
        return <ERC4626EditForm 
          token={token} 
          onSave={handleSubmit}
          projectId={token.projectId || ''}
          onSubmit={handleSubmit}
          configMode={configMode}
          isLoading={isSubmitting}
        />;
      default:
        return (
          <div className="p-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Unsupported Token Standard</AlertTitle>
              <AlertDescription>
                Editing for {token.standard} tokens is not currently supported.
              </AlertDescription>
            </Alert>
          </div>
        );
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-[75vw] max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Edit Token: {token.name}</DialogTitle>
            <DialogDescription>
              {token.symbol} • {token.standard}
            </DialogDescription>
          </DialogHeader>
          
          {errorMessage && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          
          {renderEditForm()}
          
          <DialogFooter className="flex justify-between">
            <div>
              {onDelete && (
                <Button 
                  variant="destructive" 
                  onClick={() => setDeleteDialogOpen(true)}
                  className="mr-2"
                  disabled={isSubmitting}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              )}
            </div>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Token</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this token? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                Deleting this token will permanently remove it from the system. If this token has been deployed to a blockchain, the token contract will still exist on-chain, but it will no longer be tracked in this application.
              </AlertDescription>
            </Alert>
          </div>
          
          {errorMessage && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteToken} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>Delete Token</>  
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TokenEditDialog;
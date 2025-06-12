import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  FileText,
  Edit,
  Trash2,
  Rocket,
  ExternalLink,
  Download,
  Copy,
  Pause,
  Play,
  RefreshCw,
  Workflow
} from 'lucide-react';
import { UnifiedTokenData, canEditToken, canDeployToken, canDeleteToken, isTokenDeployed } from '../utils/token-display-utils';
import { getStatusWorkflowInfo, getAvailableTransitions } from '../../services/tokenStatusService';

interface TokenActionsProps {
  token: UnifiedTokenData;
  onView?: (token: UnifiedTokenData) => void;
  onEdit?: (token: UnifiedTokenData) => void;
  onDelete?: (token: UnifiedTokenData) => void;
  onDeploy?: (token: UnifiedTokenData) => void;
  onUpdateStatus?: (token: UnifiedTokenData) => void;
  onExport?: (token: UnifiedTokenData) => void;
  onCopy?: (token: UnifiedTokenData) => void;
  onPause?: (token: UnifiedTokenData) => void;
  onResume?: (token: UnifiedTokenData) => void;
  onRefresh?: (token: UnifiedTokenData) => void;
  onViewOnExplorer?: (token: UnifiedTokenData) => void;
  layout?: 'horizontal' | 'vertical' | 'grid';
  showLabels?: boolean;
  compact?: boolean;
  disabled?: boolean;
}

const TokenActions: React.FC<TokenActionsProps> = ({
  token,
  onView,
  onEdit,
  onDelete,
  onDeploy,
  onUpdateStatus,
  onExport,
  onCopy,
  onPause,
  onResume,
  onRefresh,
  onViewOnExplorer,
  layout = 'horizontal',
  showLabels = true,
  compact = false,
  disabled = false
}) => {
  const statusStr = token.status?.toString().toUpperCase();
  const isDeployed = isTokenDeployed(token.status);
  const isPaused = statusStr === 'PAUSED';
  const canEdit = canEditToken(token.status) && !disabled;
  const canDeploy = canDeployToken(token.status) && !disabled;
  const canDelete = canDeleteToken(token.status) && !disabled;
  
  // Get workflow information for status transitions
  const workflowInfo = getStatusWorkflowInfo(token);
  const availableTransitions = getAvailableTransitions(token.status);

  // Action button configuration
  const actionButtons = [
    // View Details - Always available
    onView && {
      key: 'view',
      icon: FileText,
      label: 'View',
      tooltip: 'View complete token details',
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        onView(token);
      },
      variant: 'outline' as const,
      disabled: disabled
    },

    // Edit - Available for non-deployed tokens
    onEdit && canEdit && {
      key: 'edit',
      icon: Edit,
      label: 'Edit',
      tooltip: 'Edit token configuration',
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        onEdit(token);
      },
      variant: 'outline' as const,
      disabled: disabled
    },

    // Deploy - Available for approved tokens
    onDeploy && canDeploy && {
      key: 'deploy',
      icon: Rocket,
      label: 'Deploy',
      tooltip: 'Deploy token to blockchain',
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        onDeploy(token);
      },
      variant: 'default' as const,
      disabled: disabled
    },

    // View on Explorer - Available for deployed tokens with address
    onViewOnExplorer && isDeployed && token.address && {
      key: 'explorer',
      icon: ExternalLink,
      label: 'Explorer',
      tooltip: `View on ${token.blockchain} explorer`,
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        onViewOnExplorer(token);
      },
      variant: 'outline' as const,
      disabled: disabled
    },

    // Pause/Resume - Available for deployed tokens
    onPause && isDeployed && !isPaused && {
      key: 'pause',
      icon: Pause,
      label: 'Pause',
      tooltip: 'Pause token transfers',
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        onPause(token);
      },
      variant: 'outline' as const,
      disabled: disabled,
      className: 'text-orange-600 hover:text-orange-700'
    },

    onResume && isPaused && {
      key: 'resume',
      icon: Play,
      label: 'Resume',
      tooltip: 'Resume token transfers',
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        onResume(token);
      },
      variant: 'outline' as const,
      disabled: disabled,
      className: 'text-green-600 hover:text-green-700'
    },

    // Copy Address - Available for deployed tokens
    onCopy && isDeployed && token.address && {
      key: 'copy',
      icon: Copy,
      label: 'Copy',
      tooltip: 'Copy contract address',
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        onCopy(token);
      },
      variant: 'outline' as const,
      size: compact ? 'sm' as const : 'default' as const,
      disabled: disabled
    },

    // Export - Always available
    onExport && {
      key: 'export',
      icon: Download,
      label: 'Export',
      tooltip: 'Export token configuration',
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        onExport(token);
      },
      variant: 'outline' as const,
      disabled: disabled
    },

    // Refresh - Always available
    onRefresh && {
      key: 'refresh',
      icon: RefreshCw,
      label: 'Refresh',
      tooltip: 'Refresh token data',
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        onRefresh(token);
      },
      variant: 'outline' as const,
      disabled: disabled
    },

    // Status Workflow - Available when transitions are possible
    onUpdateStatus && workflowInfo.canTransition && {
      key: 'statusWorkflow',
      icon: Workflow,
      label: showLabels ? 'Status' : '',
      tooltip: `Current: ${workflowInfo.displayName}. Available transitions: ${availableTransitions.map(s => s.replace(/_/g, ' ')).join(', ')}`,
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        onUpdateStatus(token);
      },
      variant: 'outline' as const,
      disabled: disabled,
      className: 'text-indigo-600 hover:text-indigo-700 border-indigo-200 hover:border-indigo-300'
    },

    // Delete - Available for non-deployed tokens (always last)
    onDelete && canDelete && {
      key: 'delete',
      icon: Trash2,
      label: 'Delete',
      tooltip: 'Delete this token',
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete(token);
      },
      variant: 'destructive' as const,
      disabled: disabled
    }
  ].filter(Boolean);

  if (actionButtons.length === 0) {
    return null;
  }

  // Layout styles
  const layoutClasses = {
    horizontal: 'flex gap-2',
    vertical: 'flex flex-col gap-2',
    grid: 'grid grid-cols-2 gap-2'
  };

  const buttonSize = compact ? 'sm' : 'default';

  return (
    <TooltipProvider>
      <div className={layoutClasses[layout]}>
        {actionButtons.map((button) => {
          if (!button) return null;
          
          const IconComponent = button.icon;
          
          return (
            <Tooltip key={button.key}>
              <TooltipTrigger asChild>
                <Button
                  variant={button.variant}
                  size={button.size || buttonSize}
                  className={`${layout === 'horizontal' ? 'flex-1' : ''} ${button.className || ''}`}
                  onClick={button.onClick}
                  disabled={button.disabled}
                >
                  <IconComponent className={`${compact ? 'h-3 w-3' : 'h-4 w-4'} ${showLabels ? 'mr-2' : ''}`} />
                  {showLabels && button.label}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{button.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
};

export default TokenActions;
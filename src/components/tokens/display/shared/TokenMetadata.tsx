import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  Clock, 
  Link2,
  Layers,
  Settings,
  User,
  CheckCircle
} from 'lucide-react';

interface TokenMetadataProps {
  createdAt: string | Date;
  updatedAt?: string | Date;
  blockchain?: string;
  address?: string;
  configMode?: 'min' | 'max' | 'basic' | 'advanced';
  deployedBy?: string;
  projectId?: string;
  reviewers?: string[];
  approvals?: string[];
  version?: number;
  layout?: 'horizontal' | 'vertical';
  compact?: boolean;
  showSeparator?: boolean;
}

const TokenMetadata: React.FC<TokenMetadataProps> = ({
  createdAt,
  updatedAt,
  blockchain,
  address,
  configMode,
  deployedBy,
  projectId,
  reviewers = [],
  approvals = [],
  version,
  layout = 'vertical',
  compact = false,
  showSeparator = true
}) => {
  // Format date function
  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (compact) {
      return dateObj.toLocaleDateString();
    }
    
    return dateObj.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Truncate address for display
  const formatAddress = (addr: string) => {
    if (!addr) return '';
    if (compact) {
      return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    }
    return `${addr.slice(0, 10)}...${addr.slice(-8)}`;
  };

  // Calculate if the token was recently updated
  const isRecentlyUpdated = updatedAt && updatedAt !== createdAt;

  const metadataItems = [
    // Creation date - always shown
    {
      key: 'created',
      icon: Calendar,
      label: 'Created',
      value: formatDate(createdAt),
      className: 'text-gray-600'
    },

    // Update date - only if different from creation
    isRecentlyUpdated && {
      key: 'updated',
      icon: Clock,
      label: 'Updated',
      value: formatDate(updatedAt!),
      className: 'text-blue-600'
    },

    // Blockchain info
    blockchain && {
      key: 'blockchain',
      icon: Link2,
      label: 'Blockchain',
      value: blockchain,
      className: 'text-indigo-600'
    },

    // Contract address
    address && {
      key: 'address',
      icon: Link2,
      label: 'Address',
      value: formatAddress(address),
      className: 'text-green-600',
      copyable: true,
      fullValue: address
    },

    // Configuration mode
    configMode && {
      key: 'config',
      icon: Settings,
      label: 'Config Mode',
      value: configMode.charAt(0).toUpperCase() + configMode.slice(1),
      className: 'text-purple-600'
    },

    // Deployed by
    deployedBy && {
      key: 'deployedBy',
      icon: User,
      label: 'Deployed By',
      value: deployedBy,
      className: 'text-orange-600'
    },

    // Version
    version && {
      key: 'version',
      icon: Layers,
      label: 'Version',
      value: `v${version}`,
      className: 'text-gray-600'
    }
  ].filter(Boolean);

  // Handle copy to clipboard
  const handleCopy = (value: string) => {
    navigator.clipboard.writeText(value).catch(() => {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = value;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    });
  };

  if (metadataItems.length === 0) {
    return null;
  }

  const layoutClasses = {
    horizontal: 'flex flex-wrap gap-4',
    vertical: 'flex flex-col gap-1'
  };

  return (
    <>
      {showSeparator && !compact && <Separator className="my-4" />}
      
      <div className={`${compact ? 'text-xs' : 'text-sm'} text-gray-500`}>
        <div className={layoutClasses[layout]}>
          {metadataItems.map((item) => {
            if (!item) return null;
            
            const IconComponent = item.icon;
            
            return (
              <div 
                key={item.key} 
                className={`flex items-center gap-1 ${item.className} ${item.copyable ? 'cursor-pointer hover:bg-gray-50 px-1 py-0.5 rounded' : ''}`}
                onClick={item.copyable ? () => handleCopy(item.fullValue || item.value) : undefined}
                title={item.copyable ? `Click to copy: ${item.fullValue || item.value}` : undefined}
              >
                <IconComponent className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
                <span className="font-medium">{item.label}:</span>
                <span>{item.value}</span>
              </div>
            );
          })}
        </div>

        {/* Review and approval info */}
        {(reviewers.length > 0 || approvals.length > 0) && (
          <div className={`${layout === 'vertical' ? 'mt-2' : 'ml-4'} flex flex-wrap gap-2`}>
            {reviewers.length > 0 && (
              <div className="flex items-center gap-1">
                <User className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
                <span className="font-medium">Reviewers:</span>
                <span>{reviewers.length}</span>
              </div>
            )}
            
            {approvals.length > 0 && (
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
                <span className="font-medium">Approvals:</span>
                <span>{approvals.length}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default TokenMetadata;
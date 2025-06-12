import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Database, Upload, Download } from 'lucide-react';

interface OperationsDashboardLinkProps {
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

export const OperationsDashboardLink: React.FC<OperationsDashboardLinkProps> = ({
  className = '',
  variant = 'default',
  size = 'default'
}) => {
  return (
    <Button 
      variant={variant}
      size={size}
      className={className}
      asChild
    >
      <Link to="/compliance/operations/dashboard">
        <Database className="mr-2 h-4 w-4" />
        Operations Dashboard
      </Link>
    </Button>
  );
};

export const BulkUploadLink: React.FC<OperationsDashboardLinkProps> = ({
  className = '',
  variant = 'outline',
  size = 'default'
}) => {
  return (
    <Button 
      variant={variant}
      size={size}
      className={className}
      asChild
    >
      <Link to="/compliance/operations/dashboard">
        <Upload className="mr-2 h-4 w-4" />
        Bulk Upload
      </Link>
    </Button>
  );
};

export const DataExportLink: React.FC<OperationsDashboardLinkProps> = ({
  className = '',
  variant = 'outline',
  size = 'default'
}) => {
  return (
    <Button 
      variant={variant}
      size={size}
      className={className}
      asChild
    >
      <Link to="/compliance/operations/dashboard">
        <Download className="mr-2 h-4 w-4" />
        Export Data
      </Link>
    </Button>
  );
};
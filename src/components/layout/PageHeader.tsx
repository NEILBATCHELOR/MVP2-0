import React, { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

/**
 * PageHeader component
 * Provides a consistent layout for page headers with title, description, and action buttons
 */
const PageHeader: React.FC<PageHeaderProps> = ({ 
  title, 
  description, 
  actions 
}) => {
  return (
    <div className="flex justify-between items-start pb-4 border-b mb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center space-x-2">
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
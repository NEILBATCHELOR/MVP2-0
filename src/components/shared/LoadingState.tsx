import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  message?: string;
  className?: string;
  title?: string;
  description?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({
  message = "Loading data...",
  className = "",
  title,
  description,
}) => {
  // If title and description are provided, use them instead of message
  const displayMessage = description || message;
  
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 ${className}`}
    >
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      {title && <h3 className="text-lg font-medium mb-2">{title}</h3>}
      <p className="text-muted-foreground text-sm">{displayMessage}</p>
    </div>
  );
};

export default LoadingState;

/**
 * JSON Viewer Component
 * 
 * A component for rendering JSON data with syntax highlighting
 */
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';

interface JsonViewerProps {
  data: string;
}

export const JsonViewer: React.FC<JsonViewerProps> = ({ data }) => {
  const [copied, setCopied] = useState(false);

  // Handle copying data to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(data);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Try to parse and format the JSON
  let formattedJson = '';
  let isValidJson = true;

  try {
    // Parse the JSON to make sure it's valid
    const parsed = JSON.parse(data);
    // Format with indentation
    formattedJson = JSON.stringify(parsed, null, 2);
  } catch (error) {
    isValidJson = false;
    formattedJson = data;
  }

  return (
    <div className="relative">
      <Button
        size="sm"
        variant="ghost"
        onClick={copyToClipboard}
        className="absolute top-2 right-2 z-10"
      >
        {copied ? (
          <Check className="h-4 w-4" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>

      <pre
        className={`bg-slate-50 p-4 rounded-md text-sm font-mono h-96 overflow-auto ${
          !isValidJson ? 'text-red-500' : ''
        }`}
      >
        {formattedJson}
      </pre>
    </div>
  );
};
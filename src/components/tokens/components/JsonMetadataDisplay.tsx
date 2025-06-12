import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface JsonMetadataDisplayProps {
  data: Record<string, any> | string;
  title?: string;
  className?: string;
}

/**
 * Component to display JSON metadata in a human-readable format
 */
const JsonMetadataDisplay: React.FC<JsonMetadataDisplayProps> = ({
  data,
  title,
  className = ''
}) => {
  // Parse string data if needed
  const jsonData = typeof data === 'string' ? 
    (() => {
      try {
        return JSON.parse(data);
      } catch (e) {
        return data;
      }
    })() : data;
  
  // If it's still a string after parsing attempt, just display it
  if (typeof jsonData === 'string') {
    return (
      <div className={`rounded-md ${className}`}>
        {title && <h3 className="text-sm font-medium mb-2">{title}</h3>}
        <div className="text-sm bg-gray-50 p-3 rounded-md border border-gray-200 overflow-x-auto">
          {jsonData}
        </div>
      </div>
    );
  }
  
  // Render a key-value table for objects
  return (
    <div className={`rounded-md ${className}`}>
      {title && <h3 className="text-sm font-medium mb-2">{title}</h3>}
      <div className="bg-gray-50 rounded-md border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <tbody>
            {Object.entries(jsonData).map(([key, value]) => (
              <tr key={key} className="border-b border-gray-200 last:border-0">
                <td className="py-2 px-3 font-medium bg-gray-100 w-1/3 align-top break-words">
                  {key}
                </td>
                <td className="py-2 px-3 break-words">
                  {renderValue(value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/**
 * Helper function to render different types of values
 */
const renderValue = (value: any): React.ReactNode => {
  if (value === null || value === undefined) {
    return <span className="text-gray-400">None</span>;
  }
  
  if (typeof value === 'boolean') {
    return value ? 
      <span className="text-green-600 font-medium">Yes</span> : 
      <span className="text-red-600 font-medium">No</span>;
  }
  
  if (typeof value === 'number') {
    return <span>{value.toLocaleString()}</span>;
  }
  
  if (typeof value === 'string') {
    // Check if it's a URL
    if (value.startsWith('http://') || value.startsWith('https://')) {
      return (
        <a 
          href={value} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          {value}
        </a>
      );
    }
    
    // Check if it's JSON
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === 'object' && parsed !== null) {
        return <NestedJsonDisplay data={parsed} />;
      }
    } catch (e) {
      // Not JSON, continue
    }
    
    return <span>{value}</span>;
  }
  
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-gray-400">Empty array</span>;
    }
    
    return (
      <div className="pl-2 border-l-2 border-gray-300">
        {value.map((item, index) => (
          <div key={index} className="mb-1 last:mb-0">
            <span className="text-gray-500 mr-1">{index}:</span>
            {renderValue(item)}
          </div>
        ))}
      </div>
    );
  }
  
  if (typeof value === 'object') {
    return <NestedJsonDisplay data={value} />;
  }
  
  return <span>{String(value)}</span>;
};

/**
 * Component to display nested JSON objects
 */
const NestedJsonDisplay: React.FC<{ data: Record<string, any> }> = ({ data }) => {
  return (
    <div className="pl-2 border-l-2 border-gray-300">
      {Object.entries(data).map(([key, value]) => (
        <div key={key} className="mb-1 last:mb-0">
          <span className="text-gray-500 font-medium mr-1">{key}:</span>
          {renderValue(value)}
        </div>
      ))}
    </div>
  );
};

export default JsonMetadataDisplay;
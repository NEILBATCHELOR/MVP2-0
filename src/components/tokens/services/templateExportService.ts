/**
 * Template Export/Import Service
 * 
 * Provides utilities for exporting and importing token templates
 */
import { TokenStandard } from '@/types/core/centralModels';
import { createTemplate, updateTemplate } from './templateService';

// Template export interface
export interface ExportedTemplate {
  name: string;
  description: string;
  tokens: Array<{
    id: string;
    name: string;
    standard: TokenStandard;
    config: Record<string, any>;
  }>;
  relationships: Array<{
    source: string;
    target: string;
    type: string;
  }>;
  metadata?: Record<string, any>;
  version: string;
  exportedAt: string;
}

/**
 * Export a template to JSON format
 * @param template The template to export
 * @returns A downloadable JSON blob
 */
export const exportTemplateToJson = (template: any): Blob => {
  // Create a standardized export format
  const exportData: ExportedTemplate = {
    name: template.name,
    description: template.description,
    tokens: template.tokens.map((token: any) => ({
      id: token.id,
      name: token.name,
      standard: token.standard,
      config: token.config || {}
    })),
    relationships: template.relationships,
    metadata: template.metadata || {},
    version: '1.0.0', // Template format version
    exportedAt: new Date().toISOString()
  };
  
  // Convert to JSON string with nice formatting
  const jsonString = JSON.stringify(exportData, null, 2);
  
  // Create a Blob with the JSON data
  return new Blob([jsonString], { type: 'application/json' });
};

/**
 * Trigger a file download for the exported template
 * @param template The template to export
 * @param filename Optional custom filename
 */
export const downloadTemplateJson = (template: any, filename?: string): void => {
  const blob = exportTemplateToJson(template);
  const exportFilename = filename || `${template.name.replace(/\s+/g, '_')}_template.json`;
  
  // Create a URL for the Blob
  const url = URL.createObjectURL(blob);
  
  // Create a temporary anchor element to trigger the download
  const a = document.createElement('a');
  a.href = url;
  a.download = exportFilename;
  document.body.appendChild(a);
  
  // Trigger the download
  a.click();
  
  // Clean up
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Parse an imported template JSON file
 * @param file The uploaded JSON file
 * @returns Promise resolving to the parsed template data
 */
export const parseTemplateJson = async (file: File): Promise<ExportedTemplate> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const jsonData = JSON.parse(event.target?.result as string);
        
        // Basic validation of imported data
        if (!jsonData.name || !jsonData.tokens || !Array.isArray(jsonData.tokens)) {
          throw new Error('Invalid template format: Missing required fields');
        }
        
        resolve(jsonData);
      } catch (error) {
        reject(new Error(`Failed to parse template JSON: ${error instanceof Error ? error.message : String(error)}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading the file'));
    };
    
    reader.readAsText(file);
  });
};

/**
 * Import a template from a parsed JSON and save it to the database
 * @param projectId The project ID to import the template to
 * @param templateData The parsed template data
 * @param options Import options
 * @returns Promise resolving to the imported template ID
 */
export const importTemplateToProject = async (
  projectId: string,
  templateData: ExportedTemplate,
  options: { 
    generateNewIds?: boolean;
    customName?: string;
  } = {}
): Promise<string> => {
  try {
    // Prepare template data for import
    const importData = {
      name: options.customName || `${templateData.name} (Imported)`,
      description: templateData.description,
      tokens: templateData.tokens.map(token => ({
        ...token,
        // Generate new IDs if requested
        id: options.generateNewIds ? `${token.standard.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}` : token.id
      })),
      relationships: templateData.relationships,
      metadata: {
        ...templateData.metadata,
        imported: true,
        importedAt: new Date().toISOString(),
        originalName: templateData.name
      }
    };
    
    // Create new template in the project
    const result = await createTemplate(projectId, importData);
    return result.id;
  } catch (error) {
    throw new Error(`Failed to import template: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Create a shareable URL for a template
 * Uses base64 encoding for simplicity
 * @param template The template to share
 * @returns A shareable URL string
 */
export const createShareableTemplateUrl = (template: any): string => {
  const exportData = {
    name: template.name,
    description: template.description,
    tokens: template.tokens,
    relationships: template.relationships,
    metadata: template.metadata || {}
  };
  
  // Convert to JSON string and base64 encode
  const jsonString = JSON.stringify(exportData);
  const base64 = btoa(encodeURIComponent(jsonString));
  
  // Create the URL with the template data as a parameter
  const url = new URL(window.location.href);
  url.pathname = '/templates/import';
  url.searchParams.set('data', base64);
  
  return url.toString();
};

/**
 * Parse a shareable template URL
 * @param url The shareable URL
 * @returns The parsed template data
 */
export const parseShareableTemplateUrl = (url: string): ExportedTemplate | null => {
  try {
    const parsedUrl = new URL(url);
    const base64Data = parsedUrl.searchParams.get('data');
    
    if (!base64Data) {
      return null;
    }
    
    // Decode base64 and parse JSON
    const jsonString = decodeURIComponent(atob(base64Data));
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Failed to parse template URL:', error);
    return null;
  }
};

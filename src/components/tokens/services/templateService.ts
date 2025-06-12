import { supabase } from '@/infrastructure/database/client';
import { v4 as uuidv4 } from 'uuid';

/**
 * Get a list of templates for a project
 */
export const getTemplates = async (projectId: string) => {
  const { data, error } = await supabase
    .from('token_templates')
    .select('*')
    .eq('project_id', projectId)
    .order('updated_at', { ascending: false });
  
  if (error) {
    throw new Error(`Error fetching templates: ${error.message}`);
  }
  
  return data.map(template => {
    // Safely extract tokens and relationships from blocks (which is Json)
    let tokens = [];
    let relationships = [];
    
    if (template.blocks && typeof template.blocks === 'object') {
      tokens = (template.blocks as any).tokens || [];
      relationships = (template.blocks as any).relationships || [];
    }
    
    return {
      id: template.id,
      name: template.name,
      description: template.description,
      tokens,
      relationships,
      created_at: template.created_at,
      updated_at: template.updated_at
    };
  });
};

/**
 * Get a specific template by ID
 */
export const getTemplate = async (templateId: string) => {
  const { data, error } = await supabase
    .from('token_templates')
    .select('*')
    .eq('id', templateId)
    .single();
  
  if (error) {
    throw new Error(`Error fetching template: ${error.message}`);
  }
  
  // Safely extract tokens and relationships from blocks (which is Json)
  let tokens = [];
  let relationships = [];
  
  if (data.blocks && typeof data.blocks === 'object') {
    tokens = (data.blocks as any).tokens || [];
    relationships = (data.blocks as any).relationships || [];
  }
  
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    tokens,
    relationships,
    metadata: data.metadata || {},
    created_at: data.created_at,
    updated_at: data.updated_at
  };
};

/**
 * Create a new template
 */
export const createTemplate = async (projectId: string, templateData: any) => {
  // Ensure we have the required standard field
  const standard = templateData.standard || 'DEFAULT';
  
  const { data, error } = await supabase
    .from('token_templates')
    .insert({
      id: uuidv4(),
      project_id: projectId,
      name: templateData.name,
      description: templateData.description,
      blocks: templateData.blocks,
      metadata: templateData.metadata,
      standard: standard // Add required standard field
    })
    .select()
    .single();
  
  if (error) {
    throw new Error(`Error creating template: ${error.message}`);
  }
  
  return data;
};

/**
 * Update an existing template
 */
export const updateTemplate = async (templateId: string, templateData: any) => {
  const { data, error } = await supabase
    .from('token_templates')
    .update({
      name: templateData.name,
      description: templateData.description,
      blocks: templateData.blocks,
      metadata: templateData.metadata,
      updated_at: new Date().toISOString()
    })
    .eq('id', templateId)
    .select()
    .single();
  
  if (error) {
    throw new Error(`Error updating template: ${error.message}`);
  }
  
  return data;
};

/**
 * Delete a template
 */
export const deleteTemplate = async (templateId: string) => {
  const { error } = await supabase
    .from('token_templates')
    .delete()
    .eq('id', templateId);
  
  if (error) {
    throw new Error(`Error deleting template: ${error.message}`);
  }
  
  return true;
};

/**
 * Create a token from a template
 */
export const createTokenFromTemplate = async (projectId: string, templateId: string) => {
  try {
    // First, fetch the template
    const template = await getTemplate(templateId);
    
    // For simplicity, we'll create just one token from the template
    // In a real implementation, this would create multiple tokens based on the template structure
    const mainToken = template.tokens[0] || {};
    
    // Insert a new token
    const { data, error } = await supabase
      .from('tokens')
      .insert({
        id: uuidv4(),
        project_id: projectId,
        name: `${template.name} Token`,
        symbol: mainToken.name?.substring(0, 5).toUpperCase() || 'TKN',
        standard: mainToken.standard,
        decimals: mainToken.config?.decimals || 18,
        blocks: mainToken.config || {},
        metadata: {
          description: template.description,
          from_template: templateId,
          template_name: template.name
        },
        status: 'DRAFT'
      })
      .select()
      .single();
      
    if (error) {
      throw new Error(`Error creating token from template: ${error.message}`);
    }
    
    return data;
  } catch (error: any) {
    throw new Error(`Failed to create token from template: ${error.message}`);
  }
};
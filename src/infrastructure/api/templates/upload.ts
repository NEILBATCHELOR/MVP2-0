import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

/**
 * API route for uploading a template JSON file
 * 
 * @param req - Express request object
 * @param res - Express response object
 */
export default function handler(req: Request, res: Response) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { content, category, filename, projectId } = req.body;
    
    if (!content || !category || !filename) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    // Validate JSON content
    try {
      const parsedContent = JSON.parse(content);
      
      // Basic validation - template should have name and metadata
      if (!parsedContent.name || !parsedContent.metadata) {
        return res.status(400).json({ error: 'Invalid template format: missing name or metadata' });
      }
      
      // If a project ID was provided, add it to the template
      if (projectId) {
        parsedContent.projectId = projectId;
      }
      
      // Add template source information
      parsedContent.metadata = {
        ...parsedContent.metadata,
        templateSource: {
          category,
          filename,
          uploadedAt: new Date().toISOString()
        }
      };
      
      // Ensure the directory exists
      const dirPath = path.join(process.cwd(), 'src', 'components', 'tokens', 'templates', category);
      
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      
      // Save the file
      const filePath = path.join(dirPath, filename);
      fs.writeFileSync(filePath, JSON.stringify(parsedContent, null, 2));
      
      return res.status(200).json({
        success: true,
        path: `${category}/${filename}`
      });
    } catch (jsonError) {
      return res.status(400).json({ error: 'Invalid JSON format' });
    }
  } catch (error) {
    console.error('Error uploading template:', error);
    return res.status(500).json({ error: 'Failed to upload template' });
  }
}
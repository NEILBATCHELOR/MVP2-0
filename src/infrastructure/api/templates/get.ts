import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

/**
 * API route to get a template file's content by path
 * 
 * @param req - Express request object
 * @param res - Express response object
 */
export default function handler(req: Request, res: Response) {
  const { path: templatePath } = req.query;
  
  if (!templatePath) {
    return res.status(400).json({ error: 'Missing required parameter: path' });
  }
  
  // Extract category and filename from the path
  const [category, filename] = (templatePath as string).split('/');
  
  if (!category || !filename) {
    return res.status(400).json({ error: 'Invalid path format. Expected: category/filename' });
  }
  
  // Calculate the full file path
  const filePath = path.join(process.cwd(), 'src', 'components', 'tokens', 'templates', category, filename);
  
  try {
    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: `Template file not found: ${templatePath}` });
    }
    
    // Read the file content
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Parse the JSON content
    try {
      const jsonContent = JSON.parse(fileContent);
      return res.status(200).json(jsonContent);
    } catch (parseError) {
      return res.status(400).json({ error: 'Invalid JSON content in template file' });
    }
  } catch (error) {
    console.error(`Error reading template file: ${templatePath}`, error);
    return res.status(500).json({ error: 'Failed to read template file' });
  }
}
import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

/**
 * API route to list template files in a category directory
 * 
 * @param req - Express request object
 * @param res - Express response object
 */
export default function handler(req: Request, res: Response) {
  const { category, standard } = req.query;
  
  if (!category || !standard) {
    return res.status(400).json({ error: 'Missing required parameters: category and standard' });
  }
  
  // Calculate the template directory path - adjust as needed for your server setup
  const templateDir = path.join(process.cwd(), 'src', 'components', 'tokens', 'templates', category as string);
  
  try {
    // Check if the directory exists
    if (!fs.existsSync(templateDir)) {
      return res.status(404).json({ error: `Category directory '${category}' not found` });
    }
    
    // Read all files in the directory
    const files = fs.readdirSync(templateDir);
    
    // Filter files to only include JSON files matching the standard
    const standardKey = standard as string;
    const templateFiles = files.filter(file => {
      return (
        file.endsWith('.json') && 
        (file.includes(standardKey) || 
         // Special case for ERC standards with different naming patterns
         (standardKey === 'ERC20' && file.includes('ERC-20')) ||
         (standardKey === 'ERC721' && file.includes('ERC-721')) ||
         (standardKey === 'ERC1155' && file.includes('ERC-1155')) ||
         (standardKey === 'ERC1400' && file.includes('ERC-1400')) ||
         (standardKey === 'ERC3525' && file.includes('ERC-3525')) ||
         (standardKey === 'ERC4626' && file.includes('ERC-4626'))
        )
      );
    });
    
    return res.status(200).json(templateFiles);
  } catch (error) {
    console.error(`Error listing templates in ${category} for ${standard}:`, error);
    return res.status(500).json({ error: 'Failed to list template files' });
  }
}
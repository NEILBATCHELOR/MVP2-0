import { Router } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { promisify } from 'util';

const router = Router();
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

// Base directory for the JSON_Products folder
// Note: Using path.resolve with __dirname to get the absolute path
const BASE_DIR = path.resolve(process.cwd(), 'src/components/tokens/JSON_Products');

/**
 * Get directory contents
 * @route GET /api/v1/filesystem
 * @param {string} path - The relative path from the base directory
 * @returns {Object} Directory contents
 */
router.get('/', async (req, res) => {
  try {
    const relativePath = req.query.path as string || '';
    
    // Sanitize and validate the path to prevent directory traversal attacks
    const requestedPath = relativePath.startsWith('/') 
      ? relativePath.substring(1) // Remove leading slash if present
      : relativePath;
    
    // Ensure the requested path is within the JSON_Products folder
    if (requestedPath.includes('..') || !requestedPath.startsWith('src/components/tokens/JSON_Products')) {
      return res.status(403).json({ 
        error: 'Access denied',
        message: 'You can only access files within the JSON_Products directory'
      });
    }
    
    // Get the absolute path
    const targetPath = path.resolve(process.cwd(), requestedPath);
    
    // Verify the path exists
    try {
      await stat(targetPath);
    } catch (err) {
      return res.status(404).json({
        error: 'Path not found',
        message: `The requested path does not exist: ${relativePath}`
      });
    }
    
    // Read directory contents
    const items = await readdir(targetPath, { withFileTypes: true });
    
    // Convert to a normalized format
    const result = items.map(item => ({
      name: item.name,
      type: item.isDirectory() ? 'directory' : 'file',
      path: path.join(relativePath, item.name)
    }));
    
    return res.json(result);
  } catch (error) {
    console.error('Filesystem API error:', error);
    return res.status(500).json({
      error: 'Server error',
      message: 'Failed to read directory contents'
    });
  }
});

export default router;
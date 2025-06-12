#!/usr/bin/env node
/**
 * Type Mapper Generator
 * 
 * This script generates type mapper functions for converting between
 * database types and domain types.
 * 
 * Usage:
 *   npm run types:generate-mapper -- --table=users --domain=User
 *   
 * Add to package.json:
 *   "scripts": {
 *     "types:generate-mapper": "NODE_OPTIONS=\"--loader ts-node/esm\" ts-node --esm scripts/generate-type-mappers.ts"
 *   }
 */

import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import readline from 'readline';

// Get current file directory (ESM equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const args = parseArgs(process.argv.slice(2));

// Check if required arguments are provided and are strings
if (!args.table || !args.domain || typeof args.table !== 'string' || typeof args.domain !== 'string') {
  console.log(chalk.yellow('Usage: npm run types:generate-mapper -- --table=table_name --domain=DomainType'));
  process.exit(0);
}

// Now TypeScript knows these are strings
const tableName: string = args.table;
const domainType: string = args.domain;

// Configuration
const CONFIG = {
  paths: {
    database: path.resolve(__dirname, '../src/types/database.ts'),
    centralModels: path.resolve(__dirname, '../src/types/centralModels.ts'),
    typeMappers: path.resolve(__dirname, '../src/utils/formatting/typeMappers.ts'),
  }
};

/**
 * Main function
 */
async function generateTypeMapper() {
  console.log(chalk.blue('🔄 Type Mapper Generator'));
  console.log(chalk.blue('======================'));
  console.log(chalk.green(`Generating mapper for table '${tableName}' to domain type '${domainType}'`));

  try {
    // Read files
    const databaseContent = await fs.promises.readFile(CONFIG.paths.database, 'utf8');
    const centralModelsContent = await fs.promises.readFile(CONFIG.paths.centralModels, 'utf8');
    
    let typeMapperContent = '';
    try {
      typeMapperContent = await fs.promises.readFile(CONFIG.paths.typeMappers, 'utf8');
    } catch (err) {
      console.log(chalk.yellow(`⚠️  Could not read typeMappers.ts: ${err instanceof Error ? err.message : String(err)}`));
      console.log(chalk.yellow('Creating a new typeMappers.ts file...'));
      typeMapperContent = `/**
 * Type Mappers
 * 
 * This file contains functions to map between database types and domain types.
 * It handles the conversion between snake_case and camelCase naming conventions.
 */

/**
 * Converts an object with snake_case keys to camelCase keys
 */
export function toCamelCase<T extends Record<string, any>>(obj: T): Record<string, any> {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  
  return Object.keys(obj).reduce((result, key) => {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = obj[key];
    return result;
  }, {} as Record<string, any>);
}

/**
 * Converts an object with camelCase keys to snake_case keys
 */
export function toSnakeCase<T extends Record<string, any>>(obj: T): Record<string, any> {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  
  return Object.keys(obj).reduce((result, key) => {
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    result[snakeKey] = obj[key];
    return result;
  }, {} as Record<string, any>);
}
`;
    }

    // Verify types exist
    const dbTypeExists = verifyDatabaseType(databaseContent, tableName);
    const domainTypeExists = verifyDomainType(centralModelsContent, domainType);

    if (!dbTypeExists) {
      console.error(chalk.red(`❌ Database type for '${tableName}' not found in database.ts`));
      process.exit(1);
    }

    if (!domainTypeExists) {
      console.error(chalk.red(`❌ Domain type '${domainType}' not found in centralModels.ts`));
      process.exit(1);
    }

    // Generate mapper code
    const mapperCode = generateMapperCode(tableName, domainType);
    console.log(chalk.blue('\n📝 Generated type mapper:'));
    console.log(mapperCode);

    // Check if mapper already exists
    const mapperExists = typeMapperContent.includes(`map${domainType}FromDatabase`) || 
                         typeMapperContent.includes(`map${domainType}ToCamelCase`) ||
                         typeMapperContent.includes(`map${domainType}ToDatabase`) ||
                         typeMapperContent.includes(`map${domainType}ToSnakeCase`);
    
    if (mapperExists) {
      console.log(chalk.yellow(`\n⚠️  A mapper for ${domainType} already exists in typeMappers.ts`));
      return;
    }

    // Optionally update the file
    const shouldUpdate = await promptYesNo('Would you like to add this mapper to typeMappers.ts?');
    
    if (shouldUpdate) {
      await updateTypeMapperFile(typeMapperContent, mapperCode);
      console.log(chalk.green('✅ typeMappers.ts has been updated!'));
    }
  } catch (error) {
    console.error(chalk.red(`❌ Error: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
}

/**
 * Verify database type exists
 */
function verifyDatabaseType(content: string, table: string): boolean {
  const pascalCase = toPascalCase(table);
  const pattern = new RegExp(`export\\s+type\\s+${pascalCase}Table\\s+=`);
  return pattern.test(content);
}

/**
 * Verify domain type exists
 */
function verifyDomainType(content: string, domainType: string): boolean {
  const pattern = new RegExp(`export\\s+(interface|type)\\s+${domainType}\\b`);
  return pattern.test(content);
}

/**
 * Generate mapper code
 */
function generateMapperCode(table: string, domainType: string): string {
  const pascalCase = toPascalCase(table);
  
  return `
/**
 * Maps database ${table} to application ${domainType} model
 * @param db${domainType} - Database ${table} object
 * @returns Application ${domainType} model
 */
export const map${domainType}FromDatabase = (db${domainType}: ${pascalCase}Table): ${domainType} => {
  const camelCase${domainType} = toCamelCase(db${domainType});
  
  return {
    id: db${domainType}.id,
    createdAt: db${domainType}.created_at,
    updatedAt: db${domainType}.updated_at,
    ...camelCase${domainType},
  } as ${domainType};
};

/**
 * Maps application ${domainType} model to database format
 * @param ${toCamelCase(domainType)} - Application ${domainType} model
 * @returns Database ${table} object
 */
export const map${domainType}ToDatabase = (${toCamelCase(domainType)}: Partial<${domainType}>): Partial<${pascalCase}Insert> => {
  const { id, createdAt, updatedAt, ...rest } = ${toCamelCase(domainType)} as any;
  
  const snakeCaseData = toSnakeCase(rest);
  
  return snakeCaseData;
};
`.trim();
}

/**
 * Update typeMappers.ts with new mapper
 */
async function updateTypeMapperFile(currentContent: string, codeToAdd: string): Promise<void> {
  // Find a good place to insert the new code
  // Look for the last import statement or function
  const lastFunctionMatch = currentContent.match(/export\s+(const|function)\s+\w+/g);
  
  let updatedContent;
  
  if (lastFunctionMatch) {
    const lastMatch = lastFunctionMatch[lastFunctionMatch.length - 1];
    // Find the end of the function
    const lastMatchIndex = currentContent.lastIndexOf(lastMatch);
    const functionEndIndex = findFunctionEnd(currentContent, lastMatchIndex);
    
    if (functionEndIndex !== -1) {
      updatedContent = 
        currentContent.substring(0, functionEndIndex + 1) + 
        '\n\n' + codeToAdd +
        currentContent.substring(functionEndIndex + 1);
    } else {
      // If can't find function end, append to the end
      updatedContent = currentContent + '\n\n' + codeToAdd;
    }
  } else {
    // If no match found, append to the end
    updatedContent = currentContent + '\n\n' + codeToAdd;
  }
  
  // Ensure directory exists
  const typeMapperDir = path.dirname(CONFIG.paths.typeMappers);
  await fs.promises.mkdir(typeMapperDir, { recursive: true });
  
  // Write the file
  await fs.promises.writeFile(CONFIG.paths.typeMappers, updatedContent, 'utf8');
}

/**
 * Find the end of a function in the content
 */
function findFunctionEnd(content: string, startIndex: number): number {
  let braceCount = 0;
  let inFunction = false;
  
  for (let i = startIndex; i < content.length; i++) {
    const char = content[i];
    
    if (char === '{') {
      braceCount++;
      inFunction = true;
    } else if (char === '}') {
      braceCount--;
      
      if (inFunction && braceCount === 0) {
        return i;
      }
    }
  }
  
  return -1;
}

/**
 * Convert snake_case to PascalCase
 */
function toPascalCase(str: string): string {
  return str
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

/**
 * Convert PascalCase to camelCase
 */
function toCamelCase(str: string): string {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

/**
 * Parse command line arguments
 */
function parseArgs(args: string[]): Record<string, string | boolean> {
  const result: Record<string, string | boolean> = {};
  
  for (const arg of args) {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      if (key) {
        result[key] = value || true;
      }
    }
  }
  
  return result;
}

/**
 * Prompt for yes/no answer
 */
async function promptYesNo(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(`${question} (y/n) `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

// Run the script
generateTypeMapper().catch(err => {
  console.error(chalk.red(`❌ Unhandled error: ${err instanceof Error ? err.message : String(err)}`));
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  console.error(chalk.red(`❌ Unhandled rejection: ${reason instanceof Error ? reason.message : String(reason)}`));
  process.exit(1);
});
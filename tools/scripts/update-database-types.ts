#!/usr/bin/env node
/**
 * Database Types Update Script
 * 
 * This script helps update database.ts when supabase.ts changes.
 * It identifies new tables in supabase.ts and suggests additions to database.ts.
 * 
 * Usage:
 *   npm run types:update-db
 *   
 * Add to package.json:
 *   "scripts": {
 *     "types:update-db": "NODE_OPTIONS=\"--loader ts-node/esm\" ts-node --esm scripts/update-database-types.ts"
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

// Configuration
const CONFIG = {
  paths: {
    supabase: path.resolve(__dirname, '../src/types/supabase.ts'),
    database: path.resolve(__dirname, '../src/types/database.ts'),
  },
  patterns: {
    tableType: /export\s+type\s+(\w+)Table\s+=\s+Tables<['"](\w+)['"]\>/g,
  }
};

/**
 * Main function
 */
async function updateDatabaseTypes() {
  console.log(chalk.blue('🔄 Database Types Update'));
  console.log(chalk.blue('======================='));

  try {
    // Read files
    const supabaseContent = await fs.promises.readFile(CONFIG.paths.supabase, 'utf8');
    const databaseContent = await fs.promises.readFile(CONFIG.paths.database, 'utf8');

    // Extract tables from supabase.ts
    const supabaseTables = extractSupabaseTables(supabaseContent);
    console.log(chalk.green(`Found ${supabaseTables.length} tables in supabase.ts`));

    // Extract existing table types from database.ts
    const existingTableTypes = extractExistingTableTypes(databaseContent);
    console.log(chalk.green(`Found ${existingTableTypes.length} table types in database.ts`));

    // Find missing table types
    const missingTables = findMissingTables(supabaseTables, existingTableTypes);
    
    if (missingTables.length === 0) {
      console.log(chalk.green('✅ All tables from supabase.ts are already in database.ts'));
      return;
    }

    console.log(chalk.yellow(`\n⚠️  Found ${missingTables.length} tables in supabase.ts that are not in database.ts:`));
    missingTables.forEach(table => console.log(chalk.yellow(`  - ${table}`)));

    // Generate code to add to database.ts
    const codeToAdd = generateTypeDefinitions(missingTables);
    console.log(chalk.blue('\n📝 Add the following to database.ts:'));
    console.log(codeToAdd);

    // Optionally update the file automatically
    const shouldUpdate = await promptYesNo('Would you like to update database.ts automatically?');
    
    if (shouldUpdate) {
      await updateDatabaseFile(databaseContent, codeToAdd);
      console.log(chalk.green('✅ database.ts has been updated!'));
    }
  } catch (error) {
    console.error(chalk.red(`❌ Error: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
}

/**
 * Extract table names from supabase.ts
 */
function extractSupabaseTables(content: string): string[] {
  // This is a simplified extraction - in a real implementation,
  // you would use the TypeScript Compiler API for more accurate parsing
  const tablePattern = /['"]Tables['"]\s*:\s*\{([^}]*)\}/g;
  const tableMatch = tablePattern.exec(content);
  
  if (!tableMatch) {
    console.error(chalk.red('❌ Could not find Tables definition in supabase.ts'));
    return [];
  }

  const tableSection = tableMatch[1];
  const tableNamePattern = /['"](\w+)['"]/g;
  const tables: string[] = [];
  
  let match;
  while ((match = tableNamePattern.exec(tableSection)) !== null) {
    tables.push(match[1]);
  }
  
  return tables;
}

/**
 * Extract existing table types from database.ts
 */
function extractExistingTableTypes(content: string): string[] {
  const tableTypes: string[] = [];
  let match;
  
  // Reset the regex before using it
  CONFIG.patterns.tableType.lastIndex = 0;
  
  while ((match = CONFIG.patterns.tableType.exec(content)) !== null) {
    tableTypes.push(match[2]); // The table name from Tables<'table_name'>
  }
  
  return tableTypes;
}

/**
 * Find tables in supabase.ts that are not in database.ts
 */
function findMissingTables(supabaseTables: string[], existingTableTypes: string[]): string[] {
  return supabaseTables.filter(table => !existingTableTypes.includes(table));
}

/**
 * Generate type definitions for missing tables
 */
function generateTypeDefinitions(missingTables: string[]): string {
  let code = '// Generated types for new tables\n';
  
  for (const table of missingTables) {
    const pascalCase = toPascalCase(table);
    code += `export type ${pascalCase}Table = Tables<'${table}'>;\n`;
    code += `export type ${pascalCase}Insert = InsertTables<'${table}'>;\n`;
    code += `export type ${pascalCase}Update = UpdateTables<'${table}'>;\n\n`;
  }
  
  return code;
}

/**
 * Update database.ts with new type definitions
 */
async function updateDatabaseFile(currentContent: string, codeToAdd: string): Promise<void> {
  // Find a good place to insert the new code
  // This is a simple implementation - in a real scenario, you might want to 
  // use a more sophisticated approach to find the right insertion point
  
  // Look for the last export type ... = UpdateTables<...> line
  const lastUpdateTypeMatch = currentContent.match(/export\s+type\s+\w+Update\s+=\s+UpdateTables<['"]\w+['"]>;/g);
  
  let updatedContent;
  
  if (lastUpdateTypeMatch) {
    const lastMatch = lastUpdateTypeMatch[lastUpdateTypeMatch.length - 1];
    const insertPosition = currentContent.lastIndexOf(lastMatch) + lastMatch.length;
    
    updatedContent = 
      currentContent.substring(0, insertPosition) + 
      '\n\n' + codeToAdd +
      currentContent.substring(insertPosition);
  } else {
    // If no match found, append to the end
    updatedContent = currentContent + '\n\n' + codeToAdd;
  }
  
  await fs.promises.writeFile(CONFIG.paths.database, updatedContent, 'utf8');
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
updateDatabaseTypes().catch(err => {
  console.error(chalk.red(`❌ Unhandled error: ${err instanceof Error ? err.message : String(err)}`));
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  console.error(chalk.red(`❌ Unhandled rejection: ${reason instanceof Error ? reason.message : String(reason)}`));
  process.exit(1);
});
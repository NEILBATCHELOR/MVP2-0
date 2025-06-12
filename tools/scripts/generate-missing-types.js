#!/usr/bin/env node
/**
 * Generate Missing Insert and Update Types
 * 
 * This script generates missing Insert and Update types for database tables.
 * 
 * Usage:
 *   node scripts/generate-missing-types.js
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  paths: {
    database: path.resolve(process.cwd(), 'src/types/database.ts'),
  },
  patterns: {
    tableType: /export\s+type\s+(\w+)Table\s+=\s+Tables<['"](\w+)['"]\>/g,
    insertType: /export\s+type\s+(\w+)Insert\s+=\s+InsertTables<['"](\w+)['"]\>/g,
    updateType: /export\s+type\s+(\w+)Update\s+=\s+UpdateTables<['"](\w+)['"]\>/g,
  }
};

/**
 * Extract types from database.ts
 */
function extractDatabaseTypes(content) {
  const types = {
    tables: [],
    inserts: [],
    updates: [],
  };

  // Reset regex patterns before using them
  CONFIG.patterns.tableType.lastIndex = 0;
  CONFIG.patterns.insertType.lastIndex = 0;
  CONFIG.patterns.updateType.lastIndex = 0;

  // Extract table types
  let match;
  while ((match = CONFIG.patterns.tableType.exec(content)) !== null) {
    types.tables.push({name: match[1], table: match[2]});
  }
  
  // Extract insert types
  while ((match = CONFIG.patterns.insertType.exec(content)) !== null) {
    types.inserts.push({name: match[1], table: match[2]});
  }
  
  // Extract update types
  while ((match = CONFIG.patterns.updateType.exec(content)) !== null) {
    types.updates.push({name: match[1], table: match[2]});
  }
  
  return types;
}

/**
 * Find missing insert and update types
 */
function findMissingTypes(types) {
  const missing = {
    inserts: [],
    updates: [],
  };
  
  // Find tables without insert types
  for (const table of types.tables) {
    const hasInsert = types.inserts.some(insert => insert.name === table.name || insert.table === table.table);
    if (!hasInsert) {
      missing.inserts.push(table);
    }
  }
  
  // Find tables without update types
  for (const table of types.tables) {
    const hasUpdate = types.updates.some(update => update.name === table.name || update.table === table.table);
    if (!hasUpdate) {
      missing.updates.push(table);
    }
  }
  
  return missing;
}

/**
 * Generate type declarations
 */
function generateTypeDeclarations(missingTypes) {
  let declarations = '';
  
  // Generate insert types
  for (const type of missingTypes.inserts) {
    declarations += `export type ${type.name}Insert = InsertTables<'${type.table}'>;\n`;
  }
  
  // Add a blank line between insert and update types if both exist
  if (missingTypes.inserts.length > 0 && missingTypes.updates.length > 0) {
    declarations += '\n';
  }
  
  // Generate update types
  for (const type of missingTypes.updates) {
    declarations += `export type ${type.name}Update = UpdateTables<'${type.table}'>;\n`;
  }
  
  return declarations;
}

/**
 * Main function
 */
function main() {
  try {
    // Read database.ts
    const databaseContent = fs.readFileSync(CONFIG.paths.database, 'utf8');
    
    // Extract types
    const types = extractDatabaseTypes(databaseContent);
    
    // Find missing types
    const missingTypes = findMissingTypes(types);
    
    // Check if there are any missing types
    if (missingTypes.inserts.length === 0 && missingTypes.updates.length === 0) {
      console.log('✅ No missing Insert or Update types found.');
      return;
    }
    
    // Generate type declarations
    const declarations = generateTypeDeclarations(missingTypes);
    
    // Output the declarations
    console.log('📝 Missing type declarations:');
    console.log(declarations);
    
    // Ask if the user wants to add these to database.ts
    console.log('\n💡 To add these types to database.ts, copy the declarations above and paste them in the appropriate section.');
    console.log('   Alternatively, you can run:');
    console.log('   echo -e "\\n// Auto-generated missing types\\n' + declarations.replace(/"/g, '\\"') + '" >> src/types/database.ts');
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

main(); 
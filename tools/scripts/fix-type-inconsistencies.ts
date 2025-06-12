#!/usr/bin/env node
/**
 * Type System Inconsistency Fixer
 * 
 * This script fixes common issues found by the validate-types script:
 * 1. Inconsistent naming patterns between database tables and TypeScript types
 * 2. Missing Insert and Update types for tables
 * 3. Generates batch commands for creating type mappers
 * 
 * Usage:
 *   npm run types:fix-inconsistencies
 *   
 * Add to package.json:
 *   "scripts": {
 *     "types:fix-inconsistencies": "NODE_OPTIONS=\"--loader ts-node/esm\" ts-node --esm scripts/fix-type-inconsistencies.ts"
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
    database: path.resolve(__dirname, '../src/types/database.ts'),
  },
  patterns: {
    tableType: /export\s+type\s+(\w+)Table\s+=\s+Tables<['"](\w+)['"]\>/g,
    insertType: /export\s+type\s+(\w+)Insert\s+=\s+InsertTables<['"](\w+)['"]\>/g,
    updateType: /export\s+type\s+(\w+)Update\s+=\s+UpdateTables<['"](\w+)['"]\>/g,
  }
};

// Naming inconsistencies to fix
const NAMING_INCONSISTENCIES = {
  "PolicyTemplate": "PolicyTemplates",
  "PolicyTemplateApprover": "PolicyTemplateApprovers",
  "User": "Users",
  "Role": "Roles",
  "Subscription": "Subscriptions",
  "RedemptionRequest": "RedemptionRequests",
  "RedemptionApprover": "RedemptionApprovers",
  "TokenAllocation": "TokenAllocations",
  "Token": "Tokens",
  "TokenVersion": "TokenVersions",
  "TokenDeployment": "TokenDeployments",
  "TokenOperation": "TokenOperations",
  "TokenDesign": "TokenDesigns",
  "TokenTemplate": "TokenTemplates",
  "IssuerDocument": "IssuerDocuments",
  "IssuerDetailDocument": "IssuerDetailDocuments",
  "Organization": "Organizations",
  "Investor": "Investors",
  "InvestorApproval": "InvestorApprovals",
  "Distribution": "Distributions",
  "DistributionRedemption": "DistributionRedemptions",
  "TokenERC20Properties": "TokenErc20Properties",
  "TokenERC721Properties": "TokenErc721Properties",
  "TokenERC721Attributes": "TokenErc721Attributes",
  "TokenERC1155Properties": "TokenErc1155Properties",
  "TokenERC1155Types": "TokenErc1155Types",
  "TokenERC1155Balances": "TokenErc1155Balances",
  "TokenERC1155UriMappings": "TokenErc1155UriMappings",
  "TokenERC1400Properties": "TokenErc1400Properties",
  "TokenERC1400Controllers": "TokenErc1400Controllers",
  "TokenERC1400Partitions": "TokenErc1400Partitions",
  "TokenERC3525Properties": "TokenErc3525Properties",
  "TokenERC3525Slots": "TokenErc3525Slots",
  "TokenERC3525Allocations": "TokenErc3525Allocations",
  "TokenERC4626Properties": "TokenErc4626Properties",
  "TokenERC4626StrategyParams": "TokenErc4626StrategyParams",
  "TokenERC4626AssetAllocations": "TokenErc4626AssetAllocations",
  "BlockchainTransaction": "WalletTransactions",
  "TransactionNotification": "TransactionNotifications"
};

// Missing types to add
const INCOMPLETE_TYPES = [
  "PolicyTemplateApprover",
  "User",
  "Role",
  "Subscription",
  "RedemptionRequest",
  "RedemptionApprover",
  "IssuerDocument",
  "Distribution",
  "DistributionRedemption",
  "TokenERC20Properties",
  "TokenERC721Properties",
  "TokenERC721Attributes",
  "TokenERC1155Properties",
  "TokenERC1155Types",
  "TokenERC1155Balances",
  "TokenERC1155UriMappings",
  "TokenERC1400Properties",
  "TokenERC1400Controllers",
  "TokenERC1400Partitions",
  "TokenERC3525Properties",
  "TokenERC3525Slots",
  "TokenERC3525Allocations",
  "TokenERC4626Properties",
  "TokenERC4626StrategyParams",
  "TokenERC4626AssetAllocations"
];

/**
 * Main function
 */
async function fixTypeInconsistencies() {
  console.log(chalk.blue('🔧 Type System Inconsistency Fixer'));
  console.log(chalk.blue('==============================='));

  try {
    // Read database.ts
    const databaseContent = await fs.promises.readFile(CONFIG.paths.database, 'utf8');
    
    // Extract existing types
    const existingTypes = extractExistingTypes(databaseContent);
    console.log(chalk.green(`Found ${existingTypes.tables.length} table types in database.ts`));
    console.log(chalk.green(`Found ${existingTypes.inserts.length} insert types in database.ts`));
    console.log(chalk.green(`Found ${existingTypes.updates.length} update types in database.ts`));

    // Generate fixes for naming inconsistencies
    const namingFixes = generateNamingFixes(existingTypes);
    
    // Generate missing insert and update types
    const missingTypesFixes = generateMissingTypesFixes(existingTypes);
    
    // Combine all fixes
    const allFixes = namingFixes + (namingFixes && missingTypesFixes ? '\n\n' : '') + missingTypesFixes;
    
    if (!allFixes) {
      console.log(chalk.green('✅ No fixes needed!'));
      return;
    }
    
    console.log(chalk.blue('\n📝 Suggested fixes for database.ts:'));
    console.log(allFixes);
    
    // Optionally update the file
    const shouldUpdate = await promptYesNo('Would you like to update database.ts with these fixes?');
    
    if (shouldUpdate) {
      await updateDatabaseFile(databaseContent, allFixes);
      console.log(chalk.green('✅ database.ts has been updated!'));
    }
    
    // Generate type mapper commands
    generateTypeMapperCommands();
    
  } catch (error) {
    console.error(chalk.red(`❌ Error: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
}

/**
 * Extract existing types from database.ts
 */
function extractExistingTypes(content: string) {
  const types = {
    tables: [] as {name: string, table: string}[],
    inserts: [] as {name: string, table: string}[],
    updates: [] as {name: string, table: string}[],
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
 * Generate fixes for naming inconsistencies
 */
function generateNamingFixes(existingTypes: ReturnType<typeof extractExistingTypes>): string {
  const fixes: string[] = [];
  
  for (const {name, table} of existingTypes.tables) {
    const baseName = name.replace('Table', '');
    
    if (NAMING_INCONSISTENCIES[baseName]) {
      const correctBaseName = NAMING_INCONSISTENCIES[baseName];
      const correctTableName = toSnakeCase(correctBaseName);
      
      // Add fixes for table type
      fixes.push(`// Fix for ${baseName}Table -> ${correctBaseName}Table`);
      fixes.push(`export type ${correctBaseName}Table = Tables<'${correctTableName}'>;`);
      
      // Add fixes for insert type if it exists
      const hasInsert = existingTypes.inserts.some(t => t.name === `${baseName}Insert`);
      if (hasInsert) {
        fixes.push(`export type ${correctBaseName}Insert = InsertTables<'${correctTableName}'>;`);
      }
      
      // Add fixes for update type if it exists
      const hasUpdate = existingTypes.updates.some(t => t.name === `${baseName}Update`);
      if (hasUpdate) {
        fixes.push(`export type ${correctBaseName}Update = UpdateTables<'${correctTableName}'>;`);
      }
      
      fixes.push(''); // Add empty line for readability
    }
  }
  
  return fixes.join('\n');
}

/**
 * Generate fixes for missing insert and update types
 */
function generateMissingTypesFixes(existingTypes: ReturnType<typeof extractExistingTypes>): string {
  const fixes: string[] = [];
  
  for (const baseName of INCOMPLETE_TYPES) {
    const tableType = existingTypes.tables.find(t => t.name === `${baseName}Table`);
    
    if (tableType) {
      const tableName = tableType.table;
      
      // Check if insert type is missing
      const hasInsert = existingTypes.inserts.some(t => t.name === `${baseName}Insert`);
      if (!hasInsert) {
        fixes.push(`// Add missing insert type for ${baseName}`);
        fixes.push(`export type ${baseName}Insert = InsertTables<'${tableName}'>;`);
      }
      
      // Check if update type is missing
      const hasUpdate = existingTypes.updates.some(t => t.name === `${baseName}Update`);
      if (!hasUpdate) {
        fixes.push(`// Add missing update type for ${baseName}`);
        fixes.push(`export type ${baseName}Update = UpdateTables<'${tableName}'>;`);
      }
      
      if (!hasInsert || !hasUpdate) {
        fixes.push(''); // Add empty line for readability
      }
    }
  }
  
  return fixes.join('\n');
}

/**
 * Generate commands for creating type mappers
 */
function generateTypeMapperCommands() {
  console.log(chalk.blue('\n📝 Commands to generate missing type mappers:'));
  console.log(chalk.yellow('You can run these commands one by one or create a batch script:'));
  
  const missingMappers = [
    "BaseModel", "User", "Project", "Address", "LegalRepresentative", 
    "RiskAssessment", "InvestmentPreferences", "DocumentRequirement", 
    "InvestorWithDetails", "BaseSubscription", "BaseRedemptionRequest", 
    "BaseTokenAllocation", "Approver", "RedemptionWindow", "ActivityLog", 
    "Wallet", "TokenBalance", "Transaction", "MultiSigTransaction", 
    "Invoice", "InvoiceItem", "WorkflowStage", "Token", 
    "TokenERC20Properties", "TokenERC721Properties", "TokenERC721Attribute", 
    "TokenERC1155Properties", "TokenERC1155Type", "TokenERC1155Balance", 
    "TokenERC1155UriMapping", "TokenERC1400Properties", "TokenERC1400Partition", 
    "TokenERC1400Controller", "TokenERC3525Properties", "TokenERC3525Slot", 
    "TokenERC3525Allocation", "TokenERC4626Properties", "TokenERC4626StrategyParam", 
    "TokenERC4626AssetAllocation", "TokenVersion", "VersionDiff", 
    "TokenDeployment", "TokenOperation", "TokenTemplate", "TokenDesign", 
    "TokenDocument", "InvestorDocument", "IssuerDocument"
  ];
  
  for (const domainType of missingMappers) {
    const tableName = toSnakeCase(domainType);
    console.log(chalk.yellow(`npm run types:generate-mapper -- --table=${tableName} --domain=${domainType}`));
  }
  
  console.log(chalk.blue('\n💡 To create a batch script for generating all mappers:'));
  console.log(chalk.yellow('1. Create a file named "generate-all-mappers.sh"'));
  console.log(chalk.yellow('2. Add the following content:'));
  
  let batchScript = '#!/bin/bash\n\n';
  for (const domainType of missingMappers) {
    const tableName = toSnakeCase(domainType);
    batchScript += `echo "Generating mapper for ${domainType}..."\n`;
    batchScript += `npm run types:generate-mapper -- --table=${tableName} --domain=${domainType}\n`;
    batchScript += 'sleep 1\n\n';
  }
  
  console.log(chalk.yellow(batchScript));
  console.log(chalk.yellow('3. Make it executable: chmod +x generate-all-mappers.sh'));
  console.log(chalk.yellow('4. Run it: ./generate-all-mappers.sh'));
}

/**
 * Update database.ts with fixes
 */
async function updateDatabaseFile(currentContent: string, fixesToAdd: string): Promise<void> {
  // Find a good place to insert the new code
  // Look for the last export type ... = UpdateTables<...> line
  const lastUpdateTypeMatch = currentContent.match(/export\s+type\s+\w+Update\s+=\s+UpdateTables<['"]\w+['"]>;/g);
  
  let updatedContent;
  
  if (lastUpdateTypeMatch) {
    const lastMatch = lastUpdateTypeMatch[lastUpdateTypeMatch.length - 1];
    const insertPosition = currentContent.lastIndexOf(lastMatch) + lastMatch.length;
    
    updatedContent = 
      currentContent.substring(0, insertPosition) + 
      '\n\n// AUTOMATICALLY GENERATED FIXES\n' + fixesToAdd +
      currentContent.substring(insertPosition);
  } else {
    // If no match found, append to the end
    updatedContent = currentContent + '\n\n// AUTOMATICALLY GENERATED FIXES\n' + fixesToAdd;
  }
  
  await fs.promises.writeFile(CONFIG.paths.database, updatedContent, 'utf8');
}

/**
 * Convert PascalCase to snake_case
 */
function toSnakeCase(str: string): string {
  return str
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '');
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
fixTypeInconsistencies().catch(err => {
  console.error(chalk.red(`❌ Unhandled error: ${err instanceof Error ? err.message : String(err)}`));
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  console.error(chalk.red(`❌ Unhandled rejection: ${reason instanceof Error ? reason.message : String(reason)}`));
  process.exit(1);
}); 
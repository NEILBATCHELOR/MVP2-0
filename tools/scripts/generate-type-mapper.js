#!/usr/bin/env node
/**
 * Type Mapper Generator
 * 
 * This script generates type mapper functions between database types and domain types.
 * 
 * Usage:
 *   npm run types:generate-mapper -- --table=user --domain=User
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Parse command line arguments
const args = process.argv.slice(2);
let tableArg = '';
let domainArg = '';

args.forEach(arg => {
  if (arg.startsWith('--table=')) {
    tableArg = arg.replace('--table=', '');
  } else if (arg.startsWith('--domain=')) {
    domainArg = arg.replace('--domain=', '');
  }
});

if (!tableArg || !domainArg) {
  console.error('Error: Both --table and --domain arguments are required.');
  console.error('Example: npm run types:generate-mapper -- --table=user --domain=User');
  process.exit(1);
}

// Convert snake_case to camelCase
function toCamelCase(str) {
  return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
}

// Convert camelCase to snake_case
function toSnakeCase(str) {
  return str.replace(/([A-Z])/g, (match) => `_${match.toLowerCase()}`);
}

// Generate the type mapper functions
function generateTypeMapper(tableName, domainName) {
  const tableNameCamel = toCamelCase(tableName);
  const tableNamePascal = tableNameCamel.charAt(0).toUpperCase() + tableNameCamel.slice(1);
  const tableTypeName = `${tableNamePascal}sTable`;
  
  const template = `
/**
 * Maps a ${tableTypeName} (snake_case) to a ${domainName} (camelCase)
 */
export function map${tableNamePascal}ToCamelCase(data: ${tableTypeName}): ${domainName} {
  if (!data) return {} as ${domainName};
  
  return {
    // TODO: Add property mappings
    // Example:
    // id: data.id,
    // firstName: data.first_name,
    // lastName: data.last_name,
    // Add all properties from the ${domainName} interface
  } as ${domainName};
}

/**
 * Maps a ${domainName} (camelCase) to a ${tableTypeName} (snake_case)
 */
export function map${domainName}ToSnakeCase(data: ${domainName}): Partial<${tableTypeName}> {
  if (!data) return {};
  
  return {
    // TODO: Add property mappings
    // Example:
    // id: data.id,
    // first_name: data.firstName,
    // last_name: data.lastName,
    // Add all properties from the ${tableTypeName} type
  };
}
`;

  return template;
}

// Main function
function main() {
  const typeMapperPath = path.resolve(process.cwd(), 'src/utils/formatting/typeMappers.ts');
  
  if (!fs.existsSync(typeMapperPath)) {
    console.error(`Error: Type mapper file not found at ${typeMapperPath}`);
    process.exit(1);
  }
  
  const mapperContent = generateTypeMapper(tableArg, domainArg);
  
  // Read the current file content
  const currentContent = fs.readFileSync(typeMapperPath, 'utf8');
  
  // Check if the mapper already exists
  if (currentContent.includes(`map${domainArg}ToCamelCase`)) {
    console.error(`Error: Type mapper for ${domainArg} already exists in the file.`);
    process.exit(1);
  }
  
  // Append the new mapper to the file
  fs.appendFileSync(typeMapperPath, mapperContent);
  
  console.log(`✅ Type mapper for ${domainArg} generated successfully.`);
  console.log(`Added to: ${typeMapperPath}`);
}

main(); 
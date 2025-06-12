#!/usr/bin/env node
/**
 * Type Guard Generator
 * 
 * This script generates type guard functions for domain types.
 * 
 * Usage:
 *   npm run types:generate-guard -- --domain=User
 */

const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
let domainArg = '';

args.forEach(arg => {
  if (arg.startsWith('--domain=')) {
    domainArg = arg.replace('--domain=', '');
  }
});

if (!domainArg) {
  console.error('Error: --domain argument is required.');
  console.error('Example: npm run types:generate-guard -- --domain=User');
  process.exit(1);
}

// Generate the type guard function
function generateTypeGuard(domainName) {
  const template = `
/**
 * Type guard for ${domainName} interface
 */
export function is${domainName}(obj: unknown): obj is ${domainName} {
  if (!obj || typeof obj !== 'object') return false;
  
  // TODO: Add property checks based on the ${domainName} interface
  // Example:
  // return (
  //   'id' in obj &&
  //   'firstName' in obj &&
  //   'lastName' in obj
  // );
  
  return true; // Replace with actual implementation
}
`;

  return template;
}

// Main function
function main() {
  const typeGuardPath = path.resolve(process.cwd(), 'src/utils/types/typeGuards.ts');
  
  if (!fs.existsSync(typeGuardPath)) {
    console.error(`Error: Type guard file not found at ${typeGuardPath}`);
    process.exit(1);
  }
  
  const guardContent = generateTypeGuard(domainArg);
  
  // Read the current file content
  const currentContent = fs.readFileSync(typeGuardPath, 'utf8');
  
  // Check if the guard already exists
  if (currentContent.includes(`is${domainArg}`)) {
    console.error(`Error: Type guard for ${domainArg} already exists in the file.`);
    process.exit(1);
  }
  
  // Append the new guard to the file
  fs.appendFileSync(typeGuardPath, guardContent);
  
  console.log(`✅ Type guard for ${domainArg} generated successfully.`);
  console.log(`Added to: ${typeGuardPath}`);
}

main(); 
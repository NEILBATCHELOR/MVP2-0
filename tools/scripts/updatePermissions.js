/**
 * Script to help update permission references in the codebase
 * Run with: node src/scripts/updatePermissions.js
 */
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Configuration
const searchDir = path.resolve(__dirname, '../..');
const ignoredDirs = [
  'node_modules',
  '.git',
  'build',
  'dist',
  'public',
  'assets',
  'supabase/migrations',
];

// Permission-related patterns to search for
const patterns = [
  'from "permissions"',
  'join "permissions"',
  'permissions table',
  'permissions.id',
  'Table.permissions',
  'Tables.permissions',
  'resource: string',
  'action: string',
  'resource, action',
];

function searchFilesForPattern(dir, pattern) {
  return new Promise((resolve, reject) => {
    // Use grep for faster searching
    const cmd = `grep -r "${pattern}" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.sql" ${dir} | grep -v ${ignoredDirs.join(' | grep -v ')}`;
    
    exec(cmd, (error, stdout, stderr) => {
      if (error && error.code !== 1) {
        // grep returns 1 when no matches found, which isn't an error for us
        reject(error);
        return;
      }
      
      resolve(stdout.trim().split('\n').filter(Boolean));
    });
  });
}

async function main() {
  console.log('Searching for permission references...');
  
  let allResults = [];
  
  for (const pattern of patterns) {
    console.log(`\nSearching for: "${pattern}"`);
    try {
      const results = await searchFilesForPattern(searchDir, pattern);
      if (results.length > 0) {
        console.log(`Found ${results.length} matches:`);
        results.forEach(r => console.log(`  ${r}`));
        allResults = [...allResults, ...results];
      } else {
        console.log('No matches found');
      }
    } catch (err) {
      console.error(`Error searching for "${pattern}":`, err);
    }
  }
  
  // Extract unique files that need attention
  const filesToUpdate = [...new Set(
    allResults.map(r => r.split(':')[0])
  )].sort();
  
  if (filesToUpdate.length > 0) {
    console.log('\n\nFiles that need to be updated:');
    filesToUpdate.forEach(f => console.log(`- ${f}`));
    
    // Write the list to a file for reference
    fs.writeFileSync(
      path.join(__dirname, 'files-to-update.txt'),
      filesToUpdate.join('\n')
    );
    console.log('\nList written to src/scripts/files-to-update.txt');
  } else {
    console.log('\nNo files need updating');
  }
  
  console.log('\nSuggested updates:');
  console.log('1. Replace any direct queries to "permissions" table with queries to "role_permissions"');
  console.log('2. Update permission checks to use string IDs like "policy_rules.approve"');
  console.log('3. Update user role checks to handle inconsistent role name formats');
}

main().catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
}); 
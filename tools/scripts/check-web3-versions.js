#!/usr/bin/env node

/**
 * Web3 Library Version Checker
 * 
 * Analyzes the codebase for potential version conflicts in web3 libraries
 * Specifically checks: @reown/appkit, @reown/appkit-adapter-wagmi, wagmi, viem, ethers
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the web3 packages we want to check
const WEB3_PACKAGES = [
  '@reown/appkit',
  '@reown/appkit-adapter-wagmi',
  'wagmi',
  'viem',
  'ethers',
  '@tanstack/react-query' // Related to wagmi
];

// ANSI color codes for terminal output
const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Read package.json to get installed versions
function getInstalledVersions() {
  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageLockPath = path.join(process.cwd(), 'package-lock.json');
    
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    console.log(`${COLORS.blue}Installed Versions (from package.json):${COLORS.reset}`);
    console.log('=====================================');
    
    const installedVersions = {};
    
    WEB3_PACKAGES.forEach(pkg => {
      if (dependencies[pkg]) {
        installedVersions[pkg] = dependencies[pkg];
        console.log(`${pkg}: ${COLORS.green}${dependencies[pkg]}${COLORS.reset}`);
      } else {
        console.log(`${pkg}: ${COLORS.red}Not installed${COLORS.reset}`);
      }
    });
    
    // If package-lock.json exists, also check for exact resolved versions
    if (fs.existsSync(packageLockPath)) {
      console.log(`\n${COLORS.blue}Resolved Versions (from package-lock.json):${COLORS.reset}`);
      console.log('=========================================');
      
      const packageLock = JSON.parse(fs.readFileSync(packageLockPath, 'utf8'));
      
      // Handle different package-lock.json formats
      const packages = packageLock.packages || packageLock.dependencies;
      
      if (packages) {
        WEB3_PACKAGES.forEach(pkg => {
          if (packages[pkg] && packages[pkg].version) {
            console.log(`${pkg}: ${COLORS.green}${packages[pkg].version}${COLORS.reset}`);
          } else if (packages[`node_modules/${pkg}`] && packages[`node_modules/${pkg}`].version) {
            console.log(`${pkg}: ${COLORS.green}${packages[`node_modules/${pkg}`].version}${COLORS.reset}`);
          } else {
            // Search for the package in the package-lock dependencies
            let found = false;
            
            // For package-lock.json v2+
            if (packageLock.packages) {
              for (const key in packageLock.packages) {
                if (key.includes(`node_modules/${pkg}`) && packageLock.packages[key].version) {
                  console.log(`${pkg}: ${COLORS.green}${packageLock.packages[key].version}${COLORS.reset}`);
                  found = true;
                  break;
                }
              }
            }
            
            if (!found) {
              console.log(`${pkg}: ${COLORS.yellow}Could not determine exact version${COLORS.reset}`);
            }
          }
        });
      }
    }
    
    return installedVersions;
  } catch (error) {
    console.error(`${COLORS.red}Error reading package files:${COLORS.reset}`, error.message);
    return {};
  }
}

// Scan node_modules to find actual installed versions
function checkNodeModulesVersions() {
  console.log(`\n${COLORS.blue}Checking node_modules for installed versions:${COLORS.reset}`);
  console.log('============================================');
  
  WEB3_PACKAGES.forEach(pkg => {
    try {
      const packagePath = path.join(process.cwd(), 'node_modules', pkg, 'package.json');
      
      if (fs.existsSync(packagePath)) {
        const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        console.log(`${pkg}: ${COLORS.green}${packageData.version}${COLORS.reset}`);
      } else {
        console.log(`${pkg}: ${COLORS.red}Not found in node_modules${COLORS.reset}`);
      }
    } catch (error) {
      console.log(`${pkg}: ${COLORS.red}Error reading package: ${error.message}${COLORS.reset}`);
    }
  });
}

// Check for multiple installed versions in node_modules
function checkForMultipleVersions() {
  console.log(`\n${COLORS.blue}Checking for multiple installed versions:${COLORS.reset}`);
  console.log('==========================================');
  
  WEB3_PACKAGES.forEach(pkg => {
    try {
      // Find all instances of this package in node_modules (including nested)
      const cmd = `find node_modules -type f -path "*/node_modules/${pkg}/package.json" | sort`;
      const result = execSync(cmd, { encoding: 'utf8' }).trim();
      
      if (!result) {
        console.log(`${pkg}: ${COLORS.yellow}No instances found${COLORS.reset}`);
        return;
      }
      
      const paths = result.split('\n');
      
      if (paths.length === 1) {
        const packageData = JSON.parse(fs.readFileSync(paths[0], 'utf8'));
        console.log(`${pkg}: ${COLORS.green}Single version ${packageData.version}${COLORS.reset}`);
      } else {
        console.log(`${pkg}: ${COLORS.red}Multiple versions detected:${COLORS.reset}`);
        
        const versions = new Map();
        
        paths.forEach(packagePath => {
          try {
            const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
            const parent = packagePath.split(`node_modules/${pkg}`)[0];
            
            if (!versions.has(packageData.version)) {
              versions.set(packageData.version, []);
            }
            
            versions.get(packageData.version).push(parent);
          } catch (error) {
            console.log(`  - Error reading ${packagePath}: ${error.message}`);
          }
        });
        
        for (const [version, parents] of versions.entries()) {
          console.log(`  - ${COLORS.magenta}Version ${version}${COLORS.reset} (${parents.length} instances)`);
          parents.forEach((parent, i) => {
            if (i < 3) { // Show only first 3 instances to avoid clutter
              console.log(`    → ${parent}`);
            } else if (i === 3) {
              console.log(`    → ... and ${parents.length - 3} more`);
            }
          });
        }
      }
    } catch (error) {
      console.log(`${pkg}: ${COLORS.yellow}Could not check - ${error.message}${COLORS.reset}`);
    }
  });
}

// Scan source files for import patterns
function analyzeSourceImports() {
  console.log(`\n${COLORS.blue}Analyzing source code imports:${COLORS.reset}`);
  console.log('===============================');
  
  try {
    // Find all source files
    const extensions = ['.ts', '.tsx', '.js', '.jsx'];
    const findCmd = `find src -type f ${extensions.map(ext => `-name "*${ext}"`).join(' -o ')}`;
    const files = execSync(findCmd, { encoding: 'utf8' }).trim().split('\n');
    
    if (!files.length || files[0] === '') {
      console.log(`${COLORS.yellow}No source files found to analyze${COLORS.reset}`);
      return;
    }
    
    console.log(`Found ${files.length} source files to analyze`);
    
    const packageImports = {};
    WEB3_PACKAGES.forEach(pkg => {
      packageImports[pkg] = { count: 0, files: [] };
    });
    
    files.forEach(file => {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        WEB3_PACKAGES.forEach(pkg => {
          // Look for import statements for this package
          const regex = new RegExp(`import\\s+(?:[^'"]*\\s+from\\s+)?['"]${pkg}(?:[^'"]*)?['"]`, 'g');
          const matches = content.match(regex);
          
          if (matches) {
            packageImports[pkg].count += matches.length;
            packageImports[pkg].files.push(file);
          }
        });
      } catch (error) {
        console.log(`${COLORS.yellow}Could not analyze ${file}: ${error.message}${COLORS.reset}`);
      }
    });
    
    // Print results
    WEB3_PACKAGES.forEach(pkg => {
      const { count, files } = packageImports[pkg];
      
      if (count === 0) {
        console.log(`${pkg}: ${COLORS.yellow}Not imported in source code${COLORS.reset}`);
      } else {
        console.log(`${pkg}: ${COLORS.green}Imported in ${count} places across ${files.length} files${COLORS.reset}`);
        
        // Show sample imports
        if (files.length > 0) {
          console.log(`  Sample files:`);
          files.slice(0, 3).forEach(file => {
            console.log(`  - ${file}`);
          });
          
          if (files.length > 3) {
            console.log(`  - ... and ${files.length - 3} more files`);
          }
        }
      }
    });
  } catch (error) {
    console.log(`${COLORS.red}Error analyzing source imports: ${error.message}${COLORS.reset}`);
  }
}

// Check if there are potential version conflicts
function checkForVersionConflicts(installedVersions) {
  console.log(`\n${COLORS.blue}Checking for potential conflicts:${COLORS.reset}`);
  console.log('==================================');
  
  // Check if both ethers and viem are being used
  if (installedVersions['ethers'] && installedVersions['viem']) {
    console.log(`${COLORS.yellow}⚠️  Both ethers (${installedVersions['ethers']}) and viem (${installedVersions['viem']}) are installed.${COLORS.reset}`);
    console.log(`   This is not necessarily a problem, but using both libraries can lead to inconsistent implementations.`);
  }
  
  // Check if wagmi version is compatible with viem
  if (installedVersions['wagmi'] && installedVersions['viem']) {
    // This is a simplified check - in reality, you would need to check compatibility tables
    if (installedVersions['wagmi'].startsWith('^1') && !installedVersions['viem'].startsWith('^1')) {
      console.log(`${COLORS.red}❌ Version conflict: wagmi v1 requires viem v1, but you have ${installedVersions['viem']}${COLORS.reset}`);
    } else if (installedVersions['wagmi'].startsWith('^2') && !installedVersions['viem'].startsWith('^2')) {
      console.log(`${COLORS.red}❌ Version conflict: wagmi v2 requires viem v2, but you have ${installedVersions['viem']}${COLORS.reset}`);
    } else {
      console.log(`${COLORS.green}✓ wagmi and viem versions appear compatible${COLORS.reset}`);
    }
  }
  
  // Check for @tanstack/react-query compatibility with wagmi
  if (installedVersions['wagmi'] && installedVersions['@tanstack/react-query']) {
    if (installedVersions['wagmi'].startsWith('^2') && !installedVersions['@tanstack/react-query'].startsWith('^5')) {
      console.log(`${COLORS.red}❌ Version conflict: wagmi v2 requires @tanstack/react-query v5, but you have ${installedVersions['@tanstack/react-query']}${COLORS.reset}`);
    } else {
      console.log(`${COLORS.green}✓ wagmi and @tanstack/react-query versions appear compatible${COLORS.reset}`);
    }
  }
  
  // Check for @reown/appkit compatibility
  if (installedVersions['@reown/appkit'] && installedVersions['@reown/appkit-adapter-wagmi']) {
    if (installedVersions['@reown/appkit'] !== installedVersions['@reown/appkit-adapter-wagmi']) {
      console.log(`${COLORS.red}❌ Version mismatch: @reown/appkit (${installedVersions['@reown/appkit']}) and @reown/appkit-adapter-wagmi (${installedVersions['@reown/appkit-adapter-wagmi']})${COLORS.reset}`);
      console.log(`   These packages should have matching versions`);
    } else {
      console.log(`${COLORS.green}✓ @reown/appkit and @reown/appkit-adapter-wagmi versions match${COLORS.reset}`);
    }
  }
}

// Provide recommendations based on the analysis
function provideRecommendations() {
  console.log(`\n${COLORS.blue}Recommendations:${COLORS.reset}`);
  console.log('=================');
  
  console.log(`1. ${COLORS.green}If multiple versions of any package were detected, consider running:${COLORS.reset}`);
  console.log(`   npm dedupe`);
  
  console.log(`\n2. ${COLORS.green}Ensure @reown/appkit and @reown/appkit-adapter-wagmi have matching versions:${COLORS.reset}`);
  console.log(`   npm install @reown/appkit@X.Y.Z @reown/appkit-adapter-wagmi@X.Y.Z`);
  
  console.log(`\n3. ${COLORS.green}For wagmi v2, ensure you have compatible versions:${COLORS.reset}`);
  console.log(`   - viem v2.x.x`);
  console.log(`   - @tanstack/react-query v5.x.x`);
  
  console.log(`\n4. ${COLORS.green}Choose either ethers or viem as your primary blockchain library:${COLORS.reset}`);
  console.log(`   - If using wagmi, prefer viem as it's the native library`);
  console.log(`   - If using ethers alongside wagmi, be careful of inconsistencies`);
  
  console.log(`\n5. ${COLORS.green}After making changes, rebuild your application:${COLORS.reset}`);
  console.log(`   npm run build`);
}

// Main function
function main() {
  console.log(`${COLORS.cyan}🔍 Web3 Library Version Checker${COLORS.reset}`);
  console.log(`${COLORS.cyan}===============================${COLORS.reset}\n`);
  
  const installedVersions = getInstalledVersions();
  checkNodeModulesVersions();
  checkForMultipleVersions();
  analyzeSourceImports();
  checkForVersionConflicts(installedVersions);
  provideRecommendations();
}

// Run the main function
main(); 
#!/usr/bin/env node

/**
 * Dependency Analysis Script
 * Analyzes package.json for unused dependencies and version conflicts
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readPackageJson(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return null;
  }
}

function scanDirectory(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  const files = [];
  
  function scan(currentDir) {
    try {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          // Skip node_modules and other common directories
          if (['node_modules', '.git', 'dist', 'build', '.next'].includes(item)) {
            continue;
          }
          scan(fullPath);
        } else if (stat.isFile()) {
          const ext = path.extname(item);
          if (extensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not scan directory ${currentDir}:`, error.message);
    }
  }
  
  scan(dir);
  return files;
}

function extractImports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const imports = new Set();
    
    // Match import statements
    const importRegex = /import\s+(?:[^'"]*\s+from\s+)?['"]([^'"]+)['"]/g;
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1];
      
      // Extract package name from import path
      if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
        let packageName = importPath;
        
        // Handle scoped packages
        if (packageName.startsWith('@')) {
          const parts = packageName.split('/');
          packageName = parts.slice(0, 2).join('/');
        } else {
          packageName = packageName.split('/')[0];
        }
        
        imports.add(packageName);
      }
    }
    
    // Match require statements
    const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
    while ((match = requireRegex.exec(content)) !== null) {
      const requirePath = match[1];
      
      if (!requirePath.startsWith('.') && !requirePath.startsWith('/')) {
        let packageName = requirePath;
        
        if (packageName.startsWith('@')) {
          const parts = packageName.split('/');
          packageName = parts.slice(0, 2).join('/');
        } else {
          packageName = packageName.split('/')[0];
        }
        
        imports.add(packageName);
      }
    }
    
    return imports;
  } catch (error) {
    console.warn(`Warning: Could not read file ${filePath}:`, error.message);
    return new Set();
  }
}

function analyzeUsage(projectRoot) {
  console.log('📁 Scanning source files for imports...');
  
  const sourceFiles = scanDirectory(path.join(projectRoot, 'src'));
  const configFiles = [
    'vite.config.ts',
    'vitest.config.ts',
    'tailwind.config.js',
    'eslint.config.js',
    'postcss.config.js',
    'server.ts'
  ].map(f => path.join(projectRoot, f)).filter(fs.existsSync);
  
  const allFiles = [...sourceFiles, ...configFiles];
  console.log(`🔍 Found ${allFiles.length} files to analyze`);
  
  const usedPackages = new Set();
  
  for (const file of allFiles) {
    const imports = extractImports(file);
    imports.forEach(pkg => usedPackages.add(pkg));
  }
  
  return usedPackages;
}

function checkVersionConflicts(packageJson) {
  console.log('\n🔍 Checking for version conflicts...');
  
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  const conflicts = [];
  
  // Specific packages to check for conflicts
  const web3Packages = {
    '@reown/appkit': dependencies['@reown/appkit'],
    '@reown/appkit-adapter-wagmi': dependencies['@reown/appkit-adapter-wagmi'],
    'wagmi': dependencies['wagmi'],
    'viem': dependencies['viem'],
    '@tanstack/react-query': dependencies['@tanstack/react-query']
  };
  
  console.log('\n📦 Web3 Package Versions:');
  for (const [pkg, version] of Object.entries(web3Packages)) {
    if (version) {
      console.log(`  ${pkg}: ${version}`);
    } else {
      console.log(`  ${pkg}: NOT INSTALLED`);
    }
  }
  
  // Check for other potential conflicts
  const reactPackages = {
    'react': dependencies['react'],
    'react-dom': dependencies['react-dom'],
    '@types/react': dependencies['@types/react'],
    '@types/react-dom': dependencies['@types/react-dom']
  };
  
  console.log('\n⚛️  React Package Versions:');
  for (const [pkg, version] of Object.entries(reactPackages)) {
    if (version) {
      console.log(`  ${pkg}: ${version}`);
    }
  }
  
  // Check for ethers vs viem conflicts
  const blockchainLibs = {
    'ethers': dependencies['ethers'],
    'viem': dependencies['viem'],
    'wagmi': dependencies['wagmi']
  };
  
  console.log('\n🔗 Blockchain Library Versions:');
  for (const [pkg, version] of Object.entries(blockchainLibs)) {
    if (version) {
      console.log(`  ${pkg}: ${version}`);
    }
  }
  
  return conflicts;
}

function analyzeUnused(packageJson, usedPackages) {
  console.log('\n🚀 Analyzing unused dependencies...');
  
  const allDependencies = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies
  };
  
  const unused = [];
  const criticalPackages = new Set([
    'react',
    'react-dom',
    'typescript',
    'vite',
    '@vitejs/plugin-react-swc',
    'tailwindcss',
    'postcss',
    'autoprefixer'
  ]);
  
  // Also check for packages that might be used indirectly
  const potentiallyUnused = [];
  
  for (const [pkg, version] of Object.entries(allDependencies)) {
    if (!usedPackages.has(pkg) && !criticalPackages.has(pkg)) {
      // Additional checks for indirect usage
      if (pkg.startsWith('@types/')) {
        const basePackage = pkg.replace('@types/', '');
        if (usedPackages.has(basePackage)) {
          continue; // Type package is used
        }
      }
      
      if (pkg.startsWith('@radix-ui/')) {
        // Check if any Radix UI component is used
        const hasRadixUsage = Array.from(usedPackages).some(p => p.startsWith('@radix-ui/'));
        if (hasRadixUsage) {
          potentiallyUnused.push(pkg);
          continue;
        }
      }
      
      unused.push(pkg);
    }
  }
  
  return { unused, potentiallyUnused };
}

function generateReport(packageJson, usedPackages, conflicts) {
  const { unused, potentiallyUnused } = analyzeUnused(packageJson, usedPackages);
  
  console.log('\n📊 DEPENDENCY ANALYSIS REPORT');
  console.log('==============================\n');
  
  console.log(`📦 Total Dependencies: ${Object.keys(packageJson.dependencies || {}).length}`);
  console.log(`🛠️  Total DevDependencies: ${Object.keys(packageJson.devDependencies || {}).length}`);
  console.log(`✅ Used Packages: ${usedPackages.size}`);
  console.log(`❌ Potentially Unused: ${unused.length}`);
  console.log(`⚠️  Uncertain: ${potentiallyUnused.length}\n`);
  
  if (unused.length > 0) {
    console.log('❌ UNUSED DEPENDENCIES:');
    console.log('---------------------');
    unused.sort().forEach(pkg => {
      console.log(`  - ${pkg}`);
    });
    console.log('');
  }
  
  if (potentiallyUnused.length > 0) {
    console.log('⚠️  POTENTIALLY UNUSED (INDIRECT USAGE POSSIBLE):');
    console.log('-------------------------------------------');
    potentiallyUnused.sort().forEach(pkg => {
      console.log(`  - ${pkg}`);
    });
    console.log('');
  }
  
  console.log('💾 SUGGESTED CLEANUP COMMAND:');
  console.log('--------------------------');
  if (unused.length > 0) {
    console.log(`npm uninstall ${unused.join(' ')}`);
  } else {
    console.log('No packages to remove.');
  }
  
  console.log('\n⚠️  IMPORTANT: ');
  console.log('  1. Some dependencies may be used at runtime or in build scripts');
  console.log('  2. Always test thoroughly after removing dependencies');
  console.log('  3. Some packages might be peer dependencies required by other packages');
}

function main() {
  const projectRoot = process.cwd();
  const packageJsonPath = path.join(projectRoot, 'package.json');
  
  console.log('📦 Dependency Analysis Tool');
  console.log('=========================\n');
  
  const packageJson = readPackageJson(packageJsonPath);
  if (!packageJson) {
    console.error('❌ Cannot continue without package.json');
    process.exit(1);
  }
  
  const usedPackages = analyzeUsage(projectRoot);
  const conflicts = checkVersionConflicts(packageJson);
  generateReport(packageJson, usedPackages, conflicts);
}

// Run the main function
main();

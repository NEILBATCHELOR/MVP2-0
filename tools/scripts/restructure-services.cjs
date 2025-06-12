#!/usr/bin/env node

/**
 * Script to consolidate src/lib/services into src/services/integrations
 * and update import paths across TypeScript files.
 */
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const libServicesDir = path.join(projectRoot, 'src/lib/services');
const integrationsDir = path.join(projectRoot, 'src/services/integrations');
const srcDir = path.join(projectRoot, 'src');

// Ensure integrations dir exists
fs.mkdirSync(integrationsDir, { recursive: true });

// Move all files from lib/services to services/integrations
fs.readdirSync(libServicesDir).forEach(file => {
  const srcPath = path.join(libServicesDir, file);
  const destPath = path.join(integrationsDir, file);
  fs.renameSync(srcPath, destPath);
  console.log(`Moved ${file} -> src/services/integrations/${file}`);
});

// Recursively update import paths in .ts/.tsx
const exts = ['.ts', '.tsx'];
function walkAndReplace(dir) {
  fs.readdirSync(dir).forEach(name => {
    const fullPath = path.join(dir, name);
    if (fs.statSync(fullPath).isDirectory()) {
      walkAndReplace(fullPath);
    } else if (exts.includes(path.extname(name))) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const updated = content.replace(/(['"])@\/lib\/services\/(.+?)\1/g, (_, q, p) => `${q}@/services/integrations/${p}${q}`);
      if (updated !== content) {
        fs.writeFileSync(fullPath, updated, 'utf8');
        console.log(`Updated imports in ${path.relative(projectRoot, fullPath)}`);
      }
    }
  });
}
walkAndReplace(srcDir);
console.log('Consolidation complete.');
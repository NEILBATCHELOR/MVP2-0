#!/usr/bin/env node
/**
 * Stage 1: Rename src/lib to src/infrastructure and update imports
 */
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const libDir = path.join(projectRoot, 'src', 'lib');
const infraDir = path.join(projectRoot, 'src', 'infrastructure');

// Rename directory
if (fs.existsSync(libDir)) {
  fs.renameSync(libDir, infraDir);
  console.log('Renamed src/lib to src/infrastructure');
} else {
  console.error('src/lib not found, skipping rename');
}

// Update imports in all TS/TSX/JS/JSX
const exts = ['.ts', '.tsx', '.js', '.jsx'];
function walk(dir) {
  fs.readdirSync(dir).forEach(name => {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) {
      walk(full);
    } else if (exts.includes(path.extname(name))) {
      let content = fs.readFileSync(full, 'utf8');
      let updated = content
        .replace(/@\/lib\//g, '@/infrastructure/')
        .replace(/['"]\.\.\/lib\//g, "'@/infrastructure/")
        .replace(/['"]\.\/lib\//g, "'@/infrastructure/");
      if (updated !== content) {
        fs.writeFileSync(full, updated, 'utf8');
        console.log(`Updated imports in ${path.relative(projectRoot, full)}`);
      }
    }
  });
}
walk(path.join(projectRoot, 'src'));
console.log('Stage 1 completed.');
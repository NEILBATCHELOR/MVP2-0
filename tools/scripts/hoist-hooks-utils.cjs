#!/usr/bin/env node
/**
 * Stage 3: Move hooks & utils from infrastructure to src/hooks and src/utils
 */
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const infraRoot = path.join(projectRoot, 'src', 'infrastructure');
const destHooks = path.join(projectRoot, 'src', 'hooks');
const destUtils = path.join(projectRoot, 'src', 'utils');

// Move hooks
const infraHooksPath = path.join(infraRoot, 'hooks');
if (fs.existsSync(infraHooksPath)) {
  if (!fs.existsSync(destHooks)) fs.mkdirSync(destHooks, { recursive: true });
  fs.readdirSync(infraHooksPath).forEach(name => {
    const src = path.join(infraHooksPath, name);
    const dst = path.join(destHooks, name);
    fs.renameSync(src, dst);
    console.log(`Moved hooks/${name} -> src/hooks/${name}`);
  });
  fs.rmdirSync(infraHooksPath);
} else {
  console.warn('No infrastructure/hooks dir');
}

// Move utils
const infraUtilsPath = path.join(infraRoot, 'utils');
if (fs.existsSync(infraUtilsPath)) {
  if (!fs.existsSync(destUtils)) fs.mkdirSync(destUtils, { recursive: true });
  fs.readdirSync(infraUtilsPath).forEach(name => {
    const src = path.join(infraUtilsPath, name);
    const dst = path.join(destUtils, name);
    fs.renameSync(src, dst);
    console.log(`Moved utils/${name} -> src/utils/${name}`);
  });
  fs.rmdirSync(infraUtilsPath);
} else {
  console.warn('No infrastructure/utils dir');
}

// Update imports in code
const exts = ['.ts', '.tsx', '.js', '.jsx'];
function walk(dir) {
  fs.readdirSync(dir).forEach(name => {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) return walk(full);
    if (!exts.includes(path.extname(name))) return;
    let content = fs.readFileSync(full, 'utf8');
    let updated = content;
    // alias imports
    updated = updated.replace(/@\/infrastructure\/hooks/g, '@/hooks');
    updated = updated.replace(/@\/infrastructure\/utils/g, '@/utils');
    // relative imports
    updated = updated.replace(/\.\.\/infrastructure\/hooks/g, '../hooks');
    updated = updated.replace(/\.\.\/infrastructure\/utils/g, '../utils');
    updated = updated.replace(/\.\/infrastructure\/hooks/g, './hooks');
    updated = updated.replace(/\.\/infrastructure\/utils/g, './utils');
    if (updated !== content) {
      fs.writeFileSync(full, updated, 'utf8');
      console.log(`Updated imports in ${path.relative(projectRoot, full)}`);
    }
  });
}
walk(path.join(projectRoot, 'src'));
console.log('Stage 3 complete');
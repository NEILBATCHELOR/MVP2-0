#!/usr/bin/env node
/**
 * Stage 2: Extract domain services from infrastructure to src/services
 */
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const infraDir = path.join(projectRoot, 'src', 'infrastructure');
const servicesDir = path.join(projectRoot, 'src', 'services');

// Mapping of infra domain files to services paths
const mapping = {
  'complianceService.ts': 'compliance/complianceService.ts',
  'documentStorage.ts':   'document/documentStorage.ts',
  'investors.ts':         'investor/investors.ts',
  'roles.ts':             'user/roles.ts',
  'tokenTemplates.ts':    'token/tokenTemplates.ts',
  'users.ts':             'user/users.ts',
  'walletService.ts':     'wallet/walletService.ts',
  'workflowService.ts':   'workflow/workflowService.ts',
};

// Ensure domain folders exist and move files
Object.entries(mapping).forEach(([file, relPath]) => {
  const src = path.join(infraDir, file);
  const dest = path.join(servicesDir, relPath);
  if (fs.existsSync(src)) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.renameSync(src, dest);
    console.log(`Moved ${file} -> src/services/${relPath}`);
  } else {
    console.warn(`Missing infra file: ${file}`);
  }
});

// Update imports across code files
const exts = ['.ts', '.tsx', '.js', '.jsx'];
function walk(dir) {
  fs.readdirSync(dir).forEach(name => {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) return walk(full);
    if (!exts.includes(path.extname(name))) return;
    let content = fs.readFileSync(full, 'utf8');
    let updated = content;
    Object.entries(mapping).forEach(([file, relPath]) => {
      const oldKey = file.replace(/\.ts$/, '');
      const newKey = relPath.replace(/\.ts$/, '');
      // imports from infrastructure (absolute & relative)
      const infraRegex = new RegExp(`(?:@/infrastructure|\\.\\./infrastructure|\\./infrastructure)/${oldKey}`, 'g');
      updated = updated.replace(infraRegex, `@/services/${newKey}`);
    });
    if (updated !== content) {
      fs.writeFileSync(full, updated, 'utf8');
      console.log(`Updated imports in ${path.relative(projectRoot, full)}`);
    }
  });
}
walk(path.join(projectRoot, 'src'));
console.log('Stage 2 extraction complete.');
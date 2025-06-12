#!/usr/bin/env node
/**
 * Stage 4: Re-organize src/infrastructure into services, utils, types, docs, fixtures
 */
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const infraRoot = path.join(projectRoot, 'src', 'infrastructure');
const srcRoot = path.join(projectRoot, 'src');
const testsRoot = path.join(projectRoot, 'tests');
const docsRoot = path.join(projectRoot, 'docs');

// Ensure docs and fixtures dirs exist
fs.mkdirSync(docsRoot, { recursive: true });
fs.mkdirSync(path.join(testsRoot, 'fixtures'), { recursive: true });

// 1. Move domain services
const domainMapping = {
  'capTable.ts': 'services/captable/capTableService.ts',
  'compliance.ts': 'services/compliance/complianceService.ts',
  'dashboardData.ts': 'services/dashboard/dashboardDataService.ts',
  'projects.ts': 'services/project/projectService.ts',
  'redemptions.ts': 'services/redemption/redemptionService.ts',
  'permissions.ts': 'services/auth/permissionService.ts',
};
Object.entries(domainMapping).forEach(([file, relDest]) => {
  const src = path.join(infraRoot, file);
  if (fs.existsSync(src)) {
    const dest = path.join(srcRoot, relDest);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.renameSync(src, dest);
    console.log(`Moved ${file} -> ${relDest}`);
  }
});

// 2. Move pure utils
const utilMapping = {
  'countries.ts': 'utils/countries.ts',
  'crypto.ts': 'utils/crypto.ts',
  'csv.ts': 'utils/csv.ts',
  'utils.ts': 'utils/utils.ts',
};
Object.entries(utilMapping).forEach(([file, relDest]) => {
  const src = path.join(infraRoot, file);
  if (fs.existsSync(src)) {
    const dest = path.join(srcRoot, relDest);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.renameSync(src, dest);
    console.log(`Moved ${file} -> ${relDest}`);
  }
});

// 3. Move shared types
const typeMapping = {
  'investorTypes.ts': 'types/investor.ts',
};
Object.entries(typeMapping).forEach(([file, relDest]) => {
  const src = path.join(infraRoot, file);
  if (fs.existsSync(src)) {
    const dest = path.join(projectRoot, relDest);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.renameSync(src, dest);
    console.log(`Moved ${file} -> ${relDest}`);
  }
});

// 4. Move fixtures
const fixtureMapping = {
  'sampleData.ts': 'fixtures/sampleData.ts',
};
Object.entries(fixtureMapping).forEach(([file, relDest]) => {
  const src = path.join(infraRoot, file);
  if (fs.existsSync(src)) {
    const dest = path.join(testsRoot, relDest);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.renameSync(src, dest);
    console.log(`Moved ${file} -> tests/${relDest}`);
  }
});

// 5. Move docs
const docMapping = {
  'PERFORMANCE_OPTIMIZATIONS.md': 'Performance.md',
  'README.md': 'Infrastructure.md',
};
Object.entries(docMapping).forEach(([file, destName]) => {
  const src = path.join(infraRoot, file);
  if (fs.existsSync(src)) {
    const dest = path.join(docsRoot, destName);
    fs.renameSync(src, dest);
    console.log(`Moved ${file} -> docs/${destName}`);
  }
});

// 6. Update imports for moved files
const mapping = {
  'capTable': '@/services/captable/capTableService',
  'compliance': '@/services/compliance/complianceService',
  'dashboardData': '@/services/dashboard/dashboardDataService',
  'projects': '@/services/project/projectService',
  'redemptions': '@/services/redemption/redemptionService',
  'permissions': '@/services/auth/permissionService',
  'countries': '@/utils/countries',
  'crypto': '@/utils/crypto',
  'csv': '@/utils/csv',
  'utils': '@/utils/utils',
  'investorTypes': '@/types/investor',
  'sampleData': '@/tests/fixtures/sampleData',
};
const exts = ['.ts', '.tsx', '.js', '.jsx'];
function walkUpdate(dir) {
  fs.readdirSync(dir).forEach(name => {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) return walkUpdate(full);
    if (!exts.includes(path.extname(name))) return;
    let content = fs.readFileSync(full, 'utf8');
    let updated = content;
    Object.entries(mapping).forEach(([oldKey, newKey]) => {
      const regex = new RegExp(`(?:@/infrastructure|\\.{1,2}/infrastructure)/${oldKey}`, 'g');
      updated = updated.replace(regex, newKey);
    });
    if (updated !== content) {
      fs.writeFileSync(full, updated, 'utf8');
      console.log(`Updated imports in ${path.relative(projectRoot, full)}`);
    }
  });
}
walkUpdate(srcRoot);
if (fs.existsSync(testsRoot)) walkUpdate(testsRoot);

console.log('Stage 4 re-organization complete.');
#!/usr/bin/env node
/**
 * Intermediate Step: Organise hooks & utils into domain folders
 */
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const hooksDir = path.join(projectRoot, 'src', 'hooks');
const utilsDir = path.join(projectRoot, 'src', 'utils');

// Mapping of hook files to new relative paths under src/hooks
const hookMapping = {
  'useCompliance.ts': 'compliance/useCompliance.ts',
  'useDocuments.ts': 'document/useDocuments.ts',
  'useSupabaseClient.ts': 'supabase/useSupabaseClient.ts',
  'useUser.ts': 'user/useUser.ts',
  'useWallet.ts': 'wallet/useWallet.ts',
  'useWorkflow.ts': 'workflow/useWorkflow.ts'
};

// Mapping of util files to new relative paths under src/utils
const utilMapping = {
  'activityAnalytics.ts': 'analytics/activityAnalytics.ts',
  'activityLogHelpers.ts': 'analytics/activityLogHelpers.ts',
  'activityLogger.ts': 'logging/activityLogger.ts',
  'systemActivityLogger.ts': 'logging/systemActivityLogger.ts',
  'performanceUtils.ts': 'analytics/performanceUtils.ts',
  'dateHelpers.ts': 'date/dateHelpers.ts',
  'exportUtils.ts': 'formatting/exportUtils.ts',
  'formatters.ts': 'formatting/formatters.ts',
  'table.ts': 'formatting/table.ts',
  'uuidUtils.ts': 'formatting/uuidUtils.ts',
  'typeMappers.ts': 'formatting/typeMappers.ts',
  'workflowMappers.ts': 'formatting/workflowMappers.ts',
  'typeGuards.ts': 'types/typeGuards.ts',
  'constants.ts': 'constants/constants.ts',
  'focusManager.ts': 'state/focusManager.ts',
  'stateHelpers.ts': 'state/stateHelpers.ts',
  'supabaseHelpers.ts': 'supabase/supabaseHelpers.ts',
  'kyc.ts': 'compliance/kyc.ts',
  'web3Adapters.ts': 'web3/web3Adapters.ts',
  'fixDialogAccessibility.ts': 'accessibility/fixDialogAccessibility.ts',
  'cube3TestUtils.ts': 'tests/cube3TestUtils.ts',
  'onfidoTestUtils.ts': 'tests/onfidoTestUtils.ts'
};

// Helper to move files based on mapping
function moveFiles(srcDir, mapping, destRoot) {
  Object.entries(mapping).forEach(([file, relPath]) => {
    const srcPath = path.join(srcDir, file);
    if (!fs.existsSync(srcPath)) {
      console.warn(`Missing file: ${srcPath}`);
      return;
    }
    const destPath = path.join(destRoot, relPath);
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.renameSync(srcPath, destPath);
    console.log(`Moved ${path.relative(projectRoot, srcPath)} -> ${path.relative(projectRoot, destPath)}`);
  });
}

// Move hooks
moveFiles(hooksDir, hookMapping, hooksDir);
// Move utils
moveFiles(utilsDir, utilMapping, utilsDir);

// Update imports in code
const exts = ['.ts', '.tsx', '.js', '.jsx'];
function updateImports(dir) {
  fs.readdirSync(dir).forEach(name => {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) return updateImports(full);
    if (!exts.includes(path.extname(name))) return;
    let content = fs.readFileSync(full, 'utf8');
    let updated = content;
    // update hook imports
    Object.keys(hookMapping).forEach(file => {
      const base = file.replace(/\.ts$/, '');
      const newRel = hookMapping[file].replace(/\.ts$/, '');
      updated = updated.replace(new RegExp(`@/hooks/${base}`, 'g'), `@/hooks/${newRel}`);
      updated = updated.replace(new RegExp(`\.{1,2}/hooks/${base}`, 'g'), `../hooks/${newRel}`);
    });
    // update util imports
    Object.keys(utilMapping).forEach(file => {
      const base = file.replace(/\.ts$/, '');
      const newRel = utilMapping[file].replace(/\.ts$/, '');
      updated = updated.replace(new RegExp(`@/utils/${base}`, 'g'), `@/utils/${newRel}`);
      updated = updated.replace(new RegExp(`\.{1,2}/utils/${base}`, 'g'), `../utils/${newRel}`);
    });
    if (updated !== content) {
      fs.writeFileSync(full, updated, 'utf8');
      console.log(`Updated imports in ${path.relative(projectRoot, full)}`);
    }
  });
}
updateImports(path.join(projectRoot, 'src'));
console.log('Intermediate organisation of hooks & utils complete.');
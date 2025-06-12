#!/usr/bin/env node

/**
 * Script to restructure service domains under src/services
 * - Creates domain folders: user, document, policy, rule, audit, realtime
 * - Moves service modules into their respective folders
 * - Updates import paths across all TS/TSX files
 */
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const servicesDir = path.join(projectRoot, 'src', 'services');

// Create domain directories
['user', 'document', 'policy', 'rule', 'audit', 'realtime'].forEach(dir => {
  fs.mkdirSync(path.join(servicesDir, dir), { recursive: true });
});

// Mapping of files to their new domain paths
const mapping = {
  'userService.ts': 'user/userService.ts',
  'documentService.ts': 'document/documentService.ts',
  'approvalService.ts': 'policy/approvalService.ts',
  'enhancedPolicyService.ts': 'policy/enhancedPolicyService.ts',
  'enhancedPolicyTemplateService.ts': 'policy/enhancedPolicyTemplateService.ts',
  'policyApproverService.ts': 'policy/policyApproverService.ts',
  'policyService.ts': 'policy/policyService.ts',
  'policyTemplateService.ts': 'policy/policyTemplateService.ts',
  'policyVersionService.ts': 'policy/policyVersionService.ts',
  'enhancedRuleService.ts': 'rule/enhancedRuleService.ts',
  'ruleConflictService.ts': 'rule/ruleConflictService.ts',
  'ruleFactory.fixed.ts': 'rule/ruleFactory.fixed.ts',
  'ruleFactory.ts': 'rule/ruleFactory.ts',
  'ruleService.ts': 'rule/ruleService.ts',
  'ruleTemplateService.ts': 'rule/ruleTemplateService.ts',
  'auditLogService.ts': 'audit/auditLogService.ts',
  'realtimeService.ts': 'realtime/realtimeService.ts',
  'websocketService.ts': 'realtime/websocketService.ts',
};

// Move files accordingly
Object.entries(mapping).forEach(([oldRel, newRel]) => {
  const oldPath = path.join(servicesDir, oldRel);
  const newPath = path.join(servicesDir, newRel);
  if (fs.existsSync(oldPath)) {
    fs.renameSync(oldPath, newPath);
    console.log(`Moved ${oldRel} -> ${newRel}`);
  }
});

// Recursive import update
const exts = ['.ts', '.tsx'];
function walkAndReplace(dir) {
  fs.readdirSync(dir).forEach(name => {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) {
      walkAndReplace(full);
    } else if (exts.includes(path.extname(name))) {
      let content = fs.readFileSync(full, 'utf8');
      let updated = content;
      Object.entries(mapping).forEach(([oldRel, newRel]) => {
        const oldImport = `@/services/${oldRel.replace(/\.ts$/, '')}`;
        const newImport = `@/services/${newRel.replace(/\.ts$/, '')}`;
        updated = updated.replace(
          new RegExp(`(['"])${oldImport}\\1`, 'g'),
          `$1${newImport}$1`
        );
      });
      if (updated !== content) {
        fs.writeFileSync(full, updated, 'utf8');
        console.log(`Updated imports in ${path.relative(projectRoot, full)}`);
      }
    }
  });
}
walkAndReplace(path.join(projectRoot, 'src'));

console.log('Domain restructuring complete.');
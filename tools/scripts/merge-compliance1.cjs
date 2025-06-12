#!/usr/bin/env node
/**
 * Merge compliance1.ts service functions into complianceService.ts
 */
const fs = require('fs');
const path = require('path');
const dir = path.resolve(__dirname, '..', 'src', 'services', 'compliance');
const svcFile = path.join(dir, 'complianceService.ts');
const extraFile = path.join(dir, 'compliance1.ts');
if (!fs.existsSync(extraFile)) {
  console.log('No compliance1.ts to merge.');
  process.exit(0);
}
let svcContent = fs.readFileSync(svcFile, 'utf8');
let lines = svcContent.split('\n');
// Insert type import if missing
const hasTypeImport = lines.some(l => l.includes("import type { AuditLog") || l.includes("import type { ComplianceCheck"));
if (!hasTypeImport) {
  const lastImportIdx = lines.reduce((idx, line, i) => line.startsWith('import') ? i : idx, -1);
  lines.splice(lastImportIdx + 1, 0, "import type { AuditLog, ComplianceCheck } from '@/types/compliance';");
}
// Read extra functions
const extraContent = fs.readFileSync(extraFile, 'utf8');
const extraLines = extraContent.split('\n');
const startIdx = extraLines.findIndex(l => /^export\s+(const|async|function)/.test(l));
if (startIdx < 0) {
  console.error('No exported functions in compliance1.ts');
  process.exit(1);
}
const functionsBlock = extraLines.slice(startIdx).join('\n');
// Append to service file
lines.push('', '// Merged from compliance1.ts', functionsBlock);
fs.writeFileSync(svcFile, lines.join('\n'), 'utf8');
// Delete extra file
fs.unlinkSync(extraFile);
console.log('Merged compliance1.ts into complianceService.ts and deleted compliance1.ts');
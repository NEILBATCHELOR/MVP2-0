#!/usr/bin/env node
/**
 * Cleanup duplicate merge block in complianceService.ts
 */
const fs = require('fs');
const path = require('path');
const file = path.resolve(__dirname, '../src/services/compliance/complianceService.ts');
let content = fs.readFileSync(file, 'utf8');
const marker = '// Merged from compliance1.ts';
const idx = content.indexOf(marker);
if (idx !== -1) {
  const cleaned = content.slice(0, idx).trimEnd() + '\n';
  fs.writeFileSync(file, cleaned, 'utf8');
  console.log('Removed merged duplicate block.');
} else {
  console.log('No merge marker found.');
}

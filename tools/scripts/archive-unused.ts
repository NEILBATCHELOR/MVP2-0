#!/usr/bin/env ts-node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const projectRoot = path.resolve(__dirname, '..');
const srcDir = path.join(projectRoot, 'src');
const archiveDir = path.join(srcDir, 'archive');
const reportPath = path.join(projectRoot, 'unused-files-report.txt');

if (!fs.existsSync(reportPath)) {
  console.error('unused-files-report.txt not found');
  process.exit(1);
}

const reportLines = fs.readFileSync(reportPath, 'utf-8')
  .split(/\r?\n/)
  .map(l => l.trim())
  .filter(Boolean);

reportLines.forEach(relPath => {
  const absPath = path.join(projectRoot, relPath);
  if (!fs.existsSync(absPath)) {
    console.log(`File not found: ${relPath}`);
    return;
  }

  // Only archive files under src/
  if (!absPath.startsWith(srcDir)) {
    console.log(`Skipping non-src file: ${relPath}`);
    return;
  }

  // Check for references excluding archive folder
  const basename = path.basename(relPath, path.extname(relPath));
  const grepCmd = `grep -R --exclude-dir=archive -n "${basename}" "${srcDir}"`;
  let result = '';
  try {
    result = execSync(grepCmd, { encoding: 'utf-8' });
  } catch (err: any) {
    result = err.stdout || '';
  }

  const occurrences = result
    .split('\n')
    .filter(l => l && !l.includes(relPath));
  if (occurrences.length > 0) {
    console.log(`Skipping used file: ${relPath}`);
    return;
  }

  // Archive the file
  const relToSrc = path.relative(srcDir, absPath);
  const destPath = path.join(archiveDir, relToSrc);
  const destDir = path.dirname(destPath);
  fs.mkdirSync(destDir, { recursive: true });
  fs.renameSync(absPath, destPath);
  console.log(`Archived: ${relPath} -> src/archive/${relToSrc}`);
});

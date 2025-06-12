#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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
  if (!absPath.startsWith(srcDir)) {
    console.log(`Skipping non-src file: ${relPath}`);
    return;
  }

  const basename = path.basename(relPath, path.extname(relPath));
  let occurrences = '';
  try {
    occurrences = execSync(`grep -R --exclude-dir=archive -n "${basename}" "${srcDir}"`, { encoding: 'utf-8' });
  } catch {
    occurrences = '';
  }

  const lines = occurrences
    .split('\n')
    .filter(l => l && !l.includes(relPath));
  if (lines.length > 0) {
    console.log(`Skipping used file: ${relPath}`);
    return;
  }

  const relToSrc = path.relative(srcDir, absPath);
  const destPath = path.join(archiveDir, relToSrc);
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.renameSync(absPath, destPath);
  console.log(`Archived: ${relPath}`);
});

import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(process.cwd(), 'public/JSON_Products');
const OUTPUT = path.join(ROOT, 'index.json');

function walk(dir: string): any {
  const result: any = { name: path.basename(dir), type: 'directory', children: [] };
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      result.children.push(walk(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      result.children.push({ name: entry.name, type: 'file', path: path.relative(ROOT, fullPath).replace(/\\/g, '/') });
    }
  }
  return result;
}

function main() {
  if (!fs.existsSync(ROOT)) {
    console.error('JSON_Products directory does not exist:', ROOT);
    process.exit(1);
  }
  const tree = walk(ROOT);
  fs.writeFileSync(OUTPUT, JSON.stringify(tree, null, 2));
  console.log('Manifest generated at', OUTPUT);
}

main();

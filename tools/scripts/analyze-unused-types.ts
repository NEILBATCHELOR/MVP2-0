import { Project, SyntaxKind, Node, InterfaceDeclaration, ClassDeclaration } from 'ts-morph';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// ES Module equivalent for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..');
const srcDir = path.join(projectRoot, 'src');

const project = new Project({
  tsConfigFilePath: path.join(projectRoot, 'tsconfig.json'),
});

const CORE_TYPE_FILES = [
  'types/centralModels.ts',
  'types/database.ts',
  'types/supabase.ts',
  'utils/typeGuards.ts',
  'utils/typeMappers.ts',
].map((f) => path.join(srcDir, f));

const sourceFiles = project.getSourceFiles(`${srcDir}/**/*.{ts,tsx}`);
const referencedFiles = new Set<string>();
const extensionMap: Record<string, string[]> = {};

for (const file of sourceFiles) {
  const filePath = file.getFilePath();

  file.getImportDeclarations().forEach((imp) => {
    const resolved = imp.getModuleSpecifierSourceFile();
    if (resolved) {
      referencedFiles.add(resolved.getFilePath());
    }
  });

  file.forEachDescendant((node) => {
    if (
      node.getKindName().includes('Reference') ||
      node.getKindName().includes('Type')
    ) {
      const symbol = node.getSymbol();
      if (symbol) {
        symbol.getDeclarations().forEach((decl) => {
          const sourceFile = decl.getSourceFile();
          referencedFiles.add(sourceFile.getFilePath());
        });
      }
    }

    // Track where interfaces or classes are extended
    if (
      Node.isClassDeclaration(node) ||
      Node.isInterfaceDeclaration(node)
    ) {
      const name = node.getName();
      if (!name) return;

      const heritageClauses = (node as InterfaceDeclaration | ClassDeclaration).getHeritageClauses();
      heritageClauses.forEach((clause) => {
        clause.getTypeNodes().forEach((typeNode) => {
          const identifier = typeNode.getText();
          if (!extensionMap[identifier]) extensionMap[identifier] = [];
          extensionMap[identifier].push(filePath);
        });
      });
    }
  });
}

const allFilePaths = sourceFiles.map((f) => f.getFilePath());
const unusedFiles = allFilePaths.filter(
  (file) => !referencedFiles.has(file) && !CORE_TYPE_FILES.includes(file)
);

console.log('\n📦 Flagged for Manual Review (No usage found, excluding core files):');
unusedFiles.forEach((file) => {
  console.log('-', path.relative(projectRoot, file));
});

fs.writeFileSync(
  path.join(projectRoot, 'unused-files-report.txt'),
  unusedFiles.map((f) => path.relative(projectRoot, f)).join('\n'),
  'utf-8'
);

const extensionReportPath = path.join(projectRoot, 'type-extensions-report.json');
fs.writeFileSync(extensionReportPath, JSON.stringify(extensionMap, null, 2), 'utf-8');

console.log(`\n📖 Type extensions saved to: ${extensionReportPath}`);
console.log(`✅ Done. Output saved to unused-files-report.txt`);

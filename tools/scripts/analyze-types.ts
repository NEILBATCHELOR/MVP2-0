import * as ts from 'typescript';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Script to analyze TypeScript type errors across the project
 * 
 * This script will:
 * 1. Parse the tsconfig.json file
 * 2. Create a TypeScript Program
 * 3. Get all diagnostics (type errors)
 * 4. Format and report the errors grouped by file
 */

// Get the project root directory
const projectRoot = path.resolve(__dirname, '..');

// Parse the tsconfig.json file
function parseConfig() {
  const configPath = path.join(projectRoot, 'tsconfig.json');
  
  if (!fs.existsSync(configPath)) {
    console.error('Could not find tsconfig.json');
    process.exit(1);
  }
  
  const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
  
  if (configFile.error) {
    console.error(`Error reading tsconfig.json: ${configFile.error.messageText}`);
    process.exit(1);
  }
  
  const parsedConfig = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    projectRoot
  );
  
  return parsedConfig;
}

// Create a TypeScript Program
function createProgram(parsedConfig: ts.ParsedCommandLine) {
  return ts.createProgram({
    rootNames: parsedConfig.fileNames,
    options: parsedConfig.options,
    projectReferences: parsedConfig.projectReferences
  });
}

// Get all diagnostics
function getDiagnostics(program: ts.Program) {
  const diagnostics = [
    ...program.getSemanticDiagnostics(),
    ...program.getSyntacticDiagnostics(),
    ...program.getDeclarationDiagnostics(),
    ...program.getConfigFileParsingDiagnostics(),
    ...program.getGlobalDiagnostics(),
    ...program.getOptionsDiagnostics()
  ];
  
  return diagnostics;
}

// Format diagnostics by file
function formatDiagnostics(diagnostics: ts.Diagnostic[]) {
  // Group diagnostics by file
  const diagnosticsByFile = new Map<string, ts.Diagnostic[]>();
  
  diagnostics.forEach(diagnostic => {
    if (diagnostic.file) {
      const fileName = diagnostic.file.fileName;
      if (!diagnosticsByFile.has(fileName)) {
        diagnosticsByFile.set(fileName, []);
      }
      diagnosticsByFile.get(fileName)!.push(diagnostic);
    }
  });
  
  // Format the diagnostics
  let output = '';
  let totalErrors = 0;
  
  diagnosticsByFile.forEach((fileDiagnostics, fileName) => {
    const relativePath = path.relative(projectRoot, fileName);
    
    // Skip node_modules
    if (relativePath.includes('node_modules')) {
      return;
    }
    
    output += `\n## ${relativePath} (${fileDiagnostics.length} issues)\n\n`;
    
    fileDiagnostics.forEach(diagnostic => {
      const { line, character } = diagnostic.file!.getLineAndCharacterOfPosition(diagnostic.start!);
      const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
      const code = diagnostic.code;
      
      output += `- Line ${line + 1}, Col ${character + 1}: ${message} (TS${code})\n`;
      totalErrors++;
    });
    
    output += '\n';
  });
  
  // Add a summary
  output = `# TypeScript Type Analysis Report\n\nFound ${totalErrors} type issues across ${diagnosticsByFile.size} files.\n` + output;
  
  return output;
}

// Check if a specific list of files was provided
function filterDiagnostics(diagnostics: ts.Diagnostic[], fileList?: string[]) {
  if (!fileList || fileList.length === 0) {
    return diagnostics;
  }
  
  // Convert the file list to absolute paths
  const absoluteFilePaths = fileList.map(f => path.resolve(projectRoot, f));
  
  return diagnostics.filter(diagnostic => {
    if (!diagnostic.file) return false;
    return absoluteFilePaths.some(filePath => diagnostic.file!.fileName === filePath);
  });
}

// Function to filter diagnostics by specific file paths
function getFileInfo(filePaths: string[]) {
  const parsedConfig = parseConfig();
  const program = createProgram(parsedConfig);
  
  const allDiagnostics = getDiagnostics(program);
  const filteredDiagnostics = filterDiagnostics(allDiagnostics, filePaths);
  
  const report = formatDiagnostics(filteredDiagnostics);
  return report;
}

// Main function
function main() {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    const filePaths = args.length > 0 ? args : undefined;
    
    // Get the file paths from the list of specified files
    const specificFiles = [
      'src/components/home.tsx',
      'src/components/redemption/RedemptionStatusSubscriber.tsx',
      'src/components/redemption/dashboard/RedemptionRequestList.tsx',
      'src/components/rules/ApprovalDashboardStory.tsx',
      'src/components/rules/ApprovalNotificationsStory.tsx',
      'src/components/rules/ApprovalWorkflowStory.tsx',
      'src/components/rules/PolicyDetailsPanel.tsx',
      'src/components/rules/PolicyVersionHistoryStory.tsx',
      'src/components/subscriptions/SubscriptionManager.tsx',
      'src/components/tokens/standards/ERC1400/InvestorSection.tsx',
      'src/components/tokens/standards/ERC1400/PartitionSection.tsx',
      'src/lib/dashboardData.ts',
      'src/lib/documentStorage.ts',
      'src/lib/investors.ts',
      'src/lib/projects.ts',
      'src/lib/redemptions.ts',
      'src/lib/web3/WalletManager.ts',
      'src/lib/workflowService.ts',
      'src/services/realtimeService.ts'
    ];
    
    // Generate the report
    console.log("Analyzing TypeScript type issues...");
    const report = getFileInfo(specificFiles);
    
    // Write the report to a file
    const reportPath = path.join(projectRoot, 'type-analysis-report.md');
    fs.writeFileSync(reportPath, report);
    
    console.log(`Report generated at ${reportPath}`);
    
    // Log a summary to the console
    const lines = report.split('\n');
    let summary = lines[0] + '\n' + lines[1] + '\n' + lines[2] + '\n';
    
    // Get the file summaries
    const fileSummaries = lines
      .filter(line => line.startsWith('## '))
      .map(line => line.replace('## ', ''));
    
    console.log(summary);
    console.log('Files with issues:');
    fileSummaries.forEach(summary => console.log(`- ${summary}`));
  } catch (error) {
    console.error('Error generating type analysis report:', error);
    process.exit(1);
  }
}

// Run the main function
main(); 
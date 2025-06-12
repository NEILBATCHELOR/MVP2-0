#!/usr/bin/env npx tsx

/**
 * Sequential Token CRUD Validation Runner
 * 
 * This script runs all individual ERC validation scripts sequentially:
 * - validate-erc20-crud.ts
 * - validate-erc721-crud.ts  
 * - validate-erc1155-crud.ts
 * - validate-erc1400-crud.ts
 * - validate-erc3525-crud.ts
 * - validate-erc4626-crud.ts
 * 
 * Each script runs independently and reports its own results.
 * The runner provides a master summary at the end.
 * 
 * Usage: 
 *   npm run validate:all-sequential
 *   or
 *   npx tsx scripts/run-all-validations.ts
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

// Configuration
const CONFIG = {
  scriptsDir: process.cwd(),
  verbose: process.env.VERBOSE === 'true',
  generateReport: process.env.GENERATE_REPORT !== 'false',
  continueOnFailure: process.env.CONTINUE_ON_FAILURE === 'true',
  cleanup: process.env.CLEANUP_TEST_DATA !== 'false',
  timeout: parseInt(process.env.VALIDATION_TIMEOUT || '300000'), // 5 minutes default
};

// Validation scripts to run in order
const VALIDATION_SCRIPTS = [
  {
    name: 'ERC-20 Utility Tokens',
    script: 'validate-erc20-crud.ts',
    description: 'Tests utility tokens with fee structures, rebasing, and governance'
  },
  {
    name: 'ERC-721 NFT Tokens', 
    script: 'validate-erc721-crud.ts',
    description: 'Tests NFTs with attributes, royalties, and metadata'
  },
  {
    name: 'ERC-1155 Multi-Tokens',
    script: 'validate-erc1155-crud.ts', 
    description: 'Tests multi-tokens with batch operations and container support'
  },
  {
    name: 'ERC-1400 Security Tokens',
    script: 'validate-erc1400-crud.ts',
    description: 'Tests security tokens with compliance, partitions, and KYC'
  },
  {
    name: 'ERC-3525 Semi-Fungible Tokens',
    script: 'validate-erc3525-crud.ts',
    description: 'Tests semi-fungible tokens with slots and value transfers'
  },
  {
    name: 'ERC-4626 Vault Tokens',
    script: 'validate-erc4626-crud.ts', 
    description: 'Tests tokenized vaults with yield strategies and fees'
  }
];

interface ValidationResult {
  name: string;
  script: string;
  status: 'passed' | 'failed' | 'timeout' | 'skipped';
  duration: number;
  exitCode: number;
  output: string;
  error: string;
  timestamp: string;
}

class SequentialValidationRunner {
  private results: ValidationResult[] = [];
  private startTime: number = 0;
  private logFile: string;

  constructor() {
    this.startTime = Date.now();
    this.logFile = path.join(CONFIG.scriptsDir, 'validation-results.log');
    this.printHeader();
  }

  /**
   * Run all validation scripts sequentially
   */
  async runAllValidations(): Promise<void> {
    try {
      console.log('🚀 Starting Sequential Token CRUD Validation...\n');

      for (const validation of VALIDATION_SCRIPTS) {
        await this.runSingleValidation(validation);
        
        // Brief pause between validations
        await this.sleep(1000);
      }

      // Generate final report
      this.generateFinalReport();
      
      // Determine overall success
      const hasFailures = this.results.some(r => r.status === 'failed');
      
      if (hasFailures && !CONFIG.continueOnFailure) {
        console.log('\n❌ Some validations failed. See report above for details.');
        process.exit(1);
      } else {
        console.log('\n🎉 All validations completed successfully!');
        process.exit(0);
      }

    } catch (error) {
      console.error('\n💥 Sequential validation runner failed:', error);
      this.logToFile(`RUNNER ERROR: ${error}`);
      process.exit(1);
    }
  }

  /**
   * Run a single validation script
   */
  private async runSingleValidation(validation: {name: string, script: string, description: string}): Promise<void> {
    const startTime = Date.now();
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔍 Running: ${validation.name}`);
    console.log(`📋 Description: ${validation.description}`);
    console.log(`📄 Script: ${validation.script}`);
    console.log(`🕐 Started: ${new Date().toLocaleTimeString()}`);
    console.log(`${'='.repeat(60)}\n`);

    const scriptPath = path.join(CONFIG.scriptsDir, validation.script);
    const logPrefix = `[${validation.name}]`;

    let result: ValidationResult = {
      name: validation.name,
      script: validation.script,
      status: 'failed',
      duration: 0,
      exitCode: 1,
      output: '',
      error: '',
      timestamp: new Date().toISOString()
    };

    try {
      // Check if script exists
      try {
        readFileSync(scriptPath);
      } catch (err) {
        console.log(`⚠️ Script not found: ${scriptPath}`);
        console.log(`   Skipping ${validation.name}...`);
        result.status = 'skipped';
        result.error = 'Script file not found';
        result.duration = Date.now() - startTime;
        this.results.push(result);
        return;
      }

      // Execute the validation script
      console.log(`▶️ Executing: npx tsx ${validation.script}\n`);
      
      const command = `npx tsx "${scriptPath}"`;
      const output = execSync(command, {
        cwd: CONFIG.scriptsDir,
        timeout: CONFIG.timeout,
        encoding: 'utf8',
        stdio: CONFIG.verbose ? 'inherit' : 'pipe'
      });

      result.output = output.toString();
      result.exitCode = 0;
      result.status = 'passed';
      result.duration = Date.now() - startTime;

      console.log(`\n✅ ${validation.name} completed successfully in ${result.duration}ms`);
      this.logToFile(`${logPrefix} PASSED in ${result.duration}ms`);

    } catch (error: any) {
      result.duration = Date.now() - startTime;
      result.exitCode = error.status || 1;
      result.error = error.message || 'Unknown error';
      
      if (error.signal === 'SIGTERM') {
        result.status = 'timeout';
        console.log(`\n⏰ ${validation.name} timed out after ${CONFIG.timeout}ms`);
        this.logToFile(`${logPrefix} TIMEOUT after ${CONFIG.timeout}ms`);
      } else {
        result.status = 'failed';
        console.log(`\n❌ ${validation.name} failed with exit code ${result.exitCode}`);
        this.logToFile(`${logPrefix} FAILED: ${result.error}`);
      }

      if (error.stdout) {
        result.output = error.stdout.toString();
      }

      // Print error details if verbose
      if (CONFIG.verbose && error.stderr) {
        console.log('\n📝 Error Details:');
        console.log(error.stderr.toString());
      }

      // Decide whether to continue or exit
      if (!CONFIG.continueOnFailure) {
        console.log(`\n🛑 Stopping validation sequence due to failure in ${validation.name}`);
        console.log('   Set CONTINUE_ON_FAILURE=true to continue on failures');
        this.results.push(result);
        this.generateFinalReport();
        process.exit(1);
      }
    }

    this.results.push(result);
  }

  /**
   * Generate comprehensive final report
   */
  private generateFinalReport(): void {
    const totalDuration = Date.now() - this.startTime;
    const timestamp = new Date().toISOString();

    console.log(`\n\n${'='.repeat(80)}`);
    console.log('📊 SEQUENTIAL TOKEN CRUD VALIDATION REPORT');
    console.log(`${'='.repeat(80)}`);
    console.log(`Report Generated: ${timestamp}`);
    console.log(`Total Execution Time: ${this.formatDuration(totalDuration)}`);
    console.log(`Configuration: ${JSON.stringify(CONFIG, null, 2)}`);
    console.log('');

    // Summary statistics
    const total = this.results.length;
    const passed = this.results.filter(r => r.status === 'passed').length;
    const failed = this.results.filter(r => r.status === 'failed').length;
    const timeout = this.results.filter(r => r.status === 'timeout').length;
    const skipped = this.results.filter(r => r.status === 'skipped').length;
    const successRate = total > 0 ? (passed / total) * 100 : 0;

    console.log('📈 SUMMARY STATISTICS');
    console.log(`${'─'.repeat(40)}`);
    console.log(`Total Scripts: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏰ Timeout: ${timeout}`);
    console.log(`⏭️ Skipped: ${skipped}`);
    console.log(`📊 Success Rate: ${successRate.toFixed(1)}%`);
    console.log('');

    // Detailed results
    console.log('📋 DETAILED RESULTS');
    console.log(`${'─'.repeat(40)}`);
    
    this.results.forEach((result, index) => {
      const statusIcon = this.getStatusIcon(result.status);
      const durationFormatted = this.formatDuration(result.duration);
      
      console.log(`${index + 1}. ${statusIcon} ${result.name}`);
      console.log(`   Script: ${result.script}`);
      console.log(`   Status: ${result.status.toUpperCase()}`);
      console.log(`   Duration: ${durationFormatted}`);
      console.log(`   Exit Code: ${result.exitCode}`);
      
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      
      console.log('');
    });

    // Performance analysis
    this.generatePerformanceAnalysis();

    // Recommendations
    this.generateRecommendations();

    // Save report to file if requested
    if (CONFIG.generateReport) {
      this.saveReportToFile(timestamp, totalDuration);
    }
  }

  /**
   * Generate performance analysis
   */
  private generatePerformanceAnalysis(): void {
    console.log('⚡ PERFORMANCE ANALYSIS');
    console.log(`${'─'.repeat(40)}`);

    if (this.results.length === 0) {
      console.log('No performance data available.\n');
      return;
    }

    const validResults = this.results.filter(r => r.status !== 'skipped');
    const totalTime = validResults.reduce((sum, r) => sum + r.duration, 0);
    const avgTime = totalTime / validResults.length;
    const fastest = validResults.reduce((min, r) => r.duration < min.duration ? r : min);
    const slowest = validResults.reduce((max, r) => r.duration > max.duration ? r : max);

    console.log(`Total Validation Time: ${this.formatDuration(totalTime)}`);
    console.log(`Average Time per Script: ${this.formatDuration(avgTime)}`);
    console.log(`Fastest: ${fastest.name} (${this.formatDuration(fastest.duration)})`);
    console.log(`Slowest: ${slowest.name} (${this.formatDuration(slowest.duration)})`);

    // Performance warnings
    if (avgTime > 60000) { // 1 minute
      console.log('⚠️ Performance Warning: Average execution time > 1 minute');
      console.log('   Consider optimizing test data or database queries');
    }

    console.log('');
  }

  /**
   * Generate recommendations based on results
   */
  private generateRecommendations(): void {
    console.log('💡 RECOMMENDATIONS');
    console.log(`${'─'.repeat(40)}`);

    const failedResults = this.results.filter(r => r.status === 'failed');
    const timeoutResults = this.results.filter(r => r.status === 'timeout');
    const skippedResults = this.results.filter(r => r.status === 'skipped');

    if (failedResults.length === 0 && timeoutResults.length === 0 && skippedResults.length === 0) {
      console.log('🎉 Perfect! All validations passed successfully.');
      console.log('');
      console.log('✨ Your token CRUD system is working correctly across all standards.');
      console.log('');
      console.log('📈 Suggested next steps:');
      console.log('  • Add these validations to your CI/CD pipeline');
      console.log('  • Consider adding performance benchmarks');
      console.log('  • Implement automated regression testing');
      console.log('  • Document the validation process for your team');
    } else {
      if (failedResults.length > 0) {
        console.log('❌ Failed Validations Require Attention:');
        failedResults.forEach(result => {
          console.log(`  • ${result.name}: ${result.error}`);
        });
        console.log('');
      }

      if (timeoutResults.length > 0) {
        console.log('⏰ Timeout Issues:');
        timeoutResults.forEach(result => {
          console.log(`  • ${result.name}: Exceeded ${CONFIG.timeout}ms limit`);
        });
        console.log('  Consider increasing VALIDATION_TIMEOUT or optimizing scripts');
        console.log('');
      }

      if (skippedResults.length > 0) {
        console.log('⏭️ Skipped Scripts:');
        skippedResults.forEach(result => {
          console.log(`  • ${result.name}: ${result.error}`);
        });
        console.log('  Implement missing validation scripts for complete coverage');
        console.log('');
      }

      console.log('🔧 Recommended Actions:');
      console.log('  1. Fix failed validations by reviewing error messages');
      console.log('  2. Check database schema and connectivity');
      console.log('  3. Verify all dependencies are installed');
      console.log('  4. Run individual scripts for detailed debugging');
      console.log('  5. Ensure test environment is properly configured');
    }

    console.log('');
    console.log('🛠️ Available Environment Variables:');
    console.log('  VERBOSE=true                 # Show detailed output');
    console.log('  CONTINUE_ON_FAILURE=true     # Continue after failures');
    console.log('  CLEANUP_TEST_DATA=false      # Keep test data for debugging');
    console.log('  VALIDATION_TIMEOUT=600000    # 10 minute timeout');
    console.log('  GENERATE_REPORT=false        # Skip file report generation');
    console.log('');
  }

  /**
   * Save detailed report to file
   */
  private saveReportToFile(timestamp: string, totalDuration: number): void {
    const reportData = {
      timestamp,
      totalDuration,
      config: CONFIG,
      summary: {
        total: this.results.length,
        passed: this.results.filter(r => r.status === 'passed').length,
        failed: this.results.filter(r => r.status === 'failed').length,
        timeout: this.results.filter(r => r.status === 'timeout').length,
        skipped: this.results.filter(r => r.status === 'skipped').length,
      },
      results: this.results
    };

    const reportPath = path.join(CONFIG.scriptsDir, 'validation-report.json');
    const reportContent = JSON.stringify(reportData, null, 2);

    try {
      writeFileSync(reportPath, reportContent);
      console.log(`📄 Detailed report saved to: ${reportPath}`);
    } catch (error) {
      console.warn(`⚠️ Failed to save report file: ${error}`);
    }
  }

  /**
   * Helper methods
   */
  private printHeader(): void {
    console.log(`${'═'.repeat(80)}`);
    console.log('🚀 SEQUENTIAL TOKEN CRUD VALIDATION RUNNER');
    console.log(`${'═'.repeat(80)}`);
    console.log(`Started: ${new Date().toLocaleString()}`);
    console.log(`Scripts to run: ${VALIDATION_SCRIPTS.length}`);
    console.log(`Continue on failure: ${CONFIG.continueOnFailure}`);
    console.log(`Timeout per script: ${this.formatDuration(CONFIG.timeout)}`);
    console.log(`${'═'.repeat(80)}`);
  }

  private getStatusIcon(status: string): string {
    switch (status) {
      case 'passed': return '✅';
      case 'failed': return '❌';
      case 'timeout': return '⏰';
      case 'skipped': return '⏭️';
      default: return '❓';
    }
  }

  private formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}min`;
  }

  private logToFile(message: string): void {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;
    
    try {
      writeFileSync(this.logFile, logEntry, { flag: 'a' });
    } catch (error) {
      // Ignore file logging errors
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Main execution
async function main() {
  try {
    const runner = new SequentialValidationRunner();
    await runner.runAllValidations();
  } catch (error) {
    console.error('💥 Sequential validation runner failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { SequentialValidationRunner };

#!/usr/bin/env node

/**
 * Security Scanner for Chiral Infrastructure as Code
 * Scans repository for potential security issues and data leaks
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface SecurityIssue {
  file: string;
  line: number;
  type: 'secret' | 'weak_password' | 'hardcoded_credential' | 'sensitive_file';
  severity: 'high' | 'medium' | 'low';
  description: string;
  pattern?: string;
}

class SecurityScanner {
  private readonly patterns = {
    // High severity - actual secrets
    high: [
      {
        pattern: /AKIA[0-9A-Z]{16}/g,
        description: 'AWS Access Key ID',
        type: 'secret' as const
      },
      {
        pattern: /[0-9]{4}-[0-9]{4}-[0-9]{4}-[0-9]{4}/g,
        description: 'Credit card number',
        type: 'secret' as const
      },
      {
        pattern: /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/g,
        description: 'Private key',
        type: 'secret' as const
      },
      {
        pattern: /password\s*=\s*"[^"]*[a-zA-Z0-9!@#$%^&*]{8,}"/gi,
        description: 'Hardcoded password',
        type: 'hardcoded_credential' as const
      }
    ],
    
    // Medium severity - weak patterns
    medium: [
      {
        pattern: /password\s*=\s*"(demo|test|123|password|admin|changeme)"/gi,
        description: 'Weak/default password',
        type: 'weak_password' as const
      },
      {
        pattern: /secret\s*=\s*"[^"]*"/gi,
        description: 'Hardcoded secret',
        type: 'hardcoded_credential' as const
      },
      {
        pattern: /api[_-]?key\s*=\s*"[^"]*"/gi,
        description: 'Hardcoded API key',
        type: 'hardcoded_credential' as const
      }
    ],
    
    // Low severity - potential issues
    low: [
      {
        pattern: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g,
        description: 'IP address (may expose internal topology)',
        type: 'sensitive_file' as const
      },
      {
        pattern: /localhost|127\.0\.0\.1/g,
        description: 'Localhost reference',
        type: 'sensitive_file' as const
      }
    ]
  };

  private readonly sensitiveFiles = [
    '**/*.tfstate',
    '**/*.tfstate.backup',
    '**/*.tfvars',
    '**/*.key',
    '**/*.pem',
    '**/*.pfx',
    '**/*.p12',
    '**/.env',
    '**/.env.*',
    '**/id_rsa*',
    '**/id_dsa*'
  ];

  async scanDirectory(directory: string): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];
    
    console.log(`🔍 Scanning directory: ${directory}`);
    
    // Scan source code files
    const codeFiles = await glob('**/*.{ts,js,tf,hcl,json,yaml,yml}', {
      cwd: directory,
      ignore: ['node_modules/**', 'dist/**', '.git/**']
    });
    
    for (const file of codeFiles) {
      const filePath = path.join(directory, file);
      await this.scanFile(filePath, issues);
    }
    
    // Check for sensitive files
    const sensitiveFiles = await glob('**/{.env*,*.tfstate,*.tfvars,*.key,*.pem,*.pfx,*.p12,id_*}', {
      cwd: directory,
      ignore: ['node_modules/**', 'dist/**', '.git/**', '**/*.example']
    });
    
    for (const file of sensitiveFiles) {
      const filePath = path.join(directory, file);
      issues.push({
        file,
        line: 1,
        type: 'sensitive_file',
        severity: 'high',
        description: `Sensitive file should not be in repository: ${path.basename(file)}`
      });
    }
    
    return issues;
  }

  private async scanFile(filePath: string, issues: SecurityIssue[]): Promise<void> {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      // Check all patterns
      for (const [severity, patterns] of Object.entries(this.patterns)) {
        for (const { pattern, description, type } of patterns) {
          let match;
          pattern.lastIndex = 0; // Reset regex
          
          while ((match = pattern.exec(content)) !== null) {
            const lineNumber = this.getLineNumber(content, match.index);
            
            issues.push({
              file: path.relative(process.cwd(), filePath),
              line: lineNumber,
              type,
              severity: severity as 'high' | 'medium' | 'low',
              description,
              pattern: pattern.source
            });
          }
        }
      }
    } catch (error) {
      console.warn(`⚠️  Could not scan file ${filePath}: ${error}`);
    }
  }

  private getLineNumber(content: string, index: number): number {
    return content.substring(0, index).split('\n').length;
  }

  generateReport(issues: SecurityIssue[]): void {
    console.log('\n📊 SECURITY SCAN REPORT');
    console.log('='.repeat(50));
    
    if (issues.length === 0) {
      console.log('✅ No security issues found!');
      return;
    }
    
    // Group by severity
    const highIssues = issues.filter(i => i.severity === 'high');
    const mediumIssues = issues.filter(i => i.severity === 'medium');
    const lowIssues = issues.filter(i => i.severity === 'low');
    
    // Report high severity issues
    if (highIssues.length > 0) {
      console.log('\n🔴 HIGH SEVERITY ISSUES:');
      highIssues.forEach(issue => {
        console.log(`  ❌ ${issue.file}:${issue.line} - ${issue.description}`);
        if (issue.pattern) console.log(`     Pattern: ${issue.pattern}`);
      });
    }
    
    // Report medium severity issues
    if (mediumIssues.length > 0) {
      console.log('\n🟡 MEDIUM SEVERITY ISSUES:');
      mediumIssues.forEach(issue => {
        console.log(`  ⚠️  ${issue.file}:${issue.line} - ${issue.description}`);
        if (issue.pattern) console.log(`     Pattern: ${issue.pattern}`);
      });
    }
    
    // Report low severity issues
    if (lowIssues.length > 0) {
      console.log('\n🟢 LOW SEVERITY ISSUES:');
      lowIssues.forEach(issue => {
        console.log(`  ℹ️  ${issue.file}:${issue.line} - ${issue.description}`);
      });
    }
    
    // Summary
    console.log('\n📈 SUMMARY:');
    console.log(`  High: ${highIssues.length}`);
    console.log(`  Medium: ${mediumIssues.length}`);
    console.log(`  Low: ${lowIssues.length}`);
    console.log(`  Total: ${issues.length}`);
    
    // Recommendations
    if (issues.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      console.log('  • Remove hardcoded secrets and use variables');
      console.log('  • Use secret management services (AWS Secrets Manager, Azure Key Vault)');
      console.log('  • Add .tfvars files to .gitignore');
      console.log('  • Use environment variables for sensitive data');
      console.log('  • Implement pre-commit hooks for secret detection');
      
      // Exit with error code if high severity issues found
      process.exit(highIssues.length > 0 ? 1 : 0);
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const directory = args[0] || process.cwd();
  
  console.log('🛡️  Chiral Security Scanner');
  console.log('==========================');
  
  const scanner = new SecurityScanner();
  const issues = await scanner.scanDirectory(directory);
  scanner.generateReport(issues);
}

if (require.main === module) {
  main().catch(console.error);
}

export { SecurityScanner, SecurityIssue };

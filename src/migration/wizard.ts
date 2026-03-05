// File: src/migration/wizard.ts

// Interactive Migration Wizard for Complex Terraform Setups

import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';
import { ChiralSystem } from '../intent';

export interface MigrationWizardConfig {
  sourcePath: string;
  provider: 'aws' | 'azure' | 'gcp';
  outputPath: string;
  strategy: 'greenfield' | 'progressive' | 'parallel';
  advanced: boolean;
  includeCostAnalysis?: boolean;
  includeComplianceCheck?: boolean;
  generateValidationScripts?: boolean;
}

export class MigrationWizard {
  private rl: readline.Interface;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async start(): Promise<MigrationWizardConfig> {
    console.log('🚀 Chiral Migration Wizard');
    console.log('========================\n');

    const sourcePath = await this.askQuestion('Enter path to Terraform source (directory or .tfstate file): ');
    const provider = await this.selectProvider();
    const outputPath = await this.askQuestion('Enter output path for Chiral config (default: chiral.config.ts): ', 'chiral.config.ts');
    const strategy = await this.selectStrategy();

    const advanced = await this.askYesNo('Enable advanced options? (y/n): ', false);

    let advancedConfig = {};
    if (advanced) {
      advancedConfig = await this.collectAdvancedOptions();
    }

    this.rl.close();

    return {
      sourcePath,
      provider,
      outputPath,
      strategy,
      advanced,
      ...advancedConfig
    } as MigrationWizardConfig;
  }

  private askQuestion(question: string, defaultValue?: string): Promise<string> {
    return new Promise((resolve) => {
      const prompt = defaultValue ? `${question} [${defaultValue}]: ` : `${question}: `;
      this.rl.question(prompt, (answer) => {
        resolve(answer || defaultValue || '');
      });
    });
  }

  private askYesNo(question: string, defaultValue: boolean = false): Promise<boolean> {
    return new Promise((resolve) => {
      const defaultStr = defaultValue ? '[Y/n]' : '[y/N]';
      this.rl.question(`${question} ${defaultStr}: `, (answer) => {
        const normalized = answer.toLowerCase().trim();
        if (normalized === '') {
          resolve(defaultValue);
        } else if (normalized === 'y' || normalized === 'yes') {
          resolve(true);
        } else if (normalized === 'n' || normalized === 'no') {
          resolve(false);
        } else {
          console.log('Please answer y/n or yes/no');
          resolve(this.askYesNo(question, defaultValue));
        }
      });
    });
  }

  private async selectProvider(): Promise<'aws' | 'azure' | 'gcp'> {
    console.log('\nSelect target cloud provider:');
    console.log('1. AWS');
    console.log('2. Azure');
    console.log('3. GCP');

    const choice = await this.askQuestion('Enter choice (1-3): ');

    switch (choice) {
      case '1': return 'aws';
      case '2': return 'azure';
      case '3': return 'gcp';
      default:
        console.log('Invalid choice. Please select 1, 2, or 3.');
        return this.selectProvider();
    }
  }

  private async selectStrategy(): Promise<'greenfield' | 'progressive' | 'parallel'> {
    console.log('\nSelect migration strategy:');
    console.log('1. Greenfield - Complete migration in one operation');
    console.log('2. Progressive - Migrate resources incrementally (recommended)');
    console.log('3. Parallel - Run both systems during transition');

    const choice = await this.askQuestion('Enter choice (1-3): ');

    switch (choice) {
      case '1': return 'greenfield';
      case '2': return 'progressive';
      case '3': return 'parallel';
      default:
        console.log('Invalid choice. Please select 1, 2, or 3.');
        return this.selectStrategy();
    }
  }

  private async collectAdvancedOptions(): Promise<Partial<MigrationWizardConfig>> {
    console.log('\n🔧 Advanced Options:');

    const includeCostAnalysis = await this.askYesNo('Include cost analysis? (y/n): ', true);
    const includeComplianceCheck = await this.askYesNo('Include compliance validation? (y/n): ', true);
    const generateValidationScripts = await this.askYesNo('Generate post-migration validation scripts? (y/n): ', true);

    return {
      includeCostAnalysis,
      includeComplianceCheck,
      generateValidationScripts
    };
  }

  static generateMigrationPlan(config: MigrationWizardConfig): string {
    const plan = `# Chiral Migration Plan
## Generated: ${new Date().toISOString()}

### Source Configuration
- **Source Path**: ${config.sourcePath}
- **Provider**: ${config.provider}
- **Output Path**: ${config.outputPath}

### Migration Strategy: ${config.strategy}

#### Strategy Details:
${MigrationWizard.getStrategyDetails(config.strategy)}

### Recommended Steps:
1. **Analysis Phase**
   \`\`\`bash
   chiral migrate -s ${config.sourcePath} -p ${config.provider} --analyze-only
   \`\`\`

2. **Import Configuration**
   \`\`\`bash
   chiral import -s ${config.sourcePath} -p ${config.provider} -o ${config.outputPath}
   \`\`\`

3. **Validate Configuration**
   \`\`\`bash
   chiral validate -c ${config.outputPath}
   \`\`\`

4. **Generate Artifacts**
   \`\`\`bash
   chiral compile -c ${config.outputPath} -o dist
   \`\`\`

5. **Deploy & Validate**
   - Deploy generated artifacts to ${config.provider}
   - Run post-migration validation scripts
   - Monitor for 24-48 hours

### Risk Assessment:
${MigrationWizard.getRiskAssessment(config)}

---
*Generated by Chiral Migration Wizard*
`;

    return plan;
  }

  private static getStrategyDetails(strategy: string): string {
    switch (strategy) {
      case 'greenfield':
        return '- **Complete migration** in one operation\n- **Lowest risk** for simple setups\n- **Full infrastructure recreation** required';
      case 'progressive':
        return '- **Incremental resource migration** by type\n- **Can run Terraform and Chiral in parallel**\n- **Higher safety** but more complex coordination';
      case 'parallel':
        return '- **Deploy Chiral alongside existing Terraform**\n- **Use load balancers** for traffic switching\n- **Highest safety** with extended testing periods';
      default:
        return 'Unknown strategy';
    }
  }

  private static getRiskAssessment(config: MigrationWizardConfig): string {
    const risks = [];

    if (config.strategy === 'greenfield') {
      risks.push('⚠️ **High Risk**: Complete infrastructure recreation may cause downtime');
    }

    if (config.provider === 'aws') {
      risks.push('✅ **Low Risk**: AWS CloudFormation provides excellent rollback capabilities');
    }

    risks.push('✅ **Zero State Risk**: Chiral eliminates all Terraform state management issues');
    risks.push('✅ **Cost Savings**: No more $0.99/resource/month Terraform Premium fees');

    return risks.join('\n');
  }
}

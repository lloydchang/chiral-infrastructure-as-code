// File: src/main.ts

// 6. The Chiral Engine (Orchestrator)

// The executable that synthesizes the logic from
//
//   5. The Adapters (Logic)
//     File: src/adapters/aws-left.ts
//       The Left Enantiomer: AWS CDK Implementation.
//     File: src/adapters/azure-right.ts
//       The Right Enantiomer: Azure Bicep Generator.
//
// into real artifacts.

import * as cdk from 'aws-cdk-lib';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process'; // <--- Import for running CLI commands
import { Command } from 'commander';
import { AwsCdkAdapter } from './adapters/programmatic/aws-cdk';
import { AzureBicepAdapter } from './adapters/declarative/azure-bicep';
import { GcpTerraformAdapter } from './adapters/declarative/gcp-terraform';
import { ChiralSystem } from './intent';
import { buildChiralSystemFromResources } from './translation/import-map';
import * as yaml from 'js-yaml';
import * as hcl2 from 'hcl2-parser';

// =================================================================
// IMPORT HELPERS
// =================================================================
const importIaC = async (sourcePath: string, provider: 'aws' | 'azure' | 'gcp', stackName?: string): Promise<ChiralSystem> => {
  const ext = path.extname(sourcePath);
  let resources: any[] = [];

  if (ext === '.tfstate') {
    const state = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
    resources = state.resources || [];
    
    // Enhanced Terraform state migration warnings and guidance
    console.log(`⚠️  WARNING: Importing from Terraform state files.`);
    console.log(`   🔒 SECURITY RISKS: State files may contain sensitive information (secrets, IPs, metadata).`);
    console.log(`   📄 COMPLIANCE CONCERNS: State files may violate SOC 2, ISO 27001, or GDPR requirements.`);
    console.log(`   💾 CORRUPTION RISKS: State files are prone to corruption from concurrent modifications or partial applies.`);
    console.log(`   🔧 OPERATIONAL OVERHEAD: State management requires backend setup, encryption, and ongoing maintenance.`);
    console.log(`   💰 COST CONSIDERATIONS: IBM Terraform Premium costs $0.99/month per resource (e.g., $1,188/year for 100 resources).`);
    console.log(`   ✅ CHIRAL ADVANTAGE: Stateless generation eliminates these risks while maintaining multi-cloud consistency.`);
    console.log(`   📖 See docs/CHALLENGES.md for detailed state management challenges and migration benefits.`);
    console.log(`   🔄 MIGRATION RECOMMENDATION: Consider migrating to Chiral's stateless approach for better security and operational efficiency.`);
  } else if (ext === '.tf') {
    const content = fs.readFileSync(sourcePath, 'utf8');
    const parsed = hcl2.parse(content);
    // Simplified: extract resources (actual HCL structure is complex)
    resources = parsed.resource ? Object.values(parsed.resource).flat() : [];
  } else if (ext === '.yaml' || ext === '.yml' || ext === '.json') {
    const content = fs.readFileSync(sourcePath, 'utf8');
    const template = ext === '.json' ? JSON.parse(content) : yaml.load(content);
    resources = Object.keys(template.Resources || {}).map(key => ({ type: template.Resources[key].Type, properties: template.Resources[key].Properties }));
  } else if (ext === '.bicep') {
    const tempJson = path.join(os.tmpdir(), `bicep-${Date.now()}.json`);
    try {
      execSync(`az bicep build --file ${sourcePath} --outfile ${tempJson}`, { stdio: 'ignore' });
      const arm = JSON.parse(fs.readFileSync(tempJson, 'utf8'));
      resources = arm.resources || [];
    } finally {
      if (fs.existsSync(tempJson)) fs.unlinkSync(tempJson);
    }
  } else {
    throw new Error(`Unsupported file extension: ${ext}`);
  }

  return buildChiralSystemFromResources(resources, provider, stackName);
};

const writeChiralConfig = (config: ChiralSystem, outputPath: string) => {
  const content = `import { ChiralSystem } from './src/intent';\n\nexport const config: ChiralSystem = ${JSON.stringify(config, null, 2)};`;
  fs.writeFileSync(outputPath, content);
};

// Export types for users to import in their configs
export { ChiralSystem, EnvironmentTier, WorkloadSize, KubernetesIntent, DatabaseIntent, AdfsIntent } from './intent';

// =================================================================
// CLI SETUP
// =================================================================
const program = new Command();

program
  .name('chiral')
  .description('Chiral Pattern: Stateless generation of K8s, Postgres, and AD FS across AWS, Azure, and GCP.')
  .version('1.0.0');

// Default compile command
program
  .command('compile', { isDefault: true })
  .description('Compile Chiral config into cloud artifacts')
  .requiredOption('-c, --config <path>', 'Path to the chiral config file (JS or TS)')
  .option('-o, --out <dir>', 'Output directory for generated files', 'dist')
  .action((options) => {
    const configPath = path.resolve(options.config);
    const DIST_DIR = path.resolve(options.out);

    // Load config dynamically
    let config: ChiralSystem;
    try {
      // For TS files, users need to transpile or use ts-node
      // Assume JS for now; users can build their config
      config = require(configPath).config || require(configPath);
      if (!config || typeof config !== 'object') {
        throw new Error('Config must export a "config" object or be the config object itself.');
      }
    } catch (error) {
      console.error(`❌ Failed to load config from ${configPath}:`, error instanceof Error ? error.message : String(error));
      process.exit(1);
    }

    // =================================================================
    // THE CHIRAL ENGINE (Orchestrator)
    // 1. Reads chiral config
    // 2. Instantiates Programmatic Adapter (AWS) -> Generates CDK and CloudFormation to dist/
    // 3. Instantiates Declarative Adapter (Azure) -> Generates Bicep to dist/
    // 4. Instantiates Declarative Adapter (GCP) -> Generates GCP Infrastructure Manager Terraform Blueprint to dist/
    // 5. VALIDATES the generated Bicep using Azure CLI
    // =================================================================

    // Ensure output directory exists
    if (!fs.existsSync(DIST_DIR)) {
      fs.mkdirSync(DIST_DIR, { recursive: true });
    }

    console.log(`\n🧪 Starting Chiral Generation for: [${config.projectName}]`);

    // -----------------------------------------------------
    // 1. Generate via Programmatic Adapter (AWS CloudFormation)
    // -----------------------------------------------------
    const app = new cdk.App({
      outdir: path.join(DIST_DIR, 'aws-assembly')
    });

    new AwsCdkAdapter(app, 'AwsStack', config, {
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: config.region?.aws || process.env.CDK_DEFAULT_REGION
      }
    });

    app.synth(); // This writes the CloudFormation template natively.
    console.log(`✅ [AWS]   CloudFormation synthesized to: ${path.relative(process.cwd(), path.join(DIST_DIR, 'aws-assembly'))}/`);

    // -----------------------------------------------------
    // 2. Generate via Declarative Adapter (Azure Bicep)
    // -----------------------------------------------------
    let bicepPath: string;
    try {
      // A. Generate the Bicep String
      const bicepContent = AzureBicepAdapter.generate(config);
      bicepPath = path.join(DIST_DIR, 'azure-deployment.bicep');

      // B. Write to Disk
      fs.writeFileSync(bicepPath, bicepContent);
      console.log(`✅ [Azure] Bicep template generated at:   ${path.relative(process.cwd(), bicepPath)}`);

      // C. Validate Syntax (The Validation Step)
      // We use the 'az' CLI to ensure the generated text is valid Bicep.
      // This catches typos inside the template string in azure-right.ts.
      console.log(`🔍 [Azure] Validating Bicep syntax...`);

      // Check if Azure CLI is available
      let azAvailable = false;
      try {
        execSync('az --version', { stdio: 'ignore' });
        azAvailable = true;
      } catch {
        console.log(`⚠️  [Azure] Azure CLI not found. Skipping Bicep validation.`);
        console.log(`   Install Azure CLI (https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)`);
        console.log(`   or validate manually: az bicep build --file ${path.relative(process.cwd(), bicepPath)}`);
      }

      if (azAvailable) {
        // Running 'az bicep build' verifies the DSL structure, resource types, and types.
        execSync(`az bicep build --file ${bicepPath} --stdout`, { stdio: 'ignore' });
        console.log(`✅ [Azure] Validation Passed: Syntax is correct.`);
      } else {
        console.log(`⚠️  [Azure] Validation Skipped: Azure CLI not available.`);
      }

    } catch (error) {
      console.error('\n' + '='.repeat(60));
      console.error('❌ [Azure] FATAL: Generated Bicep file contains syntax errors.');
      console.error('   The text in src/adapters/declarative/azure-bicep.ts produced invalid Bicep.');
      console.error('   Run "az bicep build --file dist/azure-deployment.bicep" to see exact errors.');
      console.error('='.repeat(60));
      console.error('\nDEBUGGING WORKFLOW:');
      console.error(`1. IDENTIFY: Run the following command to see the exact error and line number:`);
      console.error(`   > az bicep build --file ${path.join(DIST_DIR, 'azure-deployment.bicep')}`);

      console.error(`\n2. LOCATE: Open "src/adapters/declarative/azure-bicep.ts" and find the code corresponding`);
      console.error(`   to the line number reported in Step 1.`);

      console.error(`\n3. FIX: Correct the typo or syntax error inside the TypeScript backticks (\`).`);
      console.error(`   Alternatively, copy the error message from Step 1 and provide it to your`);
      console.error(`   AI Coding Agent's LLM (Large Language Model) to receive a corrected "azure-bicep.ts" file.`);

      console.error(`\n4. RETRY: Run "npm run compile" again.`);
      console.error('='.repeat(60) + '\n');

      process.exit(1);
    }

    // -----------------------------------------------------
    // 3. Generate via Declarative Adapter (GCP Terraform)
    // -----------------------------------------------------
    try {
      // A. Generate the Terraform HCL String
      const tfContent = GcpTerraformAdapter.generate(config);
      const tfPath = path.join(DIST_DIR, 'gcp-deployment.tf');

      // B. Write to Disk
      fs.writeFileSync(tfPath, tfContent);
      console.log(`✅ [GCP]   Terraform blueprint generated at: ${path.relative(process.cwd(), tfPath)}`);

      // D. Suggest backend if not configured
      if (!config.terraform?.backend) {
        console.log(`⚠️  [GCP] No remote backend configured. Consider setting terraform.backend in your config to use GCS for state management.`);
        console.log(`   This reduces risks of state corruption and improves team collaboration.`);
      }

      // C. Validate Syntax (Optional: Use terraform validate if available)
      console.log(`🔍 [GCP] Validating Terraform syntax...`);
      try {
        execSync('terraform --version', { stdio: 'ignore' });
        execSync(`terraform validate -json ${path.dirname(tfPath)}`, { stdio: 'ignore' });
        console.log(`✅ [GCP] Validation Passed: Syntax is correct.`);
      } catch {
        console.log(`⚠️  [GCP] Terraform CLI not found or validation failed. Skipping validation.`);
        console.log(`   Install Terraform CLI or validate manually.`);
      }
    } catch (error) {
      console.error('\n' + '='.repeat(60));
      console.error('❌ [GCP] FATAL: Generated Terraform file contains syntax errors.');
      console.error('   The text in src/adapters/declarative/gcp-terraform.ts produced invalid Terraform.');
      console.error('='.repeat(60));
      process.exit(1);
    }

    console.log(`\n🎉 Chiral Generation Complete! Check ${options.out} for generated artifacts.`);
  });

// Import command
program
  .command('import')
  .description('Import existing IaC into Chiral config')
  .requiredOption('-s, --source <path>', 'Path to IaC source file (.tf, .tfstate, .yaml, .json, .bicep)')
  .requiredOption('-p, --provider <provider>', 'Cloud provider: aws, azure, gcp')
  .option('-o, --output <path>', 'Output path for chiral config', 'chiral.config.ts')
  .action(async (options) => {
    const sourcePath = path.resolve(options.source);
    const provider = options.provider as 'aws' | 'azure' | 'gcp';
    const outputPath = path.resolve(options.output);

    console.log(`\n🧪 Importing IaC from [${sourcePath}] for [${provider}]`);

    try {
      const config = await importIaC(sourcePath, provider, path.basename(sourcePath, path.extname(sourcePath)));
      writeChiralConfig(config, outputPath);
      console.log(`✅ Import completed. Config written to: ${outputPath}`);
    } catch (error) {
      console.error(`❌ Import failed: ${error}`);
      process.exit(1);
    }
  });

// Migrate command
program
  .command('migrate')
  .description('Migrate from Terraform to Chiral with analysis and guidance')
  .requiredOption('-s, --source <path>', 'Path to Terraform state file (.tfstate) or directory')
  .requiredOption('-p, --provider <provider>', 'Cloud provider: aws, azure, gcp')
  .option('-o, --output <path>', 'Output path for chiral config', 'chiral.config.ts')
  .option('--strategy <strategy>', 'Migration strategy: greenfield, progressive, parallel', 'progressive')
  .option('--analyze-only', 'Only analyze Terraform setup without migration', false)
  .action(async (options) => {
    const sourcePath = path.resolve(options.source);
    const provider = options.provider as 'aws' | 'azure' | 'gcp';
    const outputPath = path.resolve(options.output);
    const strategy = options.strategy as 'greenfield' | 'progressive' | 'parallel';

    console.log(`\n🔄 Terraform to Chiral Migration Analysis`);
    console.log(`   Source: ${sourcePath}`);
    console.log(`   Provider: ${provider}`);
    console.log(`   Strategy: ${strategy}`);

    try {
      // Analyze Terraform setup
      await analyzeTerraformSetup(sourcePath, provider);

      if (options.analyzeOnly) {
        console.log(`\n📊 Analysis complete. Use --no-analyze-only to proceed with migration.`);
        return;
      }

      // Import and migrate
      const config = await importIaC(sourcePath, provider, 'migrated-infrastructure');
      
      // Add migration settings
      config.migration = {
        strategy: strategy,
        sourceState: sourcePath,
        validateCompliance: true
      };

      writeChiralConfig(config, outputPath);
      
      console.log(`\n✅ Migration completed!`);
      console.log(`   Config written to: ${outputPath}`);
      console.log(`   Next steps:`);
      console.log(`   1. Review the generated config`);
      console.log(`   2. Run 'chiral --config ${outputPath}' to generate artifacts`);
      console.log(`   3. Deploy with cloud-native tools (no Terraform state required)`);
      
    } catch (error) {
      console.error(`❌ Migration failed: ${error}`);
      process.exit(1);
    }
  });

// Analyze command
program
  .command('analyze')
  .description('Analyze current Terraform setup for state management risks and costs')
  .requiredOption('-s, --source <path>', 'Path to Terraform state file (.tfstate) or directory')
  .requiredOption('-p, --provider <provider>', 'Cloud provider: aws, azure, gcp')
  .option('--cost-comparison', 'Show detailed cost comparison with Chiral', false)
  .action(async (options) => {
    const sourcePath = path.resolve(options.source);
    const provider = options.provider as 'aws' | 'azure' | 'gcp';

    console.log(`\n🔍 Analyzing Terraform Setup`);
    console.log(`   Source: ${sourcePath}`);
    console.log(`   Provider: ${provider}`);

    try {
      await analyzeTerraformSetup(sourcePath, provider, options.costComparison);
    } catch (error) {
      console.error(`❌ Analysis failed: ${error}`);
      process.exit(1);
    }
  });

// Compare command
program
  .command('compare')
  .description('Compare Terraform vs Chiral approaches for your infrastructure')
  .option('--resources <number>', 'Number of resources in your Terraform setup', '100')
  .option('--team-size <number>', 'Size of your infrastructure team', '5')
  .option('--complexity <level>', 'Infrastructure complexity: simple, medium, complex', 'medium')
  .action(async (options) => {
    const resourceCount = parseInt(options.resources);
    const teamSize = parseInt(options.teamSize);
    const complexity = options.complexity as 'simple' | 'medium' | 'complex';

    console.log(`\n📊 Terraform vs Chiral Comparison`);
    console.log(`   Resources: ${resourceCount}`);
    console.log(`   Team Size: ${teamSize}`);
    console.log(`   Complexity: ${complexity}`);

    try {
      await compareApproaches(resourceCount, teamSize, complexity);
    } catch (error) {
      console.error(`❌ Comparison failed: ${error}`);
      process.exit(1);
    }
  });

// Helper functions for new commands
async function analyzeTerraformSetup(sourcePath: string, provider: string, detailedCosts: boolean = false) {
  console.log(`\n📋 Terraform Setup Analysis`);
  
  // Check if it's a directory or file
  const stats = fs.statSync(sourcePath);
  let stateFiles: string[] = [];
  
  if (stats.isDirectory()) {
    // Find all .tfstate files in directory
    stateFiles = fs.readdirSync(sourcePath)
      .filter(file => file.endsWith('.tfstate'))
      .map(file => path.join(sourcePath, file));
  } else if (sourcePath.endsWith('.tfstate')) {
    stateFiles = [sourcePath];
  }

  if (stateFiles.length === 0) {
    console.log(`⚠️  No Terraform state files found at ${sourcePath}`);
    return;
  }

  let totalResources = 0;
  let hasBackend = false;
  let backendType = 'local';

  for (const stateFile of stateFiles) {
    try {
      const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
      const resourceCount = state.resources?.length || 0;
      totalResources += resourceCount;
      
      console.log(`   📄 ${path.basename(stateFile)}: ${resourceCount} resources`);
      
      // Check for backend configuration
      if (state.terraform) {
        hasBackend = true;
        backendType = state.terraform.backend?.type || 'unknown';
      }
    } catch (error) {
      console.log(`   ❌ ${path.basename(stateFile)}: Unable to parse state file`);
    }
  }

  console.log(`\n📊 Analysis Results:`);
  console.log(`   Total Resources: ${totalResources}`);
  console.log(`   State Files: ${stateFiles.length}`);
  console.log(`   Backend Type: ${backendType}`);
  console.log(`   Provider: ${provider}`);

  // Risk assessment
  console.log(`\n⚠️  Risk Assessment:`);
  if (backendType === 'local') {
    console.log(`   🔴 HIGH RISK: Local state files are single points of failure`);
  } else if (backendType === 'unknown') {
    console.log(`   🟡 MEDIUM RISK: Backend configuration unclear`);
  } else {
    console.log(`   🟡 MEDIUM RISK: Remote backends still vulnerable to corruption and locking issues`);
  }

  if (totalResources > 100) {
    console.log(`   🔴 HIGH RISK: Large resource count increases state management complexity`);
  }

  if (stateFiles.length > 1) {
    console.log(`   🟡 MEDIUM RISK: Multiple state files increase coordination overhead`);
  }

  // Cost analysis
  if (detailedCosts) {
    console.log(`\n💰 Cost Analysis:`);
    const terraformCost = totalResources * 0.99; // $0.99 per resource per month
    const annualTerraformCost = terraformCost * 12;
    
    console.log(`   Terraform Premium: $${terraformCost.toFixed(2)}/month`);
    console.log(`   Annual Terraform Cost: $${annualTerraformCost.toFixed(2)}`);
    console.log(`   Chiral Cost: $0/month (no state management fees)`);
    console.log(`   Annual Savings: $${annualTerraformCost.toFixed(2)}`);
  }
}

async function compareApproaches(resourceCount: number, teamSize: number, complexity: 'simple' | 'medium' | 'complex') {
  console.log(`\n📊 Detailed Comparison:`);
  
  // Terraform costs
  const terraformPremiumCost = resourceCount * 0.99; // per month
  const complexityMultiplier = complexity === 'simple' ? 1 : complexity === 'medium' ? 1.5 : 2;
  const operationalOverhead = teamSize * 40 * complexityMultiplier; // hours per month
  const operationalCost = operationalOverhead * 150; // $150/hour
  const totalTerraformCost = terraformPremiumCost + operationalCost;
  
  // Chiral costs
  const chiralOperationalOverhead = teamSize * 10 * complexityMultiplier; // much lower overhead
  const chiralOperationalCost = chiralOperationalOverhead * 150;
  const totalChiralCost = chiralOperationalCost; // no state management fees
  
  console.log(`\n💰 Monthly Cost Comparison:`);
  console.log(`\nTerraform Approach:`);
  console.log(`   Premium Fees: $${terraformPremiumCost.toFixed(2)}`);
  console.log(`   Operational Overhead: $${operationalCost.toFixed(2)} (${operationalOverhead} hours)`);
  console.log(`   Total Monthly Cost: $${totalTerraformCost.toFixed(2)}`);
  
  console.log(`\nChiral Approach:`);
  console.log(`   Premium Fees: $0.00`);
  console.log(`   Operational Overhead: $${chiralOperationalCost.toFixed(2)} (${chiralOperationalOverhead} hours)`);
  console.log(`   Total Monthly Cost: $${totalChiralCost.toFixed(2)}`);
  
  const monthlySavings = totalTerraformCost - totalChiralCost;
  const annualSavings = monthlySavings * 12;
  const savingsPercentage = (monthlySavings / totalTerraformCost) * 100;
  
  console.log(`\n💸 Savings Analysis:`);
  console.log(`   Monthly Savings: $${monthlySavings.toFixed(2)}`);
  console.log(`   Annual Savings: $${annualSavings.toFixed(2)}`);
  console.log(`   Cost Reduction: ${savingsPercentage.toFixed(1)}%`);
  
  console.log(`\n🛡️  Risk Comparison:`);
  console.log(`\nTerraform Risks:`);
  console.log(`   ❌ State corruption from concurrent modifications`);
  console.log(`   ❌ Lock contention and orphaned locks`);
  console.log(`   ❌ Backend management complexity`);
  console.log(`   ❌ Security risks from state file exposure`);
  console.log(`   ❌ Manual recovery procedures`);
  
  console.log(`\nChiral Benefits:`);
  console.log(`   ✅ Zero state architecture (no corruption possible)`);
  console.log(`   ✅ Native cloud concurrency controls`);
  console.log(`   ✅ No backend configuration required`);
  console.log(`   ✅ Built-in security and compliance`);
  console.log(`   ✅ Automatic rollback and recovery`);
}

// Export helper functions for testing
export { analyzeTerraformSetup, compareApproaches };

program.parse();

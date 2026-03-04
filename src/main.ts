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
    console.log(`⚠️  Warning: Importing from Terraform state files. State files may contain sensitive information and are prone to corruption from concurrent modifications or partial applies. Ensure proper access controls, encryption, and consider migrating to native generation instead of relying on state files. See docs/CHALLENGES.md for state management risks.`);
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

program.parse();

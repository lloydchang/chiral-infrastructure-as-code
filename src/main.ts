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
import { execSync } from 'child_process'; // <--- Import for running CLI commands
import { Command } from 'commander';
import { AwsLeftHandAdapter } from './adapters/aws-left';
import { AzureRightHandAdapter } from './adapters/azure-right';
import { GcpRightHandAdapter } from './adapters/gcp-right';
import { ChiralSystem } from './intent';

// Export types for users to import in their configs
export { ChiralSystem, EnvironmentTier, WorkloadSize, KubernetesIntent, DatabaseIntent, AdfsIntent } from './intent';

// =================================================================
// CLI SETUP
// =================================================================
const program = new Command();

program
  .name('chiral')
  .description('Chiral Pattern: Syncing K8s, Postgres, and AD FS across AWS, Azure, and GCP.')
  .version('1.0.0')
  .requiredOption('-c, --config <path>', 'Path to the chiral config file (JS or TS)')
  .option('-o, --out <dir>', 'Output directory for generated files', 'infra')
  .parse();

const options = program.opts();
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
// 2. Instantiates Left Adapter (AWS) -> Synthesizes to dist/
// 3. Instantiates Right Adapter (Azure) -> Generates Bicep to dist/
// 4. Instantiates Right Adapter (GCP) -> Generates Terraform HCL to dist/
// 5. VALIDATES the generated Bicep using Azure CLI
// =================================================================

// Ensure output directory exists
if (!fs.existsSync(DIST_DIR)) {
  fs.mkdirSync(DIST_DIR, { recursive: true });
}

console.log(`\n🧪 Starting Chiral Synthesis for: [${config.projectName}]`);

// -----------------------------------------------------
// 1. Synthesize Left Enantiomer (AWS CloudFormation)
// -----------------------------------------------------
const app = new cdk.App({
  outdir: path.join(DIST_DIR, 'aws-assembly')
});

new AwsLeftHandAdapter(app, 'AwsStack', config, {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }
});

app.synth(); // This writes the CloudFormation template natively.
console.log(`✅ [AWS]   CloudFormation synthesized to: ${path.relative(process.cwd(), path.join(DIST_DIR, 'aws-assembly'))}/`);

// -----------------------------------------------------
// 2. Synthesize Right Enantiomer (Azure Bicep)
// -----------------------------------------------------
let bicepPath: string;
try {
  // A. Generate the Bicep String
  const bicepContent = AzureRightHandAdapter.synthesize(config);
  bicepPath = path.join(DIST_DIR, 'azure-deployment.bicep');

  // B. Write to Disk
  fs.writeFileSync(bicepPath, bicepContent);
  console.log(`✅ [Azure] Bicep template generated at:   ${path.relative(process.cwd(), bicepPath)}`);

  // C. Validate Syntax (The Validation Step)
  // We use the 'az' CLI to ensure the generated text is valid Bicep.
  // This catches typos inside the template string in azure-right.ts.
  console.log(`🔍 [Azure] Validating Bicep syntax...`);

  // Running 'az bicep build' verifies the DSL structure, resource types, and types.
  execSync(`az bicep build --file ${bicepPath} --stdout`, { stdio: 'ignore' });

  console.log(`✅ [Azure] Validation Passed: Syntax is correct.`);

} catch (error) {
  console.error('\n' + '='.repeat(60));
  console.error('❌ [Azure] FATAL: Generated Bicep file contains syntax errors.');
  console.error('   The text in src/adapters/azure-right.ts produced invalid Bicep.');
  console.error('   Run "az bicep build --file dist/azure-deployment.bicep" to see exact errors.');
  console.error('='.repeat(60));
  console.error('\nDEBUGGING WORKFLOW:');
  console.error(`1. IDENTIFY: Run the following command to see the exact error and line number:`);
  console.error(`   > az bicep build --file ${path.join(DIST_DIR, 'azure-deployment.bicep')}`);

  console.error(`\n2. LOCATE: Open "src/adapters/azure-right.ts" and find the code corresponding`);
  console.error(`   to the line number reported in Step 1.`);

  console.error(`\n3. FIX: Correct the typo or syntax error inside the TypeScript backticks (\`).`);
  console.error(`   Alternatively, copy the error message from Step 1 and provide it to your`);
  console.error(`   AI Coding Agent's LLM (Large Language Model) to receive a corrected "azure-right.ts" file.`);

  console.error(`\n4. RETRY: Run "npm run compile" again.`);
  console.error('='.repeat(60) + '\n');

  process.exit(1);
}

// -----------------------------------------------------
// 3. Synthesize GCP Right Enantiomer (Terraform HCL)
// -----------------------------------------------------
try {
  // A. Generate the Terraform HCL String
  const gcpTf = GcpRightHandAdapter.synthesize(config);
  const gcpTfPath = path.join(DIST_DIR, 'gcp-deployment.tf');

  // B. Write to Disk
  fs.writeFileSync(gcpTfPath, gcpTf);
  console.log(`✅ [GCP]   Terraform HCL generated at: ${path.relative(process.cwd(), gcpTfPath)}`);

} catch (error) {
  console.error('\n' + '='.repeat(60));
  console.error('❌ [GCP] FATAL: Generated Terraform HCL file contains errors.');
  console.error('   The text in src/adapters/gcp-right.ts produced invalid Terraform.');
  console.error('='.repeat(60) + '\n');

  process.exit(1);
}

console.log(`\n🎉 Chiral Synthesis Complete! Check ${options.out} for generated artifacts.`);

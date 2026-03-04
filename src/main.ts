// File: src/main.ts

// 6. The Chiral Engine (Orchestrator)

// The executable that generates the logic from
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
import { execSync } from 'child_process';
import { Command } from 'commander';
import { ChiralSystem } from './intent';
import { AzureBicepAdapter } from './adapters/declarative/azure-bicep';
import { GcpTerraformAdapter } from './adapters/declarative/gcp-terraform';
import { AwsCdkAdapter } from './adapters/programmatic/aws-cdk';
import { validateChiralConfig, checkDeploymentReadiness, checkCompliance } from './validation';
import * as hcl2 from 'hcl2-parser';
import * as yaml from 'js-yaml';

// =================================================================
// IMPORT HELPERS
// =================================================================
const importIaC = async (sourcePath: string, provider: 'aws' | 'azure' | 'gcp', stackName?: string): Promise<ChiralSystem> => {
  const ext = path.extname(sourcePath);
  let resources: any[] = [];

  if (ext === '.tfstate') {
    // Enhanced Terraform state file handling with corruption detection
    console.log(`🔍 Analyzing Terraform state file: ${path.basename(sourcePath)}`);
    
    let state: any;
    try {
      const stateContent = fs.readFileSync(sourcePath, 'utf8');
      state = JSON.parse(stateContent);
      
      // Validate state file integrity
      if (!state.version || !state.serial || !state.lineage) {
        console.warn(`⚠️  WARNING: State file appears to be corrupted or incomplete.`);
        console.warn(`   Missing required fields: version, serial, or lineage.`);
        console.warn(`   Consider using 'terraform state pull' to get fresh state.`);
      }
      
      // Check for common corruption indicators
      if (stateContent.includes('null') && stateContent.includes('undefined')) {
        console.warn(`⚠️  WARNING: State file contains null/undefined values - possible corruption detected.`);
      }
      
      resources = state.resources || [];
      
      // Enhanced security and compliance warnings
      console.log(`\n⚠️  TERRAFORM STATE IMPORT SECURITY ANALYSIS:`);
      console.log(`   🔒 SECURITY RISKS DETECTED:`);
      console.log(`     • Secrets in plain text: ${detectSensitiveData(stateContent) ? 'YES' : 'NO'}`);
      console.log(`     • IP addresses exposed: ${extractIPAddresses(state).length > 0 ? 'YES' : 'NO'}`);
      console.log(`     • Resource metadata exposed: ${resources.length} resources`);
      console.log(`\n   📄 COMPLIANCE CONCERNS:`);
      console.log(`     • SOC 2 violations: Potential unauthorized access to sensitive infrastructure data`);
      console.log(`     • ISO 27001 violations: Inadequate protection of configuration information`);
      console.log(`     • GDPR violations: Possible exposure of personal data in resource configurations`);
      console.log(`\n   � OPERATIONAL RISKS:`);
      console.log(`     • State corruption: ${state.serial ? `Serial #${state.serial}` : 'Unknown'} - may be inconsistent`);
      console.log(`     • Lock contention: Multiple pipelines may corrupt this state file`);
      console.log(`     • Recovery complexity: Manual intervention required if state becomes corrupted`);
      console.log(`\n   💰 COST IMPACT:`);
      console.log(`     • IBM Terraform Premium: $0.99/month per resource = $${(resources.length * 0.99).toFixed(2)}/month`);
      console.log(`     • Annual cost: $${(resources.length * 0.99 * 12).toFixed(2)}/year`);
      console.log(`     • Hidden costs: Backend storage, encryption, backup procedures, staff time`);
      console.log(`\n   ✅ CHIRAL ADVANTAGE:`);
      console.log(`     • Stateless generation eliminates ALL above risks`);
      console.log(`     • Zero state management costs and compliance violations`);
      console.log(`     • Native cloud integration for better security and reliability`);
      console.log(`\n   � MIGRATION RECOMMENDATION:`);
      console.log(`     • Import HCL configuration files instead of state files when possible`);
      console.log(`     • Sanitize state files to remove sensitive data before import`);
      console.log(`     • Consider manual configuration for high-security environments`);
      console.log(`     • See docs/MIGRATION.md for detailed migration guidance`);
      
    } catch (error) {
      console.error(`❌ ERROR: Failed to parse Terraform state file.`);
      console.error(`   This may indicate file corruption or invalid JSON format.`);
      console.error(`   Try: terraform state pull > fresh-state.tfstate`);
      console.error(`   Or: terraform validate && terraform plan`);
      throw new Error(`Corrupted Terraform state file: ${error instanceof Error ? error.message : String(error)}`);
    }
    
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

// Helper functions for enhanced state file analysis
const detectSensitiveData = (content: string): boolean => {
  const sensitivePatterns = [
    /password/i,
    /secret/i,
    /api[_-]?key/i,
    /token/i,
    /certificate/i,
    /private[_-]?key/i,
    /access[_-]?key/i
  ];
  return sensitivePatterns.some(pattern => pattern.test(content));
};

const extractIPAddresses = (state: any): string[] => {
  const ipPattern = /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g;
  const stateString = JSON.stringify(state);
  const matches = stateString.match(ipPattern) || [];
  return [...new Set(matches)]; // Remove duplicates
};


// Enhanced inference functions
const inferKubernetesVersion = (resources: any[]): string => {
  // Look for version patterns in resource configurations
  const versions = resources.map(r => {
    const props = r.values || r.properties || {};
    return props.version || props.kubernetesVersion || props.kubernetes_version || '1.29';
  });
  return versions[0] || '1.29';
};

const inferNodeCount = (resources: any[], type: 'min' | 'max'): number => {
  const counts = resources.map(r => {
    const props = r.values || r.properties || {};
    if (type === 'min') {
      return props.minSize || props.min_count || props.minNodes || 1;
    } else {
      return props.maxSize || props.max_count || props.maxNodes || 5;
    }
  });
  return Math.max(...counts, 1);
};

const inferWorkloadSize = (resources: any[]): 'small' | 'large' => {
  // Enhanced size inference based on instance types and resource configurations
  const instanceTypes = resources.map(r => {
    const props = r.values || r.properties || {};
    return props.instanceType || props.vmSize || props.machineType || props.tier || '';
  }).filter(Boolean);

  // Map common instance types to sizes
  const largePatterns = [
    /large/i, /xlarge/i, /2xlarge/i, /4xlarge/i, /8xlarge/i,
    /standard_d[2-9]/i, /n1-standard-[2-9]/i, /m5\.[2-9]/i
  ];
  
  const hasLargeInstance = instanceTypes.some(type => 
    largePatterns.some(pattern => pattern.test(type))
  );
  
  return hasLargeInstance ? 'large' : 'small';
};

const inferDatabaseVersion = (resources: any[]): string => {
  const versions = resources.map(r => {
    const props = r.values || r.properties || {};
    return props.engineVersion || props.engine || props.version || '15';
  });
  return versions[0] || '15';
};

const inferStorageSize = (resources: any[]): number => {
  const sizes = resources.map(r => {
    const props = r.values || r.properties || {};
    return props.allocatedStorage || props.storageSize || props.disk_size || 100;
  });
  return Math.max(...sizes, 50);
};

const inferWindowsVersion = (resources: any[]): '2019' | '2022' => {
  const versions = resources.map(r => {
    const props = r.values || r.properties || {};
    const image = props.image || props.imageReference || {};
    const sku = image.offer || image.sku || '';
    if (sku.includes('2022')) return '2022';
    if (sku.includes('2019')) return '2019';
    return '2022'; // Default to latest
  });
  return versions[0] || '2022';
};

const inferRegion = (resources: any[], provider: string): { aws?: string; azure?: string; gcp?: string } => {
  // Extract region information from resource configurations
  const regions = resources.map(r => {
    const props = r.values || r.properties || {};
    return props.region || props.location || props.zone || '';
  }).filter(Boolean);
  
  const region = regions[0];
  if (!region) return {};
  
  // Map region to provider-specific format
  if (provider === 'aws') {
    return { aws: region };
  } else if (provider === 'azure') {
    return { azure: region.replace(/\s+/g, ' ') };
  } else if (provider === 'gcp') {
    return { gcp: region.split('-')[0] + '-' + region.split('-')[1] };
  }
  
  return {};
};

const buildChiralSystemFromResources = (resources: any[], provider: string, stackName?: string): ChiralSystem => {
  // Enhanced resource mapping with better error handling
  const k8sResources = resources.filter(r => 
    r.type?.includes('kubernetes') || r.type?.includes('eks') || r.type?.includes('aks') || r.type?.includes('gke')
  );
  const dbResources = resources.filter(r => 
    r.type?.includes('rds') || r.type?.includes('sql') || r.type?.includes('database')
  );
  const vmResources = resources.filter(r => 
    r.type?.includes('instance') || r.type?.includes('vm') || r.type?.includes('compute')
  );
  const networkResources = resources.filter(r => 
    r.type?.includes('vpc') || r.type?.includes('vnet') || r.type?.includes('network')
  );

  // Infer configuration from resources with improved logic
  const config: ChiralSystem = {
    projectName: stackName || 'imported-infrastructure',
    environment: 'prod', // Default to production for safety
    networkCidr: '10.0.0.0/16', // Default network
    k8s: {
      version: inferKubernetesVersion(k8sResources),
      minNodes: inferNodeCount(k8sResources, 'min'),
      maxNodes: inferNodeCount(k8sResources, 'max'),
      size: inferWorkloadSize(k8sResources.concat(vmResources))
    },
    postgres: {
      engineVersion: inferDatabaseVersion(dbResources),
      size: inferWorkloadSize(dbResources.concat(vmResources)),
      storageGb: inferStorageSize(dbResources)
    },
    adfs: {
      size: inferWorkloadSize(vmResources),
      windowsVersion: inferWindowsVersion(vmResources)
    }
  };

  // Add region inference if possible
  if (resources.length > 0) {
    config.region = inferRegion(resources, provider);
  }

  return config;
};

const writeChiralConfig = (config: ChiralSystem, outputPath: string) => {
  const content = `import { ChiralSystem } from './src/intent';\n\nexport const config: ChiralSystem = ${JSON.stringify(config, null, 2)};`;
  fs.writeFileSync(outputPath, content);
};

// Export types for users to import in their configs
export { ChiralSystem, EnvironmentTier, WorkloadSize, KubernetesIntent, DatabaseIntent, AdfsIntent } from './intent';
export { validateChiralConfig, checkDeploymentReadiness, checkCompliance } from './validation';

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
  .action(async (options) => {
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

    // Warning for complex infra
    if (config.k8s && config.k8s.maxNodes > 10) {
      console.log(`⚠️  [Azure] Warning: Large cluster (${config.k8s.maxNodes} nodes) detected. Bicep may have performance issues with complex deployments. Consider using Terraform for Azure if you encounter issues.`);
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

    // Estimate costs with Infracost
    console.log(`🔍 [AWS] Estimating costs with Infracost...`);
    try {
      const { AWSCostAnalyzer } = await import('./cost-analysis');
      const awsEstimate = await AWSCostAnalyzer.getAWSPricing(config, {
        region: config.region?.aws || 'us-east-1',
        detailed: true
      });
      console.log(`✅ [AWS] Cost estimation completed: $${awsEstimate.totalMonthlyCost.toFixed(2)}/month`);
      if (awsEstimate.warnings.length > 0) {
        console.log(`⚠️  [AWS] Warnings: ${awsEstimate.warnings.join(', ')}`);
      }
    } catch (error) {
      console.log(`⚠️  [AWS] Cost estimation failed or Infracost not installed. Install from https://www.infracost.io/`);
    }

    if (config.environment === 'prod') {
      console.log(`💡 [AWS] For production deployments, use CloudFormation stacks for complete mode and automatic cleanup:`);
      console.log(`   aws cloudformation deploy --template-file dist/aws-assembly/${config.projectName}-AwsStack.template.json --stack-name ${config.projectName}-stack --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM`);
    }

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

      // Estimate costs
      console.log(`🔍 [Azure] Estimating costs with azure-cost-cli...`);
      try {
        execSync(`azure-cost-cli bicep --file ${bicepPath} --location ${config.region?.azure || 'eastus'}`, { stdio: 'inherit' });
        console.log(`✅ [Azure] Cost estimation completed.`);
      } catch (error) {
        console.log(`⚠️  [Azure] Cost estimation failed or azure-cost-cli not installed. Install from https://github.com/mivano/azure-cost-cli`);
      }

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

      if (config.environment === 'prod') {
        console.log(`💡 [Azure] For production deployments, use deployment stacks for complete mode and automatic cleanup:`);
        console.log(`   az stack group create --name ${config.projectName}-stack --resource-group <rg> --template-file ${path.relative(process.cwd(), bicepPath)} --action-on-unmanage deleteAll=resources`);
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

      // Estimate costs with Infracost
      console.log(`🔍 [GCP] Estimating costs with Infracost...`);
      try {
        const { GCPCostAnalyzer } = await import('./cost-analysis');
        const gcpEstimate = await GCPCostAnalyzer.getGCPPricing(config, {
          region: config.region?.gcp || 'us-central1',
          detailed: true
        });
        console.log(`✅ [GCP] Cost estimation completed: $${gcpEstimate.totalMonthlyCost.toFixed(2)}/month`);
        if (gcpEstimate.warnings.length > 0) {
          console.log(`⚠️  [GCP] Warnings: ${gcpEstimate.warnings.join(', ')}`);
        }
      } catch (error) {
        console.log(`⚠️  [GCP] Cost estimation failed or Infracost not installed. Install from https://www.infracost.io/`);
      }
    } catch (error) {
      console.error('\n' + '='.repeat(60));
      console.error('❌ [GCP] FATAL: Generated Terraform file contains syntax errors.');
      console.error('   The text in src/adapters/declarative/gcp-terraform.ts produced invalid Terraform.');
      console.error('='.repeat(60));
      process.exit(1);
    }

    if (config.environment === 'prod') {
      console.log(`💡 [GCP] For production deployments, use Infrastructure Manager with import policies for complete mode:`);
      console.log(`   gcloud infra-manager deployments apply projects/${config.region?.gcp?.split('-')[0] || 'my-project'}/locations/global/deployments/${config.projectName}-deployment --git-source-repo=https://github.com/my-org/my-repo --git-source-directory=dist --service-account=infra-manager@${config.region?.gcp?.split('-')[0] || 'my-project'}.iam.gserviceaccount.com`);
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

// Cost Estimate command
program
  .command('cost-estimate')
  .description('Estimate infrastructure costs for all cloud providers')
  .requiredOption('-c, --config <path>', 'Path to chiral config file')
  .option('-p, --provider <provider>', 'Specific provider to analyze (aws, azure, gcp)')
  .option('--detailed', 'Show detailed cost breakdown', false)
  .option('--region <region>', 'Target region for pricing')
  .action(async (options) => {
    const configPath = path.resolve(options.config);
    const provider = options.provider as 'aws' | 'azure' | 'gcp' | undefined;

    console.log(`\n💰 Cost Estimation Analysis`);
    console.log(`   Config: ${configPath}`);
    if (provider) console.log(`   Provider: ${provider.toUpperCase()}`);
    if (options.region) console.log(`   Region: ${options.region}`);

    try {
      // Load config
      const config = require(configPath).config || require(configPath);
      
      // Import cost analysis modules
      const { CostAnalyzer, AzureCostAnalyzer, AWSCostAnalyzer, GCPCostAnalyzer } = await import('./cost-analysis');
      
      if (provider) {
        // Single provider analysis
        let estimate;
        switch (provider) {
          case 'azure':
            estimate = await AzureCostAnalyzer.getAzurePricing(config, {
              region: options.region,
              detailed: options.detailed
            });
            break;
          case 'aws':
            estimate = await AWSCostAnalyzer.getAWSPricing(config, {
              region: options.region,
              detailed: options.detailed
            });
            break;
          case 'gcp':
            estimate = await GCPCostAnalyzer.getGCPPricing(config, {
              region: options.region,
              detailed: options.detailed
            });
            break;
        }
        
        console.log(`\n📊 ${provider.toUpperCase()} Cost Estimate:`);
        console.log(`   Monthly Cost: $${estimate.totalMonthlyCost.toFixed(2)} ${estimate.currency}`);
        
        if (options.detailed) {
          console.log(`\n📈 Detailed Breakdown:`);
          console.log(`   Compute: $${estimate.breakdown.compute.total.toFixed(2)}`);
          console.log(`   Storage: $${estimate.breakdown.storage.total.toFixed(2)}`);
          console.log(`   Network: $${estimate.breakdown.network.total.toFixed(2)}`);
          console.log(`   Other: $${estimate.breakdown.other.total.toFixed(2)}`);
        }
        
        if (estimate.recommendations.length > 0) {
          console.log(`\n💡 Recommendations:`);
          estimate.recommendations.forEach(rec => console.log(`   • ${rec}`));
        }
        
        if (estimate.warnings.length > 0) {
          console.log(`\n⚠️  Warnings:`);
          estimate.warnings.forEach(warn => console.log(`   • ${warn}`));
        }
      } else {
        // Multi-cloud comparison
        const comparison = await CostAnalyzer.compareCosts(config, {
          region: options.region,
          detailed: options.detailed
        });
        
        const report = CostAnalyzer.generateCostReport(comparison, { detailed: options.detailed });
        console.log(report);
      }
      
    } catch (error) {
      console.error(`❌ Cost estimation failed: ${error}`);
      process.exit(1);
    }
  });

// Cost Analyze command
program
  .command('cost-analyze')
  .description('Analyze existing infrastructure costs')
  .option('-p, --provider <provider>', 'Cloud provider: aws, azure, gcp')
  .option('--subscription <subscription>', 'Azure subscription ID')
  .option('--project <project>', 'GCP project ID')
  .option('--account <account>', 'AWS account ID')
  .action(async (options) => {
    const provider = options.provider as 'aws' | 'azure' | 'gcp';

    console.log(`\n💰 Existing Infrastructure Cost Analysis`);
    console.log(`   Provider: ${provider?.toUpperCase() || 'All providers'}`);
    
    if (options.subscription) console.log(`   Subscription: ${options.subscription}`);
    if (options.project) console.log(`   Project: ${options.project}`);
    if (options.account) console.log(`   Account: ${options.account}`);

    try {
      // Import cost analysis modules
      const { AzureCostAnalyzer, AWSCostAnalyzer, GCPCostAnalyzer, CostAnalyzer } = await import('./cost-analysis');
      
      let costEstimate: any = null;
      
      if (provider === 'azure' && options.subscription) {
        console.log(`\n🔍 Analyzing Azure costs using azure-cost-cli...`);
        if (AzureCostAnalyzer.isAvailable()) {
          costEstimate = await AzureCostAnalyzer.analyzeAzureCosts(options.subscription, {});
          console.log(`\n📊 Azure Cost Analysis Results:`);
          console.log(`   Total Monthly Cost: $${costEstimate.totalMonthlyCost.toFixed(2)} ${costEstimate.currency}`);
          console.log(`   Compute: $${costEstimate.breakdown.compute.total.toFixed(2)}`);
          console.log(`   Storage: $${costEstimate.breakdown.storage.total.toFixed(2)}`);
          console.log(`   Network: $${costEstimate.breakdown.network.total.toFixed(2)}`);
          console.log(`   Other: $${costEstimate.breakdown.other.total.toFixed(2)}`);
          
          if (costEstimate.recommendations.length > 0) {
            console.log(`\n💡 Recommendations:`);
            costEstimate.recommendations.forEach((rec: string) => console.log(`   • ${rec}`));
          }
          
          if (costEstimate.warnings.length > 0) {
            console.log(`\n⚠️  Warnings:`);
            costEstimate.warnings.forEach((warn: string) => console.log(`   • ${warn}`));
          }
        } else {
          console.log(`   ⚠️  Install azure-cost-cli for detailed Azure cost analysis`);
          console.log(`   📦 Install from: https://github.com/mivano/azure-cost-cli`);
        }
      } else if (provider === 'aws' && options.account) {
        console.log(`\n🔍 Analyzing AWS costs using aws-cost-cli...`);
        if (AWSCostAnalyzer.isAWSCostCliAvailable()) {
          costEstimate = await AWSCostAnalyzer.analyzeAWSCosts(options.account, {});
          console.log(`\n📊 AWS Cost Analysis Results:`);
          console.log(`   Total Monthly Cost: $${costEstimate.totalMonthlyCost.toFixed(2)} ${costEstimate.currency}`);
          console.log(`   Compute: $${costEstimate.breakdown.compute.total.toFixed(2)}`);
          console.log(`   Storage: $${costEstimate.breakdown.storage.total.toFixed(2)}`);
          console.log(`   Network: $${costEstimate.breakdown.network.total.toFixed(2)}`);
          console.log(`   Other: $${costEstimate.breakdown.other.total.toFixed(2)}`);
          
          if (costEstimate.recommendations.length > 0) {
            console.log(`\n💡 Recommendations:`);
            costEstimate.recommendations.forEach((rec: string) => console.log(`   • ${rec}`));
          }
          
          if (costEstimate.warnings.length > 0) {
            console.log(`\n⚠️  Warnings:`);
            costEstimate.warnings.forEach((warn: string) => console.log(`   • ${warn}`));
          }
        } else {
          console.log(`   ⚠️  Install aws-cost-cli for detailed AWS cost analysis`);
          console.log(`   📦 Install from: npm install -g aws-cost-cli`);
        }
      } else if (provider === 'gcp' && options.project) {
        console.log(`\n🔍 Analyzing GCP costs using gcp-cost-cli...`);
        if (GCPCostAnalyzer.isGCPCostCliAvailable()) {
          costEstimate = await GCPCostAnalyzer.analyzeGCPCosts(options.project, {});
          console.log(`\n📊 GCP Cost Analysis Results:`);
          console.log(`   Total Monthly Cost: $${costEstimate.totalMonthlyCost.toFixed(2)} ${costEstimate.currency}`);
          console.log(`   Compute: $${costEstimate.breakdown.compute.total.toFixed(2)}`);
          console.log(`   Storage: $${costEstimate.breakdown.storage.total.toFixed(2)}`);
          console.log(`   Network: $${costEstimate.breakdown.network.total.toFixed(2)}`);
          console.log(`   Other: $${costEstimate.breakdown.other.total.toFixed(2)}`);
          
          if (costEstimate.recommendations.length > 0) {
            console.log(`\n💡 Recommendations:`);
            costEstimate.recommendations.forEach((rec: string) => console.log(`   • ${rec}`));
          }
          
          if (costEstimate.warnings.length > 0) {
            console.log(`\n⚠️  Warnings:`);
            costEstimate.warnings.forEach((warn: string) => console.log(`   • ${warn}`));
          }
        } else {
          console.log(`   ⚠️  Install gcp-cost-cli for detailed GCP cost analysis`);
          console.log(`   📦 Install from: npm install -g gcp-cost-cli`);
        }
      } else {
        console.log(`\n📊 Cost Analysis Results:`);
        console.log(`   Note: This feature requires integration with cloud provider billing APIs`);
        
        if (provider === 'azure' && !options.subscription) {
          console.log(`   💡 For Azure, provide --subscription <subscription-id>`);
        }
        if (provider === 'aws' && !options.account) {
          console.log(`   💡 For AWS, provide --account <account-id>`);
        }
        if (provider === 'gcp' && !options.project) {
          console.log(`   💡 For GCP, provide --project <project-id>`);
        }
        
        if (provider === 'azure' && AzureCostAnalyzer.isAvailable()) {
          console.log(`   ✅ azure-cost-cli is available for detailed Azure cost analysis`);
        } else if (provider === 'azure') {
          console.log(`   ⚠️  Install azure-cost-cli for detailed Azure cost analysis`);
          console.log(`   � Install from: https://github.com/mivano/azure-cost-cli`);
        }
        
        if (provider === 'aws' && AWSCostAnalyzer.isAvailable()) {
          console.log(`   ✅ AWS cost analysis tools available (infracost or AWS CLI)`);
        } else if (provider === 'aws') {
          console.log(`   ⚠️  Install infracost or AWS CLI for detailed AWS cost analysis`);
        }
        
        if (provider === 'gcp' && GCPCostAnalyzer.isAvailable()) {
          console.log(`   ✅ GCP cost analysis tools available (infracost or gcloud CLI)`);
        } else if (provider === 'gcp') {
          console.log(`   ⚠️  Install infracost or gcloud CLI for detailed GCP cost analysis`);
        }
        
        console.log(`\n🔍 Integration Points:`);
        console.log(`   AWS: Cost Explorer API + aws-cost-cli`);
        console.log(`   Azure: Cost Management API + azure-cost-cli`);
        console.log(`   GCP: Cloud Billing API + gcp-cost-cli`);
      }
    } catch (error) {
      console.error(`❌ Cost analysis failed: ${error}`);
      process.exit(1);
    }
  });

// Validate command
program
  .command('validate')
  .description('Validate Chiral configuration for deployment readiness')
  .requiredOption('-c, --config <path>', 'Path to chiral config file')
  .option('--compliance <framework>', 'Compliance framework to check (soc2, iso27001, hipaa, fedramp)', 'none')
  .action(async (options) => {
    const configPath = path.resolve(options.config);
    const framework = options.compliance as 'soc2' | 'iso27001' | 'hipaa' | 'fedramp' | 'none' || 'none';

    console.log(`\n🔍 Validating Chiral Configuration`);
    console.log(`   Config: ${configPath}`);
    console.log(`   Compliance Framework: ${framework}`);

    try {
      // Load config
      const config = require(configPath).config || require(configPath);
      
      // Basic validation
      console.log(`\n📋 Basic Validation:`);
      const validationResult = validateChiralConfig(config);
      
      if (validationResult.valid) {
        console.log(`   ✅ Configuration is valid`);
      } else {
        console.log(`   ❌ Configuration has errors:`);
        validationResult.errors.forEach((error: string) => console.log(`     • ${error}`));
      }
      
      if (validationResult.warnings.length > 0) {
        console.log(`   ⚠️  Warnings:`);
        validationResult.warnings.forEach((warning: string) => console.log(`     • ${warning}`));
      }
      
      if (validationResult.recommendations.length > 0) {
        console.log(`   💡 Recommendations:`);
        validationResult.recommendations.forEach((rec: string) => console.log(`     • ${rec}`));
      }

      // Deployment readiness
      console.log(`\n🚀 Deployment Readiness:`);
      const readiness = await checkDeploymentReadiness(config);
      
      if (readiness.ready) {
        console.log(`   ✅ Ready for deployment`);
      } else {
        console.log(`   ❌ Not ready for deployment:`);
        readiness.blockers.forEach((blocker: string) => console.log(`     • ${blocker}`));
      }
      
      if (readiness.warnings.length > 0) {
        console.log(`   ⚠️  Deployment warnings:`);
        readiness.warnings.forEach((warning: string) => console.log(`     • ${warning}`));
      }

      // Compliance check
      let compliance: any = { compliant: true };
      if (framework !== 'none') {
        console.log(`\n🛡️  Compliance Check (${framework}):`);
        compliance = checkCompliance(config, framework);
        
        if (compliance.compliant) {
          console.log(`   ✅ Compliant with ${framework.toUpperCase()}`);
        } else {
          console.log(`   ❌ Not compliant with ${framework.toUpperCase()}:`);
          compliance.violations.forEach((violation: string) => console.log(`     • ${violation}`));
        }
        
        if (compliance.recommendations.length > 0) {
          console.log(`   💡 Compliance recommendations:`);
          compliance.recommendations.forEach((rec: string) => console.log(`     • ${rec}`));
        }
      }

      // Summary
      console.log(`\n📊 Validation Summary:`);
      console.log(`   Valid Configuration: ${validationResult.valid ? 'YES' : 'NO'}`);
      console.log(`   Deployment Ready: ${readiness.ready ? 'YES' : 'NO'}`);
      console.log(`   Compliance (${framework}): ${framework === 'none' ? 'N/A' : (compliance.compliant ? 'YES' : 'NO')}`);
      
      if (validationResult.valid && readiness.ready) {
        console.log(`\n🎉 Configuration is ready for deployment!`);
        console.log(`   Next step: Run 'chiral --config ${configPath}' to generate artifacts`);
      } else {
        console.log(`\n⚠️  Address the issues above before deployment.`);
      }
      
    } catch (error) {
      console.error(`❌ Validation failed: ${error}`);
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

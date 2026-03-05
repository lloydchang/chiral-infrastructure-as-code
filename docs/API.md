# Chiral Infrastructure as Code - API Reference

## 📋 Table of Contents

1. [Core Interfaces](#core-interfaces)
2. [Intent Layer](#intent-layer)
3. [Translation Layer](#translation-layer)
4. [Adapter Layer](#adapter-layer)
5. [Cost Analysis](#cost-analysis)
6. [Validation & Compliance](#validation--compliance)
7. [CLI Commands](#cli-commands)
8. [Terraform Provider](#terraform-provider)
9. [Migration APIs](#migration-apis)

## 🎯 Core Interfaces

### ChiralSystem

The main configuration interface that defines infrastructure requirements.

```typescript
interface ChiralSystem {
  // Required Fields
  projectName: string;
  environment: 'dev' | 'prod';
  networkCidr: string;
  k8s: KubernetesIntent;
  postgres: DatabaseIntent;
  adfs: AdfsIntent;
  
  // Optional Configuration
  region?: {
    aws?: string;
    azure?: string;
    gcp?: string;
  };
  network?: {
    subnetCidr?: string;
  };
  
  // State Management & Migration
  terraformBridge?: TerraformBridgeConfig;
  pulumiBridge?: PulumiBridgeConfig;
  migration?: MigrationConfig;
  
  // Compliance & Security
  compliance?: ComplianceConfig;
}
```

### Intent Interfaces

#### KubernetesIntent

```typescript
interface KubernetesIntent {
  version: string;        // e.g., "1.35"
  minNodes: number;       // Minimum nodes for autoscaling
  maxNodes: number;       // Maximum nodes for autoscaling
  size: 'small' | 'large'; // Abstract size mapping
}
```

#### DatabaseIntent

```typescript
interface DatabaseIntent {
  engineVersion: string;   // PostgreSQL version, e.g., "15"
  storageGb: number;      // Storage in GB
  size: 'small' | 'large'; // Abstract size mapping
}
```

#### AdfsIntent

```typescript
interface AdfsIntent {
  size: 'small' | 'large';           // Compute power
  windowsVersion: '2019' | '2022';    // Windows Server version
}
```

## 🎯 Intent Layer

### Location: `src/intent/index.ts`

#### Exports

```typescript
export type EnvironmentTier = 'dev' | 'prod';
export type WorkloadSize = 'small' | 'large';
export type ComplianceFramework = 'none' | 'soc2' | 'iso27001' | 'hipaa' | 'fedramp';
export type DeploymentStrategy = 'greenfield' | 'progressive' | 'parallel';

export {
  ChiralSystem,
  KubernetesIntent,
  DatabaseIntent,
  AdfsIntent
};
```

## 🔄 Translation Layer

### Location: `src/translation/`

#### Hardware Mapping (`hardware-map.ts`)

```typescript
export function getRegionalHardwareMap(
  provider: 'aws' | 'azure' | 'gcp',
  regionId: string
): CloudSkuMap;

interface CloudSkuMap {
  db: Record<WorkloadSize, string>;
  vm: Record<WorkloadSize, string>;
  k8s: Record<WorkloadSize, string>;
}
```

**Example Usage**:
```typescript
const hardware = getRegionalHardwareMap('aws', 'us-east-1');
const dbSku = hardware.db.small; // 'db.t3.medium'
const vmSku = hardware.vm.large; // 'm5.xlarge'
```

#### Regional Metadata (`regional-metadata.ts`)

```typescript
export function getRegionalMetadata(
  provider: string,
  regionId: string
): RegionMetadata | null;

export function isServiceAvailable(
  provider: string,
  regionId: string,
  service: keyof RegionalCapabilities['services']
): boolean;

export function getComplianceLevel(
  provider: string,
  regionId: string
): ComplianceLevel;
```

**Example Usage**:
```typescript
const metadata = getRegionalMetadata('aws', 'us-gov-east-1');
const hasK8s = isServiceAvailable('aws', 'us-east-1', 'kubernetes'); // true
const compliance = getComplianceLevel('aws', 'us-gov-east-1'); // 'government'
```

#### Import Mapping (`import-map.ts`)

```typescript
export function mapInstanceTypeToWorkloadSize(
  instanceType: string,
  provider: 'aws' | 'azure' | 'gcp'
): WorkloadSize;

export function buildChiralSystemFromResources(
  resources: any[],
  provider: 'aws' | 'azure' | 'gcp',
  stackName?: string
): ChiralSystem;
```

**Example Usage**:
```typescript
const size = mapInstanceTypeToWorkloadSize('t3.medium', 'aws'); // 'small'
const config = buildChiralSystemFromResources(resources, 'aws', 'my-stack');
```

## 🔧 Adapter Layer

### Location: `src/adapters/`

#### AWS CDK Adapter (`programmatic/aws-cdk.ts`)

```typescript
export class AwsCdkAdapter {
  constructor(
    app: cdk.App,
    stackName: string,
    config: ChiralSystem,
    props?: cdk.StackProps
  );
}
```

**Features**:
- EKS cluster generation with encryption and IAM
- RDS PostgreSQL with automated backups
- VPC networking with private subnets
- EC2 instances for ADFS with security groups

#### Azure Bicep Adapter (`declarative/azure-bicep.ts`)

```typescript
export class AzureBicepAdapter {
  static generate(
    intent: ChiralSystem,
    options: AzureBicepOptions = {}
  ): string;
}

interface AzureBicepOptions {
  useAVM?: boolean;              // Use Azure Verified Modules
  deploymentMode?: 'incremental' | 'complete' | 'deployment-stacks';
  enableIdempotencyFixes?: boolean;
  enableWhatIf?: boolean;
  moduleRegistry?: string;
}
```

**Features**:
- Azure Verified Modules (AVM) integration
- Deployment stacks for complete mode
- Idempotency fixes for known Bicep issues
- What-if analysis support

#### GCP Terraform Adapter (`declarative/gcp-terraform.ts`)

```typescript
export class GcpTerraformAdapter {
  static generate(intent: ChiralSystem): string;
}
```

**Features**:
- GKE cluster with autoscaling
- Cloud SQL PostgreSQL with backups
- Compute Engine instances for ADFS
- VPC and subnet configuration

#### Terraform Adapter (`declarative/terraform-adapter.ts`)

```typescript
export class TerraformAdapter {
  static generate(
    config: ChiralSystem,
    options: Partial<TerraformConfig> = {}
  ): string;
  
  static generateResources(
    config: ChiralSystem,
    options: Partial<TerraformConfig> = {}
  ): TerraformResource[];
}

interface TerraformConfig {
  provider: 'aws' | 'azure' | 'gcp';
  projectName: string;
  environment: string;
  region?: string;
  delegateState?: boolean;
  outputDirectory?: string;
}
```

## 💰 Cost Analysis

### Location: `src/cost-analysis.ts`

#### Cost Analyzer

```typescript
export class CostAnalyzer {
  static async compareCosts(
    config: ChiralSystem,
    options?: CostAnalysisOptions
  ): Promise<CostComparison>;
  
  static async getAWSEstimate(
    config: ChiralSystem,
    options?: CostAnalysisOptions
  ): Promise<CostEstimate>;
  
  static async getGCPEstimate(
    config: ChiralSystem,
    options?: CostAnalysisOptions
  ): Promise<CostEstimate>;
  
  static generateCostReport(
    comparison: CostComparison,
    options?: CostAnalysisOptions
  ): string;
}
```

**Interfaces**:
```typescript
interface CostEstimate {
  provider: 'aws' | 'azure' | 'gcp';
  totalMonthlyCost: number;
  currency: string;
  breakdown: CostBreakdown;
  recommendations: string[];
  warnings: string[];
}

interface CostComparison {
  cheapest: {
    provider: 'aws' | 'azure' | 'gcp';
    cost: number;
    savings: number;
  };
  mostExpensive: {
    provider: 'aws' | 'azure' | 'gcp';
    cost: number;
  };
  estimates: {
    aws: CostEstimate;
    azure: CostEstimate;
    gcp: CostEstimate;
  };
}
```

#### Cloud-Specific Analyzers

##### AWS Cost Analyzer

```typescript
export class AWSCostAnalyzer {
  static async getAWSPricing(
    config: ChiralSystem,
    options?: CostAnalysisOptions
  ): Promise<CostEstimate>;
}
```

**Features**:
- Infracost integration for real-time pricing
- Fallback pricing when Infracost unavailable
- Region-specific cost calculation
- Resource-level cost breakdown

##### Azure Cost Analyzer

```typescript
export class AzureCostAnalyzer {
  static async getAzurePricing(
    config: ChiralSystem,
    options?: CostAnalysisOptions
  ): Promise<CostEstimate>;
  
  static async analyzeAzureCosts(
    subscriptionId: string,
    options?: CostAnalysisOptions
  ): Promise<CostEstimate>;
}
```

**Features**:
- azure-cost-cli integration for real pricing
- Actual cost analysis from billing data
- Azure-specific cost optimization recommendations

##### GCP Cost Analyzer

```typescript
export class GCPCostAnalyzer {
  static async getGCPPricing(
    config: ChiralSystem,
    options?: CostAnalysisOptions
  ): Promise<CostEstimate>;
  
  static async analyzeGCPCosts(
    projectId: string,
    options?: CostAnalysisOptions
  ): Promise<CostEstimate>;
}
```

**Features**:
- gcp-cost-cli integration for actual costs
- GCP-specific pricing models
- Committed use discount analysis

#### Cost Optimizer

```typescript
export class CostOptimizer {
  static analyzeConfiguration(config: ChiralSystem): string[];
  static suggestCostEffectiveAlternatives(config: ChiralSystem): Array<{
    provider: string;
    reason: string;
    savings: string;
  }>;
}
```

## ✅ Validation & Compliance

### Location: `src/validation.ts`

#### Configuration Validation

```typescript
export function validateChiralConfig(config: ChiralSystem): ValidationResult;

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  recommendations: string[];
}
```

**Validations**:
- Required field presence
- Kubernetes version and node count
- PostgreSQL version and storage
- ADFS Windows version
- Network CIDR format
- Region availability

#### Compliance Checking

```typescript
export function checkCompliance(
  config: ChiralSystem,
  framework: 'soc2' | 'iso27001' | 'hipaa' | 'fedramp' = 'soc2'
): ComplianceCheck;

interface ComplianceCheck {
  framework: 'soc2' | 'iso27001' | 'hipaa' | 'fedramp' | 'none';
  compliant: boolean;
  violations: string[];
  recommendations: string[];
}
```

**Compliance Frameworks**:
- **SOC 2**: Security controls and access management
- **ISO 27001**: Information security management
- **HIPAA**: Healthcare data protection
- **FedRAMP**: Federal government requirements

#### Drift Detection

```typescript
export function detectDrift(
  config: ChiralSystem,
  generatedArtifacts: { aws?: string; azure?: string; gcp?: string }
): DriftDetectionResult;

interface DriftDetectionResult {
  hasDrift: boolean;
  driftedResources: string[];
  missingResources: string[];
  addedResources: string[];
  summary: string;
}
```

#### Deployment Readiness

```typescript
export async function checkDeploymentReadiness(config: ChiralSystem): Promise<{
  ready: boolean;
  blockers: string[];
  warnings: string[];
  checklist: { [key: string]: boolean };
}>;
```

## 🖥 CLI Commands

### Location: `src/main.ts`

#### Compile Command

```bash
chiral compile -c <config> -o <output>
```

**Options**:
- `-c, --config <path>`: Path to Chiral config file (required)
- `-o, --out <dir>`: Output directory (default: 'dist')

**Process**:
1. Load and validate configuration
2. Generate AWS CDK artifacts
3. Generate Azure Bicep artifacts  
4. Generate GCP Terraform artifacts
5. Estimate costs for all providers
6. Validate generated artifacts

#### Import Command

```bash
chiral import -s <source> -p <provider> -o <output>
```

**Options**:
- `-s, --source <path>`: Path to IaC source file (required)
- `-p, --provider <provider>`: Cloud provider (required)
- `-o, --output <path>`: Output path for Chiral config

**Supported Sources**:
- Terraform state files (`.tfstate`)
- Terraform HCL files (`.tf`)
- CloudFormation templates (`.json`, `.yaml`)
- ARM templates (`.json`, `.yaml`)
- Bicep files (`.bicep`)
- Pulumi projects

#### Migrate Command

```bash
chiral migrate -s <source> -p <provider> [options]
```

**Options**:
- `-s, --source <path>`: Source path (required)
- `-p, --provider <provider>`: Cloud provider (required)
- `-o, --output <path>`: Output path (default: 'chiral.config.ts')
- `--strategy <strategy>`: Migration strategy (default: 'progressive')
- `--terraform-bridge`: Generate Terraform bridge
- `--pulumi-bridge`: Generate Pulumi bridge
- `--iac-tool <tool>`: Source IaC tool (default: 'terraform')
- `--analyze-only`: Only analyze without migration

**Migration Strategies**:
- **greenfield**: New deployment from scratch
- **progressive**: Gradual resource migration
- **parallel**: Run both systems during transition

#### Terraform Provider Command

```bash
chiral terraform-provider [options]
```

**Options**:
- `--build`: Build Go Terraform provider
- `--example`: Generate example configuration

## 🔧 Terraform Provider

### Location: `src/adapters/terraform-provider/`

#### Provider Resources

##### chiral_kubernetes_cluster

```hcl
resource "chiral_kubernetes_cluster" "main" {
  config = {
    project_name = "my-app"
    environment = "dev"
    k8s = {
      version = "1.35"
      min_nodes = 1
      max_nodes = 3
      size = "small"
    }
    postgres = {
      engine_version = "15"
      storage_gb = 20
      size = "small"
    }
    adfs = {
      size = "small"
      windows_version = "2022"
    }
  }
}
```

**Provider Configuration**:
```hcl
terraform {
  required_providers {
    chiral = {
      source = "chiral-io/chiral"
      version = "~> 1.0"
    }
  }
}
```

#### Provider Features

- **Stateless Operation**: No .tfstate files
- **Multi-Cloud Generation**: Single resource → AWS, Azure, GCP artifacts
- **Cost Comparison**: Built-in cost analysis
- **Validation**: Pre-flight configuration checks

#### Building Provider

```bash
# Build provider
chiral terraform-provider --build

# Install provider
cp terraform-provider-chiral ~/.terraform.d/plugins/

# Use provider
terraform init && terraform apply
```

## 🔄 Migration APIs

### Terraform Migration

```typescript
interface TerraformMigrationConfig {
  sourceState: string;           // Path to .tfstate file
  targetProvider: 'aws' | 'azure' | 'gcp';
  delegateState: boolean;          // Use cloud-native state
  preserveOutputs: boolean;        // Keep existing outputs
}
```

### Pulumi Migration

```typescript
interface PulumiMigrationConfig {
  sourceProject: string;          // Path to Pulumi project
  targetProvider: 'aws' | 'azure' | 'gcp';
  delegateState: boolean;          // Use cloud-native state
  preserveStacks: boolean;        // Keep existing stacks
}
```

### Import Functions

```typescript
// Import from various IaC formats
function importIaC(
  sourcePath: string,
  provider: 'aws' | 'azure' | 'gcp',
  stackName?: string
): Promise<ChiralSystem>;

// Write Chiral configuration
function writeChiralConfig(config: ChiralSystem, outputPath: string): void;
```

## 📊 Error Handling

### Common Error Types

#### Configuration Errors
```typescript
interface ConfigurationError {
  type: 'validation' | 'parsing' | 'mapping';
  field: string;
  message: string;
  suggestion: string;
}
```

#### Generation Errors
```typescript
interface GenerationError {
  type: 'adapter' | 'template' | 'output';
  provider: 'aws' | 'azure' | 'gcp';
  resource: string;
  message: string;
  recovery: string[];
}
```

#### Cost Analysis Errors
```typescript
interface CostError {
  type: 'pricing' | 'comparison' | 'optimization';
  provider: 'aws' | 'azure' | 'gcp';
  message: string;
  fallback: boolean;
}
```

## 🔧 Utilities

### HCL Generation

```typescript
// Location: src/utils/terraform-hcl.ts
export function generateTerraformHcl(config: TerraformConfig): string;
```

### Security Analysis

```typescript
// Location: src/utils/security-analyzer.ts
export function analyzeTerraformState(stateContent: string): {
  secretsFound: boolean;
  ipAddresses: string[];
  metadataExposed: number;
  recommendations: string[];
};
```

### Network Validation

```typescript
// Location: src/utils/network-validator.ts
export function validateNetworkConfiguration(
  cidr: string,
  subnets?: string[]
): NetworkValidationResult;
```

## 📚 Examples

### Basic Configuration

```typescript
// examples/basic-setup/chiral.config.ts
export const config = {
  projectName: 'my-app',
  environment: 'dev',
  networkCidr: '10.0.0.0/16',
  
  k8s: {
    version: '1.35',
    minNodes: 1,
    maxNodes: 3,
    size: 'small'
  },
  
  postgres: {
    engineVersion: '15',
    storageGb: 20,
    size: 'small'
  },
  
  adfs: {
    size: 'small',
    windowsVersion: '2022'
  }
};
```

### Production Configuration

```typescript
// examples/production-setup/chiral.config.ts
export const config = {
  projectName: 'production-app',
  environment: 'prod',
  networkCidr: '10.0.0.0/16',
  
  region: {
    aws: 'us-east-1',
    azure: 'East US',
    gcp: 'us-central1'
  },
  
  k8s: {
    version: '1.35',
    minNodes: 3,
    maxNodes: 10,
    size: 'large'
  },
  
  compliance: {
    framework: 'soc2',
    encryptionAtRest: true,
    auditLogging: true
  }
};
```

### Migration Example

```typescript
// examples/migration-examples/terraform-migration.ts
export const migrationConfig = {
  sourceState: './existing/terraform.tfstate',
  targetProvider: 'aws',
  delegateState: true,
  preserveOutputs: true
};
```

## 🔧 Development

### Testing

```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# End-to-end tests
npm run test:e2e

# Cost analysis tests
npm run test:cost

# Validation tests
npm run test:validation
```

### Building

```bash
# Build TypeScript
npm run build

# Build Terraform provider
npm run build:provider

# Build documentation
npm run docs:build

# Build all artifacts
npm run build:all
```

### Development Server

```bash
# Watch for changes
npm run dev

# Start development server
npm run start

# Run with debug
npm run debug
```

---

**Chiral Infrastructure as Code API Reference** - Complete documentation for stateless multi-cloud infrastructure generation platform.

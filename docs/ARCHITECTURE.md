# Chiral Infrastructure as Code - Architecture Documentation

## 📋 Table of Contents

1. [Overview](#overview)
2. [Core Architecture](#core-architecture)
3. [Intent Layer](#intent-layer)
4. [Translation Layer](#translation-layer)
5. [Adapter Layer](#adapter-layer)
6. [Cost Analysis](#cost-analysis)
7. [Validation & Compliance](#validation--compliance)
8. [Terraform Provider Interface](#terraform-provider-interface)
9. [CLI Interface](#cli-interface)
10. [Migration Capabilities](#migration-capabilities)

## 🎯 Overview

Chiral Infrastructure as Code is a **stateless multi-cloud infrastructure generation platform** that enables teams to:

- **Escape state management complexity** (Terraform .tfstate, Pulumi state)
- **Generate native cloud artifacts** from single configuration
- **Migrate gradually** from existing IaC tools
- **Compare costs** across AWS, Azure, and GCP
- **Maintain compliance** across cloud providers

### Key Differentiators

- **Stateless Generation**: No .tfstate files or remote state backends
- **Multi-Cloud Output**: Single config → AWS CDK, Azure Bicep, GCP Terraform
- **Familiar Syntax**: Terraform provider interface for team adoption
- **Cost Intelligence**: Real-time cost comparison and optimization
- **Compliance-First**: Built-in SOC 2, ISO 27001, HIPAA, FedRAMP checks

## 🏗️ Core Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    CHIRAL ENGINE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │   Intent    │  │ Translation │  │  Adapters   │   │
│  │    Layer    │  │    Layer    │  │    Layer    │   │
│  └─────────────┘  └─────────────┘  └─────────────┘   │
│         │                 │                 │           │
│         ▼                 ▼                 ▼           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │            VALIDATION & COSTS              │   │
│  │         ANALYSIS LAYER                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           CLI & PROVIDERS                   │   │
│  │        INTERFACES LAYER                   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Intent Definition** → Abstract business requirements
2. **Translation** → Cloud-specific resource mapping
3. **Adapter Generation** → Native IaC artifacts
4. **Validation** → Compliance and cost analysis
5. **CLI Interface** → User interaction and deployment

## 🎯 Intent Layer

**Location**: `src/intent/index.ts`

The Intent Layer defines **abstract business requirements** independent of cloud providers.

### Core Interfaces

```typescript
export interface ChiralSystem {
  projectName: string;
  environment: 'dev' | 'prod';
  networkCidr: string;
  
  // Multi-cloud regions
  region?: {
    aws?: string;
    azure?: string;
    gcp?: string;
  };
  
  // Three Pillars of Infrastructure
  k8s: KubernetesIntent;
  postgres: DatabaseIntent;
  adfs: AdfsIntent;
  
  // Migration & State Management
  terraformBridge?: TerraformBridgeConfig;
  pulumiBridge?: PulumiBridgeConfig;
  migration?: MigrationConfig;
  compliance?: ComplianceConfig;
}
```

### Intent Types

- **KubernetesIntent**: Cluster configuration (version, nodes, sizing)
- **DatabaseIntent**: PostgreSQL specifications (version, storage, sizing)
- **AdfsIntent**: Active Directory Federation Services (Windows version, sizing)
- **ComplianceConfig**: Framework requirements (SOC 2, ISO 27001, HIPAA, FedRAMP)

## 🔄 Translation Layer

**Location**: `src/translation/`

The Translation Layer handles **cloud-specific resource mapping** and **regional capabilities**.

### Key Components

#### Hardware Mapping (`hardware-map.ts`)

```typescript
export function getRegionalHardwareMap(provider: 'aws' | 'azure' | 'gcp', regionId: string): CloudSkuMap {
  // Maps abstract sizes (small/large) to cloud-specific SKUs
  // Considers regional availability and compliance requirements
}
```

#### Regional Metadata (`regional-metadata.ts`)

```typescript
export const RegionalMetadata: Record<string, RegionMetadata> = {
  'us-east-1': {
    provider: 'aws',
    complianceLevel: 'standard',
    capabilities: {
      services: { kubernetes: true, postgresql: true, activeDirectory: true },
      instanceTypes: { small: ['t3.medium'], large: ['m5.large'] },
      databaseClasses: { small: ['db.t3.medium'], large: ['db.m5.large'] }
    }
  }
  // ... more regions
};
```

#### Import Mapping (`import-map.ts`)

```typescript
export function buildChiralSystemFromResources(
  resources: any[],
  provider: 'aws' | 'azure' | 'gcp'
): ChiralSystem {
  // Reverse-engineers Chiral intent from existing IaC
}
```

## 🔧 Adapter Layer

**Location**: `src/adapters/`

The Adapter Layer **generates native cloud artifacts** from Chiral intent.

### Programmatic Adapters

#### AWS CDK Adapter (`programmatic/aws-cdk.ts`)

- **Purpose**: Generate AWS CDK constructs
- **Output**: CloudFormation templates
- **Features**: EKS clusters, RDS PostgreSQL, EC2 instances, VPC networking

#### Declarative Adapters

##### Azure Bicep Adapter (`declarative/azure-bicep.ts`)

```typescript
export class AzureBicepAdapter {
  static generate(intent: ChiralSystem, options: AzureBicepOptions = {}): string {
    // Generates production-ready Bicep with Azure Verified Modules (AVM)
    // Handles idempotency fixes and deployment mode selection
  }
}
```

##### GCP Terraform Adapter (`declarative/gcp-terraform.ts`)

```typescript
export class GcpTerraformAdapter {
  static generate(intent: ChiralSystem): string {
    // Generates Terraform HCL for GCP resources
    // Includes state management warnings and best practices
  }
}
```

##### Terraform Provider Adapter (`declarative/terraform-adapter.ts`)

```typescript
export class TerraformAdapter {
  static generate(config: ChiralSystem, options: Partial<TerraformConfig> = {}): string {
    // Generates Terraform HCL for Chiral provider interface
    // Enables teams to use familiar Terraform syntax
  }
}
```

### Terraform Provider Interface

**Location**: `src/adapters/terraform-provider/`

#### Provider Structure

```
src/adapters/terraform-provider/
├── main.go              # Provider entry point
├── provider.go           # Provider implementation
├── go.mod              # Go module configuration
├── Makefile            # Build automation
└── README.md           # Provider documentation
```

#### Key Features

- **Stateless Operation**: No .tfstate files
- **Multi-Cloud Generation**: Single resource → AWS, Azure, GCP artifacts
- **Familiar Syntax**: `resource "chiral_kubernetes_cluster" {}`
- **Cost Comparison**: Built-in cost analysis output

#### Usage Example

```hcl
terraform {
  required_providers {
    chiral = {
      source = "chiral-io/chiral"
      version = "~> 1.0"
    }
  }
}

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
  }
}
```

## 💰 Cost Analysis

**Location**: `src/cost-analysis.ts`

### Multi-Cloud Cost Comparison

```typescript
export class CostAnalyzer {
  static async compareCosts(config: ChiralSystem): Promise<CostComparison> {
    const [awsEstimate, azureEstimate, gcpEstimate] = await Promise.all([
      AWSCostAnalyzer.getAWSPricing(config),
      AzureCostAnalyzer.getAzurePricing(config),
      GCPCostAnalyzer.getGCPPricing(config)
    ]);
    
    return {
      cheapest: { provider: 'aws', cost: 871.97, savings: 14.34 },
      mostExpensive: { provider: 'azure', cost: 1018.00 },
      estimates: { aws: awsEstimate, azure: azureEstimate, gcp: gcpEstimate }
    };
  }
}
```

### Cost Analysis Features

- **Real-time Pricing**: Integration with Infracost, azure-cost-cli
- **Cost Breakdown**: Compute, storage, network, management costs
- **Optimization Recommendations**: Environment-specific cost savings
- **Multi-Cloud Comparison**: Side-by-side cost analysis

### Cost Optimization

```typescript
export class CostOptimizer {
  static analyzeConfiguration(config: ChiralSystem): string[] {
    // Analyzes config for cost optimization opportunities
    // Returns actionable recommendations
  }
}
```

## ✅ Validation & Compliance

**Location**: `src/validation.ts`

### Configuration Validation

```typescript
export function validateChiralConfig(config: ChiralSystem): ValidationResult {
  // Validates structure, values, and relationships
  // Returns errors, warnings, and recommendations
}
```

### Compliance Checking

```typescript
export function checkCompliance(
  config: ChiralSystem,
  framework: 'soc2' | 'iso27001' | 'hipaa' | 'fedramp'
): ComplianceCheck {
  // Validates against compliance frameworks
  // Returns violations and remediation steps
}
```

### Drift Detection

```typescript
export function detectDrift(
  config: ChiralSystem,
  generatedArtifacts: { aws?: string; azure?: string; gcp?: string }
): DriftDetectionResult {
  // Compares generated artifacts with deployed infrastructure
  // Identifies configuration drift
}
```

## 🖥 CLI Interface

**Location**: `src/main.ts`

### Core Commands

#### Compile Command
```bash
chiral compile -c chiral.config.ts -o dist
```
- Generates multi-cloud artifacts
- Validates configurations
- Estimates costs
- Provides deployment guidance

#### Import Command
```bash
chiral import -s existing.tfstate -p aws -o chiral.config.ts
```
- Imports existing IaC into Chiral format
- Analyzes state file security risks
- Provides migration recommendations

#### Migrate Command
```bash
chiral migrate -s terraform-project -p aws --strategy progressive
```
- Analyzes existing infrastructure
- Generates migration plan
- Supports multiple strategies (greenfield, progressive, parallel)

#### Terraform Provider Command
```bash
chiral terraform-provider --build
chiral terraform-provider --example
```
- Builds Terraform provider binary
- Generates example configurations
- Provides installation guidance

### CLI Features

- **Interactive Help**: Context-aware assistance
- **Progress Tracking**: Real-time generation status
- **Error Handling**: Clear error messages and recovery steps
- **Validation**: Pre-flight checks and warnings

## 🔄 Migration Capabilities

### Migration Strategies

#### Greenfield Migration
- **Use Case**: New projects with no existing infrastructure
- **Approach**: Start fresh with Chiral configuration
- **Benefits**: Clean slate, optimal configuration

#### Progressive Migration
- **Use Case**: Existing infrastructure, gradual transition
- **Approach**: Migrate resources one by one
- **Benefits**: Risk mitigation, learning curve

#### Parallel Migration
- **Use Case**: Critical production systems
- **Approach**: Run both systems in parallel
- **Benefits**: Zero downtime, validation period

### Bridge Modes

#### Terraform Bridge
```typescript
terraformBridge: {
  enabled: true,
  provider: 'aws',
  delegateState: true, // Delegate to CloudFormation
  sourcePath: './existing-terraform'
}
```

#### Pulumi Bridge
```typescript
pulumiBridge: {
  enabled: true,
  provider: 'azure',
  delegateState: true, // Delegate to ARM templates
  sourcePath: './existing-pulumi'
}
```

## 📊 File Structure

```
chiral-infrastructure-as-code/
├── src/
│   ├── intent/                    # Business intent definitions
│   │   └── index.ts
│   ├── translation/               # Cloud-specific mappings
│   │   ├── hardware-map.ts
│   │   ├── regional-metadata.ts
│   │   └── import-map.ts
│   ├── adapters/                  # Cloud artifact generators
│   │   ├── programmatic/
│   │   │   └── aws-cdk.ts
│   │   ├── declarative/
│   │   │   ├── azure-bicep.ts
│   │   │   ├── gcp-terraform.ts
│   │   │   └── terraform-adapter.ts
│   │   └── terraform-provider/  # Go Terraform provider
│   ├── cost-analysis.ts           # Multi-cloud cost analysis
│   ├── validation.ts              # Configuration validation
│   ├── utils/                    # Utility functions
│   │   └── terraform-hcl.ts
│   └── main.ts                  # CLI interface
├── examples/                     # Example configurations
│   ├── basic-setup/
│   ├── terraform-provider-example/
│   └── migration-examples/
├── docs/                        # Documentation
│   ├── ARCHITECTURE.md
│   ├── MIGRATION.md
│   └── CHALLENGES.md
└── tests/                       # Test suites
    ├── unit/
    ├── integration/
    └── e2e/
```

## 🚀 Getting Started

### 1. Installation

```bash
# Clone repository
git clone https://github.com/lloydchang/chiral-infrastructure-as-code.git
cd chiral-infrastructure-as-code

# Install dependencies
npm install

# Build project
npm run build
```

### 2. Basic Configuration

```typescript
// chiral.config.ts
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

### 3. Generate Artifacts

```bash
# Generate multi-cloud artifacts
chiral compile -c chiral.config.ts

# Output:
# dist/aws-assembly/          # AWS CloudFormation
# dist/azure-deployment.bicep  # Azure Bicep
# dist/gcp-deployment.tf       # GCP Terraform
```

### 4. Deploy

```bash
# AWS
aws cloudformation deploy \
  --template-file dist/aws-assembly/template.json \
  --stack-name my-app-stack

# Azure
az deployment group create \
  --resource-group my-rg \
  --template-file dist/azure-deployment.bicep

# GCP
cd dist/gcp-deployment
terraform init && terraform apply
```

## 🔧 Advanced Configuration

### Regional Compliance

```typescript
export const config = {
  region: {
    aws: 'us-gov-east-1',    // FedRAMP compliant
    azure: 'usgovvirginia',   // Government cloud
    gcp: 'us-central1'        // Standard region
  },
  
  compliance: {
    framework: 'fedramp',
    dataResidency: {
      aws: 'us-gov-east-1',
      azure: 'usgovvirginia'
    },
    encryptionAtRest: true,
    auditLogging: true
  }
};
```

### Cost Optimization

```typescript
export const config = {
  environment: 'prod',
  k8s: {
    minNodes: 2,  // HA for production
    maxNodes: 10, // Autoscaling enabled
    size: 'medium' // Optimized sizing
  }
};
```

## 📚 Additional Resources

- [Migration Guide](./MIGRATION.md) - Detailed migration strategies
- [Challenges Analysis](./CHALLENGES.md) - State management problems solved
- [Examples](../examples/) - Real-world configuration examples
- [API Reference](./API.md) - Complete API documentation

## 🤝 Contributing

1. **Fork** the repository
2. **Create** feature branch
3. **Implement** changes with tests
4. **Document** new features
5. **Submit** pull request

### Development Setup

```bash
# Install development dependencies
npm install --dev

# Run tests
npm test

# Run integration tests
npm run test:integration

# Build documentation
npm run docs:build
```

---

**Chiral Infrastructure as Code** - Stateless multi-cloud infrastructure generation that escapes the complexity of traditional IaC state management while preserving team expertise and enabling gradual migration to modern cloud-native practices.

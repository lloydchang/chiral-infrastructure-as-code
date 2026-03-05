# 🧪 Chiral Infrastructure as Code - Complete Guide

## 📋 Table of Contents

1. [Overview](#overview)
2. [Installation & Setup](#installation--setup)
3. [Configuration Deep Dive](#configuration-deep-dive)
4. [Multi-Cloud Generation](#multi-cloud-generation)
5. [Cost Management](#cost-management)
6. [Migration Strategies](#migration-strategies)
7. [Terraform Provider](#terraform-provider)
8. [Advanced Features](#advanced-features)
9. [Troubleshooting](#troubleshooting)
10. [Best Practices](#best-practices)

## 🎯 Overview

Chiral Infrastructure as Code is a **stateless multi-cloud infrastructure generation platform** that solves the core enterprise challenges of traditional IaC tools.

### Problems Solved

#### Traditional IaC Challenges
- ❌ **State Management Complexity**: .tfstate files, corruption risks, lock conflicts
- ❌ **Provider Lock-in**: Vendor-specific ecosystems, migration difficulty
- ❌ **Multi-Cloud Complexity**: Different tools for each cloud provider
- ❌ **Cost Visibility**: Separate cost analysis across cloud providers
- ❌ **Compliance Burden**: Manual compliance checking across environments

#### Chiral Solutions
- ✅ **Stateless Generation**: No .tfstate files, direct cloud deployment
- ✅ **Multi-Cloud Output**: Single config → AWS, Azure, GCP artifacts
- ✅ **Familiar Interfaces**: Terraform provider syntax, gradual migration
- ✅ **Cost Intelligence**: Real-time multi-cloud cost comparison
- ✅ **Compliance-First**: Built-in SOC 2, ISO 27001, HIPAA, FedRAMP (Low/Moderate/High), GovRAMP (Low/Moderate/High)

## 🚀 Installation & Setup

### System Requirements

- **Node.js**: 18.0 or higher
- **npm**: 8.0 or higher
- **Go**: 1.21 or higher (for Terraform provider)
- **Cloud CLIs**: AWS CLI, Azure CLI, gcloud (optional but recommended)

### Installation Steps

```bash
# 1. Clone repository
git clone https://github.com/lloydchang/chiral-infrastructure-as-code.git
cd chiral-infrastructure-as-code

# 2. Install dependencies
npm install

# 3. Build project
npm run build

# 4. Verify installation
chiral --version
```

### Development Setup

```bash
# Install development dependencies
npm install --dev

# Run tests to verify setup
npm test

# Start development mode
npm run dev
```

## ⚙️ Configuration Deep Dive

### Core Schema Understanding

The `ChiralSystem` interface is the heart of Chiral configuration:

```typescript
interface ChiralSystem {
  // === REQUIRED FIELDS ===
  projectName: string;           // Project identifier
  environment: 'dev' | 'prod';  // Environment tier
  networkCidr: string;           // Network CIDR block
  
  // === THREE PILLARS ===
  k8s: KubernetesIntent;         // Kubernetes cluster configuration
  postgres: DatabaseIntent;        // PostgreSQL database configuration
  adfs: AdfsIntent;             // Active Directory Federation Services
  
  // === OPTIONAL CONFIGURATION ===
  region?: {                      // Multi-cloud regions
    aws?: string;               // AWS region (e.g., 'us-east-1')
    azure?: string;             // Azure region (e.g., 'East US')
    gcp?: string;               // GCP region (e.g., 'us-central1')
  };
  
  network?: {
    subnetCidr?: string;        // Custom subnet CIDR
  };
  
  // === MIGRATION & STATE MANAGEMENT ===
  terraformBridge?: {
    enabled?: boolean;           // Enable Terraform bridge mode
    provider?: 'aws' | 'azure' | 'gcp';
    delegateState?: boolean;      // Delegate state to cloud provider
    sourcePath?: string;        // Path to existing Terraform files
  };
  
  pulumiBridge?: {
    enabled?: boolean;           // Enable Pulumi bridge mode
    provider?: 'aws' | 'azure' | 'gcp';
    delegateState?: boolean;      // Delegate state to cloud provider
    sourcePath?: string;        // Path to existing Pulumi project
  };
  
  // === COMPLIANCE & SECURITY ===
  compliance?: {
    framework?: 'soc2' | 'iso27001' | 'hipaa' | 'fedramp' | 'none';
    dataResidency?: {
      aws?: string;             // AWS region for data residency
      azure?: string;           // Azure region for data residency
      gcp?: string;             // GCP region for data residency
    };
    encryptionAtRest?: boolean;    // Require encryption at rest
    auditLogging?: boolean;       // Enable comprehensive audit logging
  };
}
```

### Intent Interfaces

#### KubernetesIntent

```typescript
interface KubernetesIntent {
  version: string;        // Kubernetes version (e.g., '1.35')
  minNodes: number;       // Minimum nodes for autoscaling
  maxNodes: number;       // Maximum nodes for autoscaling
  size: 'small' | 'large'; // Abstract size mapping
}
```

**Size Mapping**:
- **small**: Development workloads, cost-optimized instances
- **large**: Production workloads, performance-optimized instances

#### DatabaseIntent

```typescript
interface DatabaseIntent {
  engineVersion: string;   // PostgreSQL version (e.g., '15', '16')
  storageGb: number;      // Storage in GB (minimum: 20)
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

### Environment-Specific Best Practices

#### Development Configuration

```typescript
export const devConfig = {
  environment: 'dev',
  k8s: {
    minNodes: 1,        // Single node for cost savings
    maxNodes: 2,        // Limited scaling
    size: 'small'        // Smallest instance size
  },
  postgres: {
    storageGb: 20,       // Minimal storage
    engineVersion: '15'   // Stable version
  }
};
```

#### Production Configuration

```typescript
export const prodConfig = {
  environment: 'prod',
  k8s: {
    minNodes: 3,        // High availability minimum
    maxNodes: 10,       // Reasonable maximum
    size: 'large'        // Production-grade instances
  },
  compliance: {
    framework: 'soc2',
    encryptionAtRest: true,
    auditLogging: true
  }
};
```

## 🌐 Multi-Cloud Generation

### Generation Process

1. **Configuration Loading**: Load and validate Chiral config
2. **Intent Translation**: Map abstract intent to cloud-specific resources
3. **Artifact Generation**: Create native IaC artifacts
4. **Cost Analysis**: Estimate costs for all providers
5. **Validation**: Verify generated artifacts

### AWS Artifacts

**Generated**: CloudFormation templates via AWS CDK

**Location**: `dist/aws-assembly/`

**Resources Generated**:
- **EKS Cluster**: Kubernetes service with encryption
- **RDS PostgreSQL**: Managed database with automated backups
- **VPC Networking**: Virtual private cloud with private subnets
- **EC2 Instances**: Windows servers for ADFS
- **Security Groups**: Network access controls
- **IAM Roles**: Service permissions and access management

**Deployment**:
```bash
cd dist/aws-assembly
aws cloudformation deploy \
  --template-file template.json \
  --stack-name my-app-stack \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM
```

### Azure Artifacts

**Generated**: Bicep templates with Azure Verified Modules

**Location**: `dist/azure-deployment.bicep`

**Resources Generated**:
- **AKS Cluster**: Kubernetes service with Azure AD integration
- **Azure Database**: PostgreSQL with flexible server
- **Virtual Network**: VNet with subnets and NSGs
- **Windows VMs**: Server instances for ADFS
- **Managed Identities**: Azure AD integration and RBAC

**Deployment**:
```bash
az deployment group create \
  --resource-group my-rg \
  --template-file dist/azure-deployment.bicep \
  --parameters @parameters.json
```

### GCP Artifacts

**Generated**: Terraform HCL for GCP resources

**Location**: `dist/gcp-deployment.tf`

**Resources Generated**:
- **GKE Cluster**: Kubernetes engine with autoscaling
- **Cloud SQL**: PostgreSQL with automated backups
- **VPC Network**: VPC with subnets and firewall rules
- **Compute Engine**: VM instances for ADFS
- **Service Accounts**: IAM and service account management

**Deployment**:
```bash
cd dist/gcp-deployment
terraform init
terraform apply
```

## 💰 Cost Management

### Multi-Cloud Cost Comparison

Chiral provides automatic cost estimation during compilation:

```bash
chiral compile -c chiral.config.ts
```

**Output Example**:
```
🔍 [AWS] Estimating costs with Infracost...
✅ [AWS] Cost estimation completed: $871.97/month

🔍 [Azure] Estimating costs with azure-cost-cli...
✅ [Azure] Cost estimation completed: $1018.00/month

🔍 [GCP] Estimating costs with Infracost...
✅ [GCP] Cost estimation completed: $972.00/month
```

### Cost Analysis Report

```typescript
import { CostAnalyzer } from './cost-analysis';

const comparison = await CostAnalyzer.compareCosts(config);
const report = CostAnalyzer.generateCostReport(comparison, { detailed: true });

console.log(report);
```

**Report Structure**:
```
📊 Cost Analysis Report
==================================================

💰 **Summary**
Cheapest: AWS ($871.97/month)
Most Expensive: Azure ($1018.00/month)
Potential Savings: 14.34% with AWS

📈 **Detailed Breakdown**

AWS:
  Total: $871.97/month
  Compute: $586.00 (EKS: $435.00, EC2: $151.00)
  Storage: $180.75 (RDS: $155.00, EBS: $25.75)
  Network: $50.00 (VPC: $15.00, ELB: $35.00)
  Other: $55.22 (CloudWatch: $35.00, IAM: $20.22)
  Recommendations:
    • Consider Reserved Instances for production workloads to save up to 40%
    • Use Graviton instances for better price-performance

Azure:
  Total: $1018.00/month
  Compute: $650.00 (AKS: $450.00, VMs: $200.00)
  Storage: $220.00 (Database: $180.00, Disks: $40.00)
  Network: $80.00 (VNet: $30.00, Load Balancer: $50.00)
  Other: $68.00 (Monitor: $45.00, Azure AD: $23.00)
  Recommendations:
    • Use Azure Hybrid Benefit for Windows Server licenses
    • Consider Spot Instances for non-critical workloads

GCP:
  Total: $972.00/month
  Compute: $620.00 (GKE: $420.00, Compute Engine: $200.00)
  Storage: $195.00 (Cloud SQL: $155.00, Persistent Disks: $40.00)
  Network: $75.00 (VPC: $25.00, Load Balancer: $50.00)
  Other: $82.00 (Cloud Monitoring: $55.00, Service Accounts: $27.00)
  Recommendations:
    • Use Committed Use Discounts for predictable workloads to save up to 30%
    • Consider Preemptible VMs for fault-tolerant workloads
```

### Cost Optimization Strategies

#### Development Environment Optimization

```typescript
export const costEffectiveDevConfig = {
  environment: 'dev',
  k8s: {
    minNodes: 1,        // Single node
    maxNodes: 2,        // Limited scaling
    size: 'small'        // Smallest instances
  },
  postgres: {
    storageGb: 20,       // Minimal storage
    engineVersion: '15'   // Stable version
  }
};
```

#### Production Environment Optimization

```typescript
export const optimizedProdConfig = {
  environment: 'prod',
  k8s: {
    minNodes: 3,        // HA minimum
    maxNodes: 10,       // Reasonable maximum
    size: 'large'       // Production-grade
  },
  compliance: {
    framework: 'soc2',
    encryptionAtRest: true,
    auditLogging: true
  }
};
```

## 🔄 Migration Strategies

### Migration Assessment

Chiral provides comprehensive migration analysis:

```bash
# Analyze existing infrastructure
chiral import -s existing/terraform.tfstate -p aws -o chiral.config.ts
```

**Security Analysis Output**:
```
🔍 Analyzing Terraform state file: terraform.tfstate

⚠️  TERRAFORM STATE IMPORT SECURITY ANALYSIS:
   🔒 SECURITY RISKS DETECTED:
     • Secrets in plain text: YES
     • IP addresses exposed: YES
     • Resource metadata exposed: 25 resources
     • Sensitive configuration data: YES

   📄 COMPLIANCE CONCERNS:
     • SOC 2 violations: Potential unauthorized access to sensitive infrastructure data
     • ISO 27001 violations: Inadequate protection of configuration information
     • GDPR violations: Possible exposure of personal data in resource configurations

   💰 OPERATIONAL RISKS:
     • State corruption: Serial #12345 - may be inconsistent
     • Lock contention: Multiple pipelines may corrupt this state file
     • Recovery complexity: Manual intervention required if state becomes corrupted

   💸 COST IMPACT:
     • IBM Terraform Premium: $0.99/month per resource = $24.75/month
     • Annual cost: $297.00/year
     • Hidden costs: Backend storage, encryption, backup procedures, staff time

   ✅ CHIRAL ADVANTAGE:
     • Stateless generation eliminates ALL above risks
     • Zero state management costs and compliance violations
     • Native cloud integration for better security and reliability

📝 MIGRATION RECOMMENDATION:
   • Import HCL configuration files instead of state files when possible
   • Sanitize state files to remove sensitive data before import
   • Consider manual configuration for high-security environments
```

### Migration Strategies

#### 1. Greenfield Migration

**Use Case**: New projects with no existing infrastructure

**Approach**:
```typescript
// Start fresh with Chiral configuration
export const greenfieldConfig = {
  projectName: 'new-app',
  environment: 'dev',
  // ... optimal configuration from scratch
};
```

**Benefits**:
- Clean slate with optimal configuration
- No migration complexity
- Full Chiral benefits from day one

#### 2. Progressive Migration

**Use Case**: Existing infrastructure, gradual transition

**Approach**:
```typescript
// Phase 1: Network and basic services
export const phase1Config = {
  projectName: 'my-app-migration',
  k8s: { /* minimal config */ },
  postgres: { /* minimal config */ },
  adfs: { /* keep existing */ }
};

// Phase 2: Stateless applications
export const phase2Config = {
  // ... migrate k8s and postgres
  adfs: { /* migrate ADFS */ }
};

// Phase 3: Complete migration
export const phase3Config = {
  // ... full Chiral configuration
  terraformBridge: { /* optional bridge for remaining resources */ }
};
```

**Benefits**:
- Risk mitigation through gradual transition
- Learning curve for teams
- Parallel operation during migration

#### 3. Parallel Migration

**Use Case**: Critical production systems

**Approach**:
- Run both systems in parallel
- Validate Chiral output against existing infrastructure
- Switch when confidence is high

**Benefits**:
- Zero downtime during migration
- Validation period with fallback
- Gradual team training

### Bridge Modes

#### Terraform Bridge

```typescript
export const terraformBridgeConfig = {
  // ... standard configuration
  terraformBridge: {
    enabled: true,
    provider: 'aws',
    delegateState: true,    // Delegate to CloudFormation
    sourcePath: './existing-terraform'
  }
};
```

**Benefits**:
- Keep familiar Terraform syntax
- Eliminate state management issues
- Gradual migration path

#### Pulumi Bridge

```typescript
export const pulumiBridgeConfig = {
  // ... standard configuration
  pulumiBridge: {
    enabled: true,
    provider: 'azure',
    delegateState: true,    // Delegate to ARM templates
    sourcePath: './existing-pulumi'
  }
};
```

## 🔧 Terraform Provider

### Provider Concept

The Chiral Terraform Provider enables teams to use familiar Terraform syntax while escaping state management complexity.

### Installation

```bash
# Build provider
chiral terraform-provider --build

# Install provider
mkdir -p ~/.terraform.d/plugins/
cp terraform-provider-chiral ~/.terraform.d/plugins/

# Verify installation
terraform providers
```

### Basic Usage

Create `main.tf`:

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

### Deployment Process

```bash
# Initialize Terraform
terraform init

# Plan deployment
terraform plan

# Apply configuration
terraform apply
```

**Expected Output**:
```
Apply complete! Resources: 1 added, 0 changed, 0 destroyed.

Outputs:

artifacts = {
  "aws" = "./chiral-artifacts/aws"
  "azure" = "./chiral-artifacts/azure"
  "gcp" = "./chiral-artifacts/gcp"
}

cost_comparison = {
  "aws" = "$871.97/month"
  "azure" = "$1018.00/month"
  "gcp" = "$972.00/month"
  "cheapest" = "AWS"
  "savings" = "14.34%"
}
```

### Provider Features

- **Stateless Operation**: No .tfstate files
- **Multi-Cloud Generation**: Single resource → AWS, Azure, GCP artifacts
- **Cost Comparison**: Built-in cost analysis
- **Validation**: Pre-flight configuration checks
- **Gradual Migration**: Bridge modes for transition

## 🚀 Advanced Features

### Compliance Management

#### SOC 2 Compliance

```typescript
export const soc2Config = {
  compliance: {
    framework: 'soc2',
    encryptionAtRest: true,
    auditLogging: true,
    dataResidency: {
      aws: 'us-east-1',
      azure: 'East US',
      gcp: 'us-central1'
    }
  }
};
```

#### ISO 27001 Compliance

```typescript
export const iso27001Config = {
  compliance: {
    framework: 'iso27001',
    encryptionAtRest: true,
    auditLogging: true,
    dataResidency: {
      aws: 'us-east-1',
      azure: 'East US',
      gcp: 'us-central1'
    }
  }
};
```

#### FedRAMP Compliance

Chiral supports all three FedRAMP impact levels: Low, Moderate, and High.

##### FedRAMP Low Impact

Basic security controls for low-risk systems.

```typescript
export const fedrampLowConfig = {
  compliance: {
    framework: 'fedramp-low',
    encryptionAtRest: true,
    auditLogging: true,
    dataResidency: {
      aws: 'us-east-1',        // Commercial cloud allowed
      azure: 'East US',
      gcp: 'us-central1'
    }
  }
};
```

##### FedRAMP Moderate Impact

Enhanced controls for moderate-risk systems, often requiring government cloud.

```typescript
export const fedrampModerateConfig = {
  compliance: {
    framework: 'fedramp-moderate',
    encryptionAtRest: true,
    auditLogging: true,
    dataResidency: {
      aws: 'us-gov-east-1',    // GovCloud recommended
      azure: 'usgovvirginia',   // Government cloud required
      gcp: 'us-central1'        // Commercial with compensating controls
    }
  }
};
```

##### FedRAMP High Impact

Most stringent controls for high-risk systems, requiring government cloud and additional safeguards.

```typescript
export const fedrampHighConfig = {
  compliance: {
    framework: 'fedramp-high',
    encryptionAtRest: true,
    auditLogging: true,
    dataResidency: {
      aws: 'us-gov-east-1',    // GovCloud mandatory
      azure: 'usgovvirginia',   // Government cloud mandatory
      gcp: 'us-central1'        // Requires additional security controls
    }
  },
  // Additional high-impact requirements
  k8s: {
    minNodes: 3,              // Enhanced availability
    maxNodes: 15,             // Controlled scaling
    size: 'large'
  }
};
```

#### GovRAMP Compliance (formerly StateRAMP)

GovRAMP provides compliance standards for state and local government agencies. Chiral supports GovRAMP across all impact levels.

##### GovRAMP Low Impact

```typescript
export const govrampLowConfig = {
  compliance: {
    framework: 'govramp-low',
    encryptionAtRest: true,
    auditLogging: true,
    dataResidency: {
      aws: 'us-east-1',        // Data residency within state boundaries
      azure: 'East US',
      gcp: 'us-central1'
    }
  }
};
```

##### GovRAMP Moderate Impact

```typescript
export const govrampModerateConfig = {
  compliance: {
    framework: 'govramp-moderate',
    encryptionAtRest: true,
    auditLogging: true,
    dataResidency: {
      aws: 'us-east-1',        // State-specific data residency
      azure: 'East US',
      gcp: 'us-central1'
    }
  },
  k8s: {
    minNodes: 2,              // High availability for state systems
    maxNodes: 10,
    size: 'large'
  }
};
```

##### GovRAMP High Impact

```typescript
export const govrampHighConfig = {
  compliance: {
    framework: 'govramp-high',
    encryptionAtRest: true,
    auditLogging: true,
    dataResidency: {
      aws: 'us-east-1',        // Strict state data residency
      azure: 'East US',
      gcp: 'us-central1'
    }
  },
  k8s: {
    minNodes: 3,              // Maximum availability
    maxNodes: 12,             // Controlled scaling for oversight
    size: 'large'
  },
  postgres: {
    storageGb: 100,           // Minimum storage requirements
    engineVersion: '15'
  }
};
```

### Regional Configuration

#### Multi-Region Setup

```typescript
export const multiRegionConfig = {
  projectName: 'global-app',
  region: {
    aws: 'us-east-1',      // Primary AWS region
    azure: 'East US',        // Primary Azure region
    gcp: 'us-central1'       // Primary GCP region
  },
  compliance: {
    dataResidency: {
      aws: 'us-east-1',
      azure: 'East US',
      gcp: 'us-central1'
    }
  }
};
```

### Advanced Cost Management

#### Cost Optimization Analysis

```typescript
import { CostOptimizer } from './cost-analysis';

const optimizations = CostOptimizer.analyzeConfiguration(config);
console.log('Cost Optimization Recommendations:', optimizations);
```

**Output Examples**:
- Use reserved instances for production workloads
- Consider spot instances for non-critical workloads
- Optimize storage tiers based on access patterns
- Use regional pricing advantages

#### Budget Management

```typescript
export const budgetConfig = {
  // ... standard configuration
  costOptimization: {
    monthlyBudget: 1000,        // Monthly budget limit
    alertThreshold: 0.8,       // Alert at 80% of budget
    optimizationEnabled: true   // Enable automatic optimization
  }
};
```

## 🔧 Troubleshooting

### Common Issues and Solutions

#### Configuration Validation Errors

**Error**: `Project name is required and cannot be empty`

**Solution**:
```typescript
export const config = {
  projectName: 'my-app',  // Add this field
  // ... rest of configuration
};
```

**Error**: `Valid network CIDR is required`

**Solution**:
```typescript
export const config = {
  networkCidr: '10.0.0.0/16',  // Valid CIDR notation
  // ... rest of configuration
};
```

#### Generation Errors

**Error**: `AWS region us-east-1 missing required services: kubernetes`

**Solution**:
```typescript
export const config = {
  region: {
    aws: 'us-west-2'  // Use region with EKS support
  }
};
```

#### Cost Analysis Errors

**Error**: `Infracost not found, using fallback AWS pricing estimation`

**Solution**:
```bash
# Install Infracost
curl -fsSL https://raw.githubusercontent.com/infracost/infracost/master/scripts/install.sh | sh

# Or use AWS CLI
aws --version
```

### Debug Mode

```bash
# Enable verbose logging
DEBUG=chiral:* chiral compile -c chiral.config.ts

# Enable cost analysis debugging
DEBUG=chiral:cost:* chiral compile -c chiral.config.ts
```

### Getting Help

```bash
# General help
chiral --help

# Command-specific help
chiral compile --help
chiral import --help
chiral migrate --help
chiral terraform-provider --help
```

## 📚 Best Practices

### Project Structure

```
my-project/
├── chiral.config.ts          # Main configuration
├── environments/
│   ├── dev.config.ts         # Environment-specific configs
│   ├── staging.config.ts
│   └── prod.config.ts
├── scripts/
│   ├── deploy.sh            # Deployment scripts
│   ├── validate.sh          # Validation scripts
│   └── migrate.sh          # Migration scripts
├── docs/
│   ├── architecture.md        # Architecture decisions
│   ├── runbooks.md          # Operational procedures
│   └── compliance.md        # Compliance requirements
└── tests/
    ├── unit/                # Unit tests
    ├── integration/         # Integration tests
    └── e2e/                # End-to-end tests
```

### Environment Separation

#### Base Configuration

```typescript
// base.config.ts
export const baseConfig = {
  projectName: 'my-app',
  networkCidr: '10.0.0.0/16',
  k8s: {
    version: '1.35',
    size: 'small'
  },
  postgres: {
    engineVersion: '15',
    size: 'small'
  },
  adfs: {
    size: 'small',
    windowsVersion: '2022'
  }
};
```

#### Environment-Specific Configurations

```typescript
// environments/dev.config.ts
import { baseConfig } from '../base.config';

export const config = {
  ...baseConfig,
  environment: 'dev',
  k8s: {
    ...baseConfig.k8s,
    minNodes: 1,
    maxNodes: 2
  },
  postgres: {
    ...baseConfig.postgres,
    storageGb: 20
  }
};

// environments/prod.config.ts
import { baseConfig } from '../base.config';

export const config = {
  ...baseConfig,
  environment: 'prod',
  region: {
    aws: 'us-east-1',
    azure: 'East US',
    gcp: 'us-central1'
  },
  k8s: {
    ...baseConfig.k8s,
    minNodes: 3,
    maxNodes: 10,
    size: 'large'
  },
  postgres: {
    ...baseConfig.postgres,
    storageGb: 100
  },
  compliance: {
    framework: 'soc2',
    encryptionAtRest: true,
    auditLogging: true
  }
};
```

### Security Best Practices

#### Network Security

```typescript
export const secureConfig = {
  networkCidr: '10.0.0.0/16',  // Private IP range
  network: {
    subnetCidr: '10.0.1.0/24'  // Isolated subnet
  },
  compliance: {
    encryptionAtRest: true,           // Encrypt all data
    auditLogging: true              // Enable comprehensive logging
  }
};
```

#### Production Readiness

```typescript
export const productionConfig = {
  environment: 'prod',
  
  // High availability
  k8s: {
    minNodes: 3,        // Multi-AZ deployment
    maxNodes: 10,       // Autoscaling for load
    size: 'large'       // Production-grade instances
  },
  
  // Data protection
  postgres: {
    storageGb: 100,     // Adequate storage
    engineVersion: '15'   // Stable version
  },
  
  // Compliance
  compliance: {
    framework: 'soc2',
    dataResidency: {
      aws: 'us-east-1',    // Specify regions
      azure: 'East US',
      gcp: 'us-central1'
    }
  }
};
```

### Cost Optimization

#### Development Cost Savings

```typescript
export const costEffectiveDevConfig = {
  environment: 'dev',
  k8s: {
    minNodes: 1,        // Single node
    maxNodes: 2,        // Limited scaling
    size: 'small'        // Smallest instances
  },
  postgres: {
    storageGb: 20,       // Minimal storage
    engineVersion: '15'   // Stable version
  }
};
```

#### Production Cost Optimization

```typescript
export const optimizedProdConfig = {
  environment: 'prod',
  k8s: {
    minNodes: 3,        // HA minimum
    maxNodes: 10,       // Reasonable maximum
    size: 'large'       // Cost-effective production size
  },
  
  // Enable cost-saving features
  compliance: {
    framework: 'soc2',
    auditLogging: true
  }
};
```

### Monitoring and Operations

#### Deployment Validation

```bash
# Validate before deployment
chiral validate -c prod.config.ts

# Check deployment readiness
chiral check-readiness -c prod.config.ts

# Generate with cost analysis
chiral compile -c prod.config.ts --analyze-costs
```

#### Drift Detection

```typescript
import { detectDrift } from './validation';

// Check for configuration drift
const driftResult = detectDrift(config, {
  aws: './dist/aws-assembly',
  azure: './dist/azure-deployment.bicep',
  gcp: './dist/gcp-deployment.tf'
});

if (driftResult.hasDrift) {
  console.log('Configuration drift detected:', driftResult.summary);
}
```

## 📞 Additional Resources

### Documentation Structure

- **[Architecture Guide](./docs/ARCHITECTURE.md)** - System architecture and design
- **[API Reference](./docs/API.md)** - Complete API documentation
- **[User Guide](./docs/USER_GUIDE.md)** - Detailed usage instructions
- **[Migration Guide](./docs/MIGRATION.md)** - Migration strategies and examples
- **[Challenges Analysis](./docs/CHALLENGES.md)** - State management problems solved

### Example Configurations

- **[Basic Setup](./examples/basic-setup/)** - Simple configuration examples
- **[Terraform Provider](./examples/terraform-provider-example/)** - Provider usage examples
- **[Migration Examples](./examples/migration-examples/)** - Real-world migration scenarios
- **[Azure Migration](./examples/azure-migration-example/)** - Azure-specific migration
- **[CDK to Chiral](./examples/cdk-to-chiral/)** - AWS CDK migration
- **[Bicep to Chiral](./examples/bicep-to-chiral/)** - Azure Bicep migration

### Community and Support

- **GitHub Issues**: [Report bugs and request features](https://github.com/lloydchang/chiral-infrastructure-as-code/issues)
- **GitHub Discussions**: [Ask questions and share experiences](https://github.com/lloydchang/chiral-infrastructure-as-code/discussions)
- **Examples Repository**: [Real-world configurations](https://github.com/lloydchang/chiral-infrastructure-as-code/tree/main/examples)

---

**Chiral Infrastructure as Code Complete Guide** - Comprehensive documentation for stateless multi-cloud infrastructure generation that enables teams to escape traditional IaC complexity while preserving expertise and enabling gradual migration to modern cloud-native practices.

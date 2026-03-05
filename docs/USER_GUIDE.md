# Chiral Infrastructure as Code - User Guide

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Configuration](#configuration)
3. [Multi-Cloud Generation](#multi-cloud-generation)
4. [Cost Management](#cost-management)
5. [Migration](#migration)
6. [Terraform Provider](#terraform-provider)
7. [Troubleshooting](#troubleshooting)
8. [Best Practices](#best-practices)

## 🚀 Quick Start

### Installation

```bash
# Clone repository
git clone https://github.com/lloydchang/chiral-infrastructure-as-code.git
cd chiral-infrastructure-as-code

# Install dependencies
npm install

# Build project
npm run build
```

### Your First Configuration

Create `chiral.config.ts`:

```typescript
export const config = {
  projectName: 'my-first-app',
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

### Generate Artifacts

```bash
chiral compile -c chiral.config.ts -o dist
```

**Expected Output**:
```
🧪 Starting Chiral Generation for: [my-first-app]

✅ [AWS]   CloudFormation synthesized to: dist/aws-assembly/
✅ [Azure] Bicep template generated at: dist/azure-deployment.bicep
✅ [GCP]   Terraform blueprint generated at: dist/gcp-deployment.tf

🎉 Chiral Generation Complete! Check dist for generated artifacts.
```

## ⚙️ Configuration

### Core Configuration

#### Required Fields

```typescript
export const config = {
  // Project identification
  projectName: 'my-app',           // Required: Project name
  environment: 'dev',              // Required: 'dev' | 'prod'
  networkCidr: '10.0.0.0/16',   // Required: Network CIDR block
  
  // Three Pillars of Infrastructure
  k8s: { /* Kubernetes config */ },
  postgres: { /* PostgreSQL config */ },
  adfs: { /* ADFS config */ }
};
```

#### Optional Configuration

```typescript
export const config = {
  // ... required fields ...
  
  // Multi-cloud regions
  region: {
    aws: 'us-east-1',           // AWS region
    azure: 'East US',             // Azure region  
    gcp: 'us-central1'           // GCP region
  },
  
  // Network configuration
  network: {
    subnetCidr: '10.0.1.0/24'  // Custom subnet CIDR
  },
  
  // Compliance settings
  compliance: {
    framework: 'soc2',            // Compliance framework
    dataResidency: {
      aws: 'us-east-1',          // Data residency requirements
      azure: 'East US',
      gcp: 'us-central1'
    },
    encryptionAtRest: true,         // Require encryption
    auditLogging: true              // Enable audit logging
  }
};
```

### Kubernetes Configuration

```typescript
k8s: {
  version: '1.35',              // Kubernetes version
  minNodes: 1,                   // Minimum nodes for autoscaling
  maxNodes: 3,                   // Maximum nodes for autoscaling
  size: 'small'                   // 'small' | 'large' (abstract sizing)
}
```

**Size Mapping**:
- **small**: Development workloads, lower cost
- **large**: Production workloads, higher performance

### Database Configuration

```typescript
postgres: {
  engineVersion: '15',            // PostgreSQL major version
  storageGb: 20,                 // Storage in GB (min: 20)
  size: 'small'                   // 'small' | 'large' (abstract sizing)
}
```

### ADFS Configuration

```typescript
adfs: {
  size: 'small',                   // 'small' | 'large' (compute power)
  windowsVersion: '2022'           // '2019' | '2022'
}
```

## 🌐 Multi-Cloud Generation

### AWS Artifacts

**Location**: `dist/aws-assembly/`

```bash
# Deploy to AWS
cd dist/aws-assembly
aws cloudformation deploy \
  --template-file template.json \
  --stack-name my-app-stack \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM
```

**Generated Resources**:
- EKS Cluster with encryption
- RDS PostgreSQL with automated backups
- VPC with private subnets
- EC2 instances for ADFS
- Security groups and IAM roles

### Azure Artifacts

**Location**: `dist/azure-deployment.bicep`

```bash
# Deploy to Azure
az deployment group create \
  --resource-group my-rg \
  --template-file dist/azure-deployment.bicep \
  --parameters @parameters.json
```

**Generated Resources**:
- AKS cluster with Azure AD integration
- Azure Database for PostgreSQL
- Virtual Network with subnets
- Windows Server VMs for ADFS
- Managed identities and RBAC

### GCP Artifacts

**Location**: `dist/gcp-deployment.tf`

```bash
# Deploy to GCP
cd dist/gcp-deployment
terraform init
terraform apply
```

**Generated Resources**:
- GKE cluster with autoscaling
- Cloud SQL PostgreSQL
- VPC and subnets
- Compute Engine instances for ADFS
- Service accounts and IAM policies

## 💰 Cost Management

### Cost Estimation

Chiral automatically estimates costs during compilation:

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

### Cost Comparison

```typescript
import { CostAnalyzer } from './cost-analysis';

const comparison = await CostAnalyzer.compareCosts(config);
const report = CostAnalyzer.generateCostReport(comparison);

console.log(report);
```

**Report Example**:
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
  Compute: $586.00
  Storage: $180.75
  Network: $50.00
  Other: $55.22
  Recommendations:
    • Consider Reserved Instances for production workloads to save up to 40%

Azure:
  Total: $1018.00/month
  Compute: $650.00
  Storage: $220.00
  Network: $80.00
  Other: $68.00
  Recommendations:
    • Use Azure Hybrid Benefit for Windows Server licenses

GCP:
  Total: $972.00/month
  Compute: $620.00
  Storage: $195.00
  Network: $75.00
  Other: $82.00
  Recommendations:
    • Use Committed Use Discounts for predictable workloads to save up to 30%
```

### Cost Optimization

#### Environment-Specific Recommendations

**Development**:
```typescript
export const devConfig = {
  environment: 'dev',
  k8s: {
    minNodes: 1,        // Single node for cost savings
    maxNodes: 2,        // Limited scaling
    size: 'small'        // Smallest instance size
  }
};
```

**Production**:
```typescript
export const prodConfig = {
  environment: 'prod',
  k8s: {
    minNodes: 3,        // High availability
    maxNodes: 10,       // Autoscaling enabled
    size: 'large'       // Production-grade instances
  }
};
```

## 🔄 Migration

### From Terraform

#### Import Existing Infrastructure

```bash
# Import Terraform state
chiral import -s existing/terraform.tfstate -p aws -o chiral.config.ts
```

**Output Analysis**:
```
🔍 Analyzing Terraform state file: terraform.tfstate

⚠️  TERRAFORM STATE IMPORT SECURITY ANALYSIS:
   🔒 SECURITY RISKS DETECTED:
     • Secrets in plain text: YES
     • IP addresses exposed: YES
     • Resource metadata exposed: 25 resources

   ✅ CHIRAL ADVANTAGE:
     • Stateless generation eliminates ALL above risks
     • Zero state management costs and compliance violations

📝 Generated Chiral configuration with 12 resources
```

#### Progressive Migration Strategy

```typescript
// Step 1: Start with non-critical resources
export const phase1Config = {
  projectName: 'my-app-migration',
  environment: 'dev',
  
  // Migrate networking first
  k8s: { /* minimal config */ },
  postgres: { /* minimal config */ },
  adfs: { /* keep existing */ }
};

// Step 2: Migrate stateless resources
export const phase2Config = {
  // ... migrate k8s and postgres
  adfs: { /* migrate ADFS */ }
};

// Step 3: Complete migration
export const phase3Config = {
  // ... full Chiral configuration
  terraformBridge: { /* optional bridge for remaining resources */ }
};
```

### From Pulumi

```bash
# Import Pulumi project
chiral import -s ./pulumi-project -p azure -o chiral.config.ts
```

#### Pulumi Bridge Configuration

```typescript
export const config = {
  // ... standard configuration ...
  
  pulumiBridge: {
    enabled: true,
    provider: 'azure',
    delegateState: true,    // Delegate to ARM templates
    sourcePath: './existing-pulumi'
  }
};
```

## 🔧 Terraform Provider

### Installation

```bash
# Build provider
chiral terraform-provider --build

# Install provider
mkdir -p ~/.terraform.d/plugins/
cp terraform-provider-chiral ~/.terraform.d/plugins/
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

### Deploy with Terraform

```bash
# Initialize Terraform
terraform init

# Plan deployment
terraform plan

# Apply configuration
terraform apply
```

**Output**:
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

## 🔧 Troubleshooting

### Common Issues

#### Configuration Validation Errors

**Error**: `Project name is required and cannot be empty`

**Solution**:
```typescript
export const config = {
  projectName: 'my-app',  // Add this field
  // ... rest of config
};
```

**Error**: `Valid network CIDR is required`

**Solution**:
```typescript
export const config = {
  networkCidr: '10.0.0.0/16',  // Valid CIDR notation
  // ... rest of config
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

### Configuration Best Practices

#### Project Structure

```
my-project/
├── chiral.config.ts          # Main configuration
├── environments/
│   ├── dev.config.ts         # Environment-specific configs
│   ├── staging.config.ts
│   └── prod.config.ts
├── scripts/
│   ├── deploy.sh            # Deployment scripts
│   └── validate.sh          # Validation scripts
└── docs/
    ├── architecture.md        # Architecture decisions
    └── runbooks.md          # Operational procedures
```

#### Environment Separation

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

### Migration Best Practices

#### Gradual Migration

1. **Phase 1**: Network and basic services
2. **Phase 2**: Stateless applications
3. **Phase 3**: Databases and stateful services
4. **Phase 4**: Complete migration

#### Validation at Each Phase

```bash
# Validate configuration
chiral validate -c phase1.config.ts

# Test deployment in staging
chiral compile -c phase1.config.ts -o dist/phase1

# Compare costs
chiral cost-compare -c phase1.config.ts
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

## 📞 Getting Help

### Documentation

- [Architecture Guide](./ARCHITECTURE.md) - System architecture
- [API Reference](./API.md) - Complete API documentation
- [Migration Guide](./MIGRATION.md) - Detailed migration strategies
- [Challenges Analysis](./CHALLENGES.md) - Problems solved

### Community

- **GitHub Issues**: [Report bugs and request features](https://github.com/lloydchang/chiral-infrastructure-as-code/issues)
- **GitHub Discussions**: [Ask questions and share experiences](https://github.com/lloydchang/chiral-infrastructure-as-code/discussions)
- **Examples**: [Real-world configurations](../examples/)

### Support

For enterprise support and consulting, contact the Chiral team through GitHub discussions.

---

**Chiral Infrastructure as Code User Guide** - Complete guide for stateless multi-cloud infrastructure generation.

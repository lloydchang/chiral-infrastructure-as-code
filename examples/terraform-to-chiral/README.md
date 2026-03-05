# Terraform to Chiral Migration Guide

This directory provides a guide for migrating from Terraform to the Chiral pattern, specifically addressing the state management challenges that make Terraform problematic at scale.

## Why Migrate from Terraform?

### State Management Problems You're Facing

| **Terraform Issue** | **Chiral Solution** |
|---------------------|---------------------|
| **State Corruption** - Concurrent modifications corrupt state files | **Zero State Architecture** - No state files to corrupt |
| **Lock Contention** - Pipeline timeouts create orphaned locks | **Native Cloud Locking** - Cloud providers handle consistency |
| **Backend Management** - Complex S3/GCS setup with encryption | **No Backend Required** - Each cloud manages its own state |
| **Security Risks** - State files contain sensitive data | **No External State Files** - Sensitive data stays in cloud control plane |
| **Cost Overhead** - IBM Terraform Premium at $0.99/resource/month | **Zero Additional Cost** - No third-party state management fees |

### Migration Benefits

- **Eliminate State Management Overhead**: No more backend configuration, lock management, or state recovery procedures
- **Reduce Security Risks**: No state files containing secrets or metadata to leak
- **Lower Operational Costs**: Avoid $0.99/resource/month fees and associated operational overhead
- **Gain Multi-Cloud Consistency**: Single intent generates AWS, Azure, and GCP deployments
- **Improve Compliance**: Native cloud security controls instead of external state file management

## Migration Process

### Step 1: Assess Your Current Terraform Setup

**Analyze Your State Management Approach:**
```bash
# Identify your current state approach
terraform state pull > current-state.json
grep -r "backend" .terraform/  # Check backend configuration
find . -name "*.tfstate*"      # List all state files
```

**Common Terraform Approaches and Migration Strategy:**
- **A. Local State**: Immediate migration - highest risk profile
- **B. Remote Backend per Environment**: Migrate gradually to reduce complexity
- **C. Coarse-Grained State**: Break down into smaller Chiral configs
- **D/E. Managed Terraform**: Calculate cost savings vs Chiral approach

### Step 2: Import Existing Infrastructure

**Import Terraform State Files:**
```bash
# Import your current Terraform state
npx ts-node src/main.ts import -s path/to/terraform.tfstate -p aws -o chiral.config.ts
```

**Import Terraform HCL Files:**
```bash
# Import Terraform configuration files
npx ts-node src/main.ts import -s main.tf -p aws -o chiral.config.ts
```

The import process will show warnings about state management risks and guide you through the migration benefits.

### Step 3: Configure Migration Settings

**Enhanced Chiral Configuration for Migration:**
```typescript
import { ChiralSystem } from './src/intent';

export const config: ChiralSystem = {
  projectName: 'my-app',
  environment: 'prod',
  networkCidr: '10.0.0.0/16',
  
  // Migration configuration
  migration: {
    strategy: 'progressive', // Gradual migration approach
    sourceState: 'path/to/terraform.tfstate', // Reference original state
    validateCompliance: true // Check compliance during migration
  },
  
  // Compliance settings (replaces state file security concerns)
  compliance: {
    framework: 'soc2',
    dataResidency: {
      aws: 'us-east-1',
      azure: 'eastus',
      gcp: 'us-central1'
    },
    encryptionAtRest: true,
    auditLogging: true
  },
  
  k8s: {
    version: '1.29',
    minNodes: 2,
    maxNodes: 5,
    size: 'large'
  },
  postgres: {
    engineVersion: '15',
    size: 'large',
    storageGb: 100
  },
  adfs: {
    size: 'large',
    windowsVersion: '2022'
  }
};
```

### Step 4: Generate Stateless Artifacts

**Generate Native Cloud Artifacts:**
```bash
# Generate all cloud artifacts from single intent
chiral --config chiral.config.ts
```

**Deploy with Native Tools (No Terraform State Required):**
```bash
# AWS deployment
cd dist/aws-assembly
cdk deploy

# Azure deployment
az deployment group create \
  --resource-group my-rg \
  --template-file azure-deployment.bicep

# GCP deployment
gcloud infra-manager blueprints apply \
  --project my-project \
  --region us-central1 \
  --template-file gcp-deployment.tf
```

### Step 5: Validate Migration

**Compare Deployments:**
```bash
# Verify AWS resources match
aws cloudformation describe-stacks --stack-name AwsStack

# Verify Azure resources match
az resource list --resource-group my-rg

# Verify GCP resources match
gcloud infra-manager deployments list
```

**Cost Comparison:**
```bash
# Calculate Terraform costs (example)
resources=$(terraform state list | wc -l)
terraform_cost=$((resources * 99 / 100))  # $0.99 per resource per month
echo "Terraform Premium cost: $${terraform_cost}/month"
echo "Chiral cost: $0/month (no state management fees)"
```

## Migration Strategies

### Greenfield Migration
- **Best for**: New projects or complete infrastructure rebuilds
- **Approach**: Start fresh with Chiral, decommission Terraform
- **Timeline**: 2-4 weeks
- **Risk**: Low

### Progressive Migration
- **Best for**: Existing production infrastructure
- **Approach**: Migrate service by service, maintain parallel during transition
- **Timeline**: 2-6 months
- **Risk**: Medium

### Parallel Migration
- **Best for**: Complex multi-environment setups
- **Approach**: Run both systems in parallel, gradually shift workloads
- **Timeline**: 3-9 months
- **Risk**: High but controllable

## Cost Analysis Example

### Terraform Premium Costs (100 resources)
- **Base Cost**: $99/month ($0.99 × 100 resources)
- **Operational Overhead**: ~40 hours/month at $150/hour = $6,000/month
- **Total Monthly Cost**: ~$6,099
- **Annual Cost**: ~$73,188

### Chiral Costs
- **Base Cost**: $0/month (no state management fees)
- **Operational Overhead**: ~10 hours/month at $150/hour = $1,500/month
- **Total Monthly Cost**: ~$1,500
- **Annual Cost**: ~$18,000

**Annual Savings**: ~$55,188 (75% cost reduction)

## Common Migration Challenges

### Challenge: Complex Terraform Modules
**Solution**: Break down into smaller Chiral configs, migrate incrementally

### Challenge: Custom Provider Dependencies
**Solution**: Evaluate if custom providers are needed in Chiral approach, often eliminated by native cloud tools

### Challenge: Team Skill Gaps
**Solution**: Training on intent-driven approach, leverage existing cloud knowledge

### Challenge: Compliance Requirements
**Solution**: Use Chiral's compliance framework to enforce requirements natively

## Example: Complete Migration

### Before (Terraform)
```hcl
# Complex state management required
terraform {
  backend "s3" {
    bucket = "my-terraform-state"
    key    = "prod/terraform.tfstate"
    region = "us-east-1"
    encrypt = true
  }
}

resource "aws_eks_cluster" "main" {
  name     = "my-cluster"
  role_arn = aws_iam_role.main.arn
  version  = "1.29"
  
  vpc_config {
    subnet_ids = [aws_subnet.private.*.id]
  }
}

# State corruption risks, lock contention, security concerns...
```

### After (Chiral)
```typescript
// Simple intent-driven configuration
const config: ChiralSystem = {
  projectName: 'my-app',
  environment: 'prod',
  k8s: { version: '1.29', minNodes: 2, maxNodes: 5, size: 'large' }
  // No state files, no locks, no backend configuration
};

// Generate native artifacts
chiral --config config.ts

// Deploy with cloud-native tools (zero state management)
cdk deploy  # AWS
az deployment group create  # Azure
gcloud infra-manager apply  # GCP
```

## Next Steps

1. **Start with Assessment**: Use the import command to analyze your current setup
2. **Choose Migration Strategy**: Based on your infrastructure complexity and timeline
3. **Plan Migration Timeline**: Account for testing and validation
4. **Execute Migration**: Follow the step-by-step process above
5. **Validate and Optimize**: Ensure deployments match and optimize costs

For additional support, see the main documentation and examples directory for specific migration scenarios.

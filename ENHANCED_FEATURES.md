# Chiral Infrastructure as Code - Enhanced Documentation

## Overview

Chiral is a multi-cloud infrastructure generation tool that converts business intent into cloud-native artifacts. This document covers the enhanced capabilities including Terraform migration, Pulumi migration, cost analysis, and multi-format IaC import.

## Core Architecture

### The Chiral Pattern

Chiral uses a "DNA" metaphor with three key components:

1. **Intent Layer** (`src/intent/index.ts`) - Business requirements schema
2. **Translation Layer** (`src/translation/`) - Cloud-agnostic to cloud-specific mapping
3. **Adapters Layer** (`src/adapters/`) - Generate cloud-specific artifacts

### Supported Clouds

- **AWS**: CDK + CloudFormation (Programmatic)
- **Azure**: Bicep (Declarative)
- **GCP**: Terraform (Declarative)
- **Multi-Cloud**: Single intent → All three clouds

## Enhanced Features

### 1. Terraform Migration Interface

#### State File Analysis
```bash
# Analyze Terraform state for migration risks
chiral migrate -s terraform.tfstate -p aws --iac-tool terraform --analyze-only
```

**Analysis Capabilities:**
- State file corruption detection
- Security risk assessment (secrets, IPs exposed)
- Compliance concerns (SOC 2, ISO 27001, GDPR)
- Cost impact analysis (vs Chiral zero-cost model)
- Backend configuration review
- Resource dependency mapping

#### HCL Configuration Import
```bash
# Import Terraform HCL files
chiral import -s main.tf -p aws -o chiral.config.ts
```

**HCL Parsing Features:**
- Module support with recursive extraction
- Variable resolution from `variables.tf`
- Resource type mapping across providers
- Enhanced error handling and validation

#### Migration Strategies

**Greenfield Migration:**
- Complete migration in one go
- Lowest risk for new projects
- Full infrastructure recreation

**Progressive Migration:**
- Incremental resource migration
- Parallel Terraform/Chiral operation
- Higher complexity but lower risk

**Parallel Migration:**
- Chiral deployment alongside existing Terraform
- Load balancer traffic switching
- Highest safety for mission-critical systems

### 2. Pulumi Migration Support

#### YAML Program Import
```bash
# Import Pulumi YAML programs
chiral import -s Pulumi.yaml -p aws -o chiral.config.ts
```

**Pulumi Analysis Features:**
- Project configuration parsing
- Language runtime detection
- Backend configuration review
- State file detection and analysis
- Resource estimation from program files

#### Migration Command
```bash
# Migrate from Pulumi to Chiral
chiral migrate -s ./pulumi-project -p aws --iac-tool pulumi
```

**Pulumi-Specific Analysis:**
- Backend type detection (local/S3/azblob/gcs)
- Language-specific program file scanning
- Complexity assessment
- State management risk evaluation

### 3. Multi-Format IaC Import

Chiral supports importing from multiple IaC formats:

```bash
# Terraform formats
chiral import -s terraform.tfstate -p aws    # State files
chiral import -s main.tf -p aws               # HCL files

# Pulumi formats
chiral import -s Pulumi.yaml -p aws           # YAML programs

# Cloud-native formats
chiral import -s template.json -p aws         # CloudFormation
chiral import -s azuredeploy.bicep -p azure   # Bicep templates
```

### 4. Terraform Bridge Mode

#### State Delegation
```bash
# Generate Terraform with cloud-native state management
chiral migrate -s terraform.tfstate -p aws --terraform-bridge
```

**Bridge Features:**
- Delegates state management to cloud providers
- Eliminates Terraform state corruption risks
- Generates CloudFormation templates for delegation
- Gradual migration path from Terraform

#### Terraform Provider

```bash
# Build custom Terraform provider
chiral terraform-provider --build

# Generate example usage
chiral terraform-provider --example
```

### 5. Advanced Cost Analysis

#### Multi-Cloud Cost Comparison
```bash
# Compare costs across all clouds
chiral cost-compare -c chiral.config.ts
```

**Analysis Tools:**
- **AWS**: Infracost integration
- **Azure**: azure-cost-cli integration
- **GCP**: Infracost integration

#### Cost Estimation Features
- Regional pricing awareness
- Autoscaling cost calculations
- Storage and network cost breakdown
- Cost optimization recommendations
- Currency support (USD default)

### 6. Enhanced Validation & Compliance

#### Configuration Validation
```bash
# Validate Chiral configuration
chiral validate -c chiral.config.ts
```

**Validation Checks:**
- Schema compliance
- Regional capability validation
- Resource limit validation
- Environment-specific rules

#### Compliance Frameworks
```bash
# Check SOC 2 compliance
chiral validate -c chiral.config.ts --compliance soc2

# Check HIPAA compliance
chiral validate -c chiral.config.ts --compliance hipaa
```

**Supported Frameworks:**
- SOC 2
- ISO 27001
- HIPAA
- FedRAMP

## Command Reference

### Core Commands

#### `chiral compile` (default)
Generate cloud artifacts from Chiral config
```bash
chiral compile -c chiral.config.ts -o dist
```

#### `chiral import`
Import existing IaC into Chiral format
```bash
chiral import -s source.file -p aws -o chiral.config.ts
```

#### `chiral migrate`
Comprehensive migration with analysis
```bash
chiral migrate -s source -p aws --iac-tool terraform --strategy progressive
```

#### `chiral validate`
Configuration and compliance validation
```bash
chiral validate -c chiral.config.ts --compliance soc2
```

#### `chiral cost-compare`
Multi-cloud cost analysis
```bash
chiral cost-compare -c chiral.config.ts
```

#### `chiral terraform-provider`
Custom Terraform provider management
```bash
chiral terraform-provider --build
chiral terraform-provider --example
```

## Migration Workflows

### From Terraform

1. **Analyze State:**
   ```bash
   chiral migrate -s terraform.tfstate -p aws --analyze-only
   ```

2. **Import Configuration:**
   ```bash
   chiral import -s terraform.tfstate -p aws -o chiral.config.ts
   ```

3. **Validate & Test:**
   ```bash
   chiral validate -c chiral.config.ts
   chiral compile -c chiral.config.ts
   ```

4. **Deploy:**
   ```bash
   # AWS: CloudFormation
   aws cloudformation deploy --template-file dist/aws-assembly/template.json

   # Azure: Bicep
   az deployment group create --resource-group rg --template-file dist/azure-deployment.bicep

   # GCP: Terraform
   terraform apply dist/gcp-deployment.tf
   ```

### From Pulumi

1. **Analyze Project:**
   ```bash
   chiral migrate -s ./pulumi-project -p aws --iac-tool pulumi --analyze-only
   ```

2. **Import Programs:**
   ```bash
   chiral import -s ./pulumi-project/Pulumi.yaml -p aws -o chiral.config.ts
   ```

3. **Cost Compare:**
   ```bash
   chiral cost-compare -c chiral.config.ts
   ```

4. **Deploy Multi-Cloud:**
   ```bash
   chiral compile -c chiral.config.ts -o dist
   # Deploy to all clouds simultaneously
   ```

## Architecture Benefits

### Cost Savings
- **Zero State Management**: No Terraform/Pulumi state costs
- **Multi-Cloud Freedom**: Deploy anywhere, pay for what you use
- **Resource Optimization**: Automated right-sizing recommendations

### Operational Excellence
- **Stateless Generation**: No corruption, locking, or drift issues
- **Native Cloud APIs**: Direct integration, better reliability
- **Unified Interface**: Single tool for all clouds

### Security & Compliance
- **No State Exposure**: Secrets never stored in files
- **Audit Trails**: Native cloud logging and monitoring
- **Compliance Frameworks**: Built-in SOC 2, HIPAA, FedRAMP support

### Developer Experience
- **Intent-Driven**: Focus on business requirements, not cloud specifics
- **Multi-Format Import**: Migrate from any IaC tool
- **Rich Analysis**: Comprehensive migration guidance and cost analysis

## Integration Examples

### CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
name: Multi-Cloud Deploy
on: [push]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install -g @chiral/cli
      - run: chiral validate -c chiral.config.ts --compliance soc2

  cost-analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install -g @chiral/cli
      - run: chiral cost-compare -c chiral.config.ts

  deploy:
    runs-on: ubuntu-latest
    needs: [validate, cost-analyze]
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install -g @chiral/cli
      - run: chiral compile -c chiral.config.ts -o dist
      # Deploy artifacts to respective clouds
```

### Migration Automation
```bash
#!/bin/bash
# migrate-from-terraform.sh

set -e

echo "🚀 Starting Terraform to Chiral Migration"

# Analyze current setup
chiral migrate -s terraform.tfstate -p aws --analyze-only

# Import configuration
chiral import -s terraform.tfstate -p aws -o chiral.config.ts

# Validate configuration
chiral validate -c chiral.config.ts --compliance soc2

# Generate multi-cloud artifacts
chiral compile -c chiral.config.ts -o dist

# Compare costs
chiral cost-compare -c chiral.config.ts

echo "✅ Migration preparation complete!"
echo "Review generated artifacts in ./dist/"
echo "Test deployments in development environment before production"
```

## Troubleshooting

### Common Issues

**State File Corruption:**
```bash
# Use Terraform to get fresh state
terraform state pull > fresh.tfstate
chiral import -s fresh.tfstate -p aws
```

**Pulumi Import Issues:**
```bash
# Ensure Pulumi.yaml is valid
pulumi preview --cwd ./pulumi-project
chiral import -s ./pulumi-project/Pulumi.yaml -p aws
```

**Cost Analysis Fails:**
```bash
# Install required CLI tools
npm install -g infracost
# For Azure: https://github.com/mivano/azure-cost-cli
```

**Validation Errors:**
```bash
# Check configuration syntax
chiral validate -c chiral.config.ts
# Fix reported issues and re-run
```

## Future Roadmap

- **Additional IaC Formats**: CDK, ARM templates, Crossplane
- **State Management**: Native cloud state services integration
- **Advanced Cost Optimization**: AI-powered resource recommendations
- **Compliance Automation**: Automated remediation suggestions
- **Drift Detection**: Continuous configuration drift monitoring

## Contributing

This enhanced Chiral implementation provides a comprehensive solution for multi-cloud infrastructure management with advanced migration capabilities. The architecture emphasizes stateless generation, cost optimization, and operational excellence while maintaining compatibility with existing IaC ecosystems.

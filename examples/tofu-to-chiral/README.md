# OpenTofu to Chiral Conversion Guide

This directory contains an example of converting OpenTofu projects to Chiral pattern.

## Example: opentofu-projects/

- `main`: OpenTofu configuration with hardcoded resources
- `params`: Input parameters for OpenTofu configuration
- `outputs`: Output values from OpenTofu configuration

This example demonstrates how to extract business intent from OpenTofu configuration and refactor it into Chiral pattern.

## Converting OpenTofu to Chiral

The Chiral pattern converts traditional OpenTofu projects into a multi-cloud, intent-driven architecture. Follow these steps:

### Step 1: Analyze Your OpenTofu Configuration
- Review your `` files to identify core resources
- Note hardcoded values (machine types, regions, versions) in resource definitions
- Identify parameter patterns that represent business requirements

### Step 2: Extract Business Intent
- Create `chiral.config.ts` with a `ChiralSystem` object:
  ```typescript
  export const config: ChiralSystem = {
    projectName: 'my-app',
    environment: 'prod',
    networkCidr: '10.0.0.0/16',
    k8s: { version: '1.29', minNodes: 2, maxNodes: 5 },
    postgres: { engineVersion: '15', size: 'large', storageGb: 100 },
    adfs: { size: 'large', windowsVersion: '2022' }
  };
  ```

### Step 3: Map OpenTofu Resources to Chiral
- Convert OpenTofu resources → Chiral adapters
- Extract parameter values into intent properties
- Handle OpenTofu-specific patterns (providers, modules)

### Step 4: Create Chiral Adapters
- Implement AWS adapter in `src/adapters/aws-left.ts`
- Implement Azure adapter in `src/adapters/azure-right.ts`
- Use HardwareMap for cross-cloud sizing consistency

### Step 5: Test Multi-Cloud Generation
- Run `npm run compile` to generate both CloudFormation and Bicep
- Compare outputs with original OpenTofu plan

### Benefits of Conversion
- **Single Source of Truth**: Intent drives both clouds
- **Multi-Cloud Ready**: Automatic generation for all major clouds
- **Business Focus**: Intent abstraction over technical details

### OpenTofu Context

**Background**: Fork of Terraform created after license change controversy
- **License**: MPL 2.0 (permissive) vs Terraform BSL
- **Community**: Growing ecosystem with provider compatibility
- **Syntax**: Compatible with Terraform HCL (mostly)
- **State Management**: Similar challenges to Terraform

### Example Transformation

**Before (OpenTofu)**:
```opentofu
provider "aws" {
  region = "us-west-2"
}

resource "aws_eks_cluster" "main" {
  name     = "my-cluster"
  version  = "1.29"
  role_arn = aws_iam_role.main.arn
}
```

**After (Chiral)**:
```typescript
// Intent-driven configuration
const config: ChiralSystem = {
  projectName: 'my-app',
  k8s: { version: '1.29', minNodes: 2, maxNodes: 5 }
};

// Multi-cloud generation
// AWS: CloudFormation via adapter
// Azure: Bicep via adapter
```

### Why Choose OpenTofu

**Advantages:**
- **Open Source**: MPL 2.0 license (permissive)
- **Community-Driven**: Governance by community
- **Terraform Compatible**: Mostly syntax compatible
- **Multi-Cloud**: Works with same providers as Terraform

**Considerations:**
- **Maturity**: Younger ecosystem than Terraform
- **Provider Support**: May lag behind Terraform
- **Tooling**: Smaller tooling ecosystem

For complex OpenTofu projects, start with core resources and expand iteratively.

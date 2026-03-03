# Terraform to Chiral Conversion Guide

This directory contains an example of converting traditional Terraform configurations to the Chiral pattern.

## Example: terraform-files/

- `main.tf`: Traditional Terraform configuration with hardcoded resources
- `variables.tf`: Input variables for the Terraform configuration
- `outputs.tf`: Output values from the Terraform configuration

This example demonstrates how to extract business intent from Terraform HCL and refactor it into the Chiral pattern.

## Converting Terraform to Chiral

The Chiral pattern converts traditional Terraform projects into a multi-cloud, intent-driven architecture. Follow these steps:

### Step 1: Analyze Your Terraform Configuration
- Review your `.tf` files to identify core resources (VPC, EKS, RDS, etc.)
- Note hardcoded values (instance types, versions, CIDRs) in resource blocks
- Identify variable patterns that represent business requirements

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

### Step 3: Map Terraform Resources to Chiral
- Convert Terraform `aws_eks_cluster` → Chiral EKS adapter
- Convert Terraform `aws_db_instance` → Chiral RDS adapter  
- Convert Terraform `aws_instance` (Windows) → Chiral AD FS adapter
- Extract variable values into intent properties

### Step 4: Create Chiral Adapters
- Implement AWS adapter in `src/adapters/aws-left.ts`
- Implement Azure adapter in `src/adapters/azure-right.ts`
- Use HardwareMap for cloud-specific sizing

### Step 5: Test Multi-Cloud Generation
- Run `npm run compile` to generate both CloudFormation and Bicep
- Compare outputs with original Terraform plan

### Benefits of Conversion
- **Single Source of Truth**: Intent drives both clouds
- **Multi-Cloud Ready**: Automatic Azure generation
- **Business Focus**: Intent abstraction over technical details

### Example Transformation

**Before (Terraform)**:
```hcl
resource "aws_eks_cluster" "main" {
  name     = "my-cluster"
  role_arn = aws_iam_role.main.arn
  version  = "1.29"
  
  vpc_config {
    subnet_ids = [aws_subnet.private.*.id]
  }
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

For complex Terraform projects, start with core resources and expand iteratively.

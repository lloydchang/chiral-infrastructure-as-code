# Pulumi to Chiral Conversion Guide

This directory contains an example of converting Pulumi programs to Chiral pattern.

## Example: pulumi-programs/

- `__main__.py`: Pulumi Python program with hardcoded resources
- `Pulumi.yaml`: Pulumi project configuration
- `requirements.txt`: Python dependencies for Pulumi

This example demonstrates how to extract business intent from Pulumi code and refactor it into Chiral pattern.

## Converting Pulumi to Chiral

The Chiral pattern converts traditional Pulumi projects into a multi-cloud, intent-driven architecture. Follow these steps:

### Step 1: Analyze Your Pulumi Program
- Review your Pulumi code to identify core resources (VPC, EKS, RDS, etc.)
- Note hardcoded values (instance types, versions, CIDRs) in resource definitions
- Identify configuration patterns in `Pulumi.yaml`

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

### Step 3: Map Pulumi Resources to Chiral
- Convert Pulumi `aws.eks.Cluster` → Chiral EKS adapter
- Convert Pulumi `aws.rds.Instance` → Chiral RDS adapter
- Convert Pulumi `aws.ec2.Instance` (Windows) → Chiral AD FS adapter
- Extract configuration values into intent properties

### Step 4: Create Chiral Adapters
- Implement AWS adapter in `src/adapters/aws-left.ts`
- Implement Azure adapter in `src/adapters/azure-right.ts`
- Use HardwareMap for cloud-specific sizing

### Step 5: Test Multi-Cloud Generation
- Run `npm run compile` to generate both CloudFormation and Bicep
- Compare outputs with original Pulumi preview

### Benefits of Conversion
- **Single Source of Truth**: Intent drives both clouds
- **Multi-Cloud Ready**: Automatic Azure generation
- **Language Agnostic**: Chiral works with any Pulumi language

### Example Transformation

**Before (Pulumi Python)**:
```python
import pulumi
import pulumi_aws as aws

# EKS Cluster
eks_cluster = aws.eks.Cluster("my-cluster",
    version="1.29",
    node_group_args=aws.eks.NodeGroupArgs(
        instance_types=["t3.medium"],
        desired_capacity=2,
        max_size=5,
        min_size=1
    )
)

# RDS Database
postgres_db = aws.rds.Instance("my-db",
    engine=aws.rds.Engine.POSTGRES,
    instance_class="db.t3.medium",
    allocated_storage=100,
    engine_version="15.4"
)
```

**After (Chiral)**:
```typescript
// Intent-driven configuration
const config: ChiralSystem = {
  projectName: 'my-app',
  k8s: { version: '1.29', minNodes: 1, maxNodes: 5 },
  postgres: { engineVersion: '15', size: 'medium', storageGb: 100 }
};

// Multi-cloud generation
// AWS: CloudFormation via adapter
// Azure: Bicep via adapter
```

For complex Pulumi projects, start with core resources and expand iteratively. Pulumi's multi-language support means you can apply this pattern to TypeScript, Go, Python, or C# programs.

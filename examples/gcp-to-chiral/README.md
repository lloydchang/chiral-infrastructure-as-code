# GCP to Chiral Conversion Guide

This directory contains an example of converting Google Cloud Platform (GCP) projects to Chiral pattern.

## Example: gcp-projects/

- `main.yaml`: Google Cloud Infrastructure Manager templates
- `parameters.yaml`: Input parameters for Infrastructure Manager
- `outputs.yaml`: Output values from Infrastructure Manager
- `gcloud-deploy.sh`: Shell script for gcloud CLI deployment

This example demonstrates how to extract business intent from GCP Infrastructure Manager and refactor it into Chiral pattern.

## Converting GCP to Chiral

The Chiral pattern converts traditional GCP projects into a multi-cloud, intent-driven architecture. Follow these steps:

### Step 1: Analyze Your GCP Configuration
- Review your Infrastructure Manager YAML templates
- Note hardcoded values (machine types, regions, versions) in resource definitions
- Identify parameter patterns that represent business requirements
- Review gcloud CLI scripts for deployment patterns

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

### Step 3: Map GCP Resources to Chiral
- Convert Infrastructure Manager `compute.v1.instance` → Chiral EKS adapter
- Convert Infrastructure Manager `sql.v1beta4.database` → Chiral RDS adapter
- Convert Infrastructure Manager `compute.v1.instance` (Windows) → Chiral AD FS adapter
- Extract parameter values into intent properties

### Step 4: Create Chiral Adapters
- Implement AWS adapter in `src/adapters/aws-left.ts`
- Implement Azure adapter in `src/adapters/azure-right.ts`
- Add GCP adapter in `src/adapters/gcp-left.ts` (new)
- Use HardwareMap for cross-cloud sizing consistency

### Step 5: Test Multi-Cloud Generation
- Run `npm run compile` to generate CloudFormation, Bicep, and GCP YAML
- Compare outputs with original GCP setup

### Benefits of Conversion
- **Single Source of Truth**: Intent drives AWS, Azure, and GCP
- **Multi-Cloud Ready**: Automatic generation for all three major clouds
- **Business Focus**: Intent abstraction over cloud-specific details

### GCP-Specific Considerations

Google Cloud has unique characteristics:
- **Infrastructure Manager**: Native GCP template system (replacement for deprecated Deployment Manager)
- **GKE**: Google's Kubernetes service with unique networking
- **IAM**: Service accounts and permissions model
- **Global Networking**: VPC-native with global network integration

### Example Transformation

**Before (GCP Infrastructure Manager)**:
```yaml
resources:
- name: my-cluster
  type: container.v1.cluster
  properties:
    name: my-cluster
    location: us-central1
    initialNodeCount: 2
    nodeConfig:
      machineType: e2-medium
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
// GCP: Infrastructure Manager YAML via adapter
```

### GCP Adapter Implementation Notes

Since GCP doesn't have a programming-language CDK equivalent like AWS CDK or Azure Bicep, the Chiral GCP adapter would generate Infrastructure Manager YAML templates, which are GCP's native declarative format.

For complex GCP projects, start with core resources and expand iteratively. Consider using Infrastructure Manager for template-based deployments alongside Terraform.

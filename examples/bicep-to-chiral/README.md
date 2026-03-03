# Bicep to Chiral Conversion Guide

This directory contains an example of converting Bicep projects to Chiral pattern.

## Example: bicep-files/

- `main.bicep`: Traditional Bicep configuration with hardcoded resources
- `params.bicep`: Input parameters for Bicep configuration
- `outputs.bicep`: Output values from Bicep configuration

This example demonstrates how to extract business intent from Bicep HCL and refactor it into Chiral pattern.

## Converting Bicep to Chiral

The Chiral pattern converts traditional Bicep projects into a multi-cloud, intent-driven architecture. Follow these steps:

### Step 1: Analyze Your Bicep Configuration
- Review your `.bicep` files to identify core resources (VNet, AKS, PostgreSQL, etc.)
- Note hardcoded values (VM sizes, SKUs, versions) in resource definitions
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

### Step 3: Map Bicep Resources to Chiral
- Convert Bicep `resource virtualNetwork` → Chiral VPC adapter
- Convert Bicep `resource managedClusters` → Chiral EKS adapter
- Convert Bicep `resource flexibleServers` → Chiral RDS adapter
- Convert Bicep `resource virtualMachines` → Chiral AD FS adapter
- Extract parameter values into intent properties

### Step 4: Create Chiral Adapters
- Implement AWS adapter in `src/adapters/aws-left.ts`
- Implement Azure adapter in `src/adapters/azure-right.ts`
- Use HardwareMap for cross-cloud sizing consistency

### Step 5: Test Multi-Cloud Generation
- Run `npm run compile` to generate both CloudFormation and Bicep
- Compare AWS CloudFormation output with original Bicep

### Benefits of Conversion
- **Single Source of Truth**: Intent drives both clouds
- **AWS Capability**: Automatic CloudFormation generation
- **Business Focus**: Intent abstraction over technical details

### Example Transformation

**Before (Bicep)**:
```bicep
resource virtualNetwork 'Microsoft.Network/virtualNetworks@2023-04-01' = {
  name: 'my-vnet'
  addressSpace: {
    addressPrefixes: ['10.0.0.0/16']
  }
}

resource managedClusters 'Microsoft.ContainerService/managedClusters@2024-01-01' = {
  name: 'my-aks'
  properties: {
    kubernetesVersion: '1.29'
    agentPoolProfiles: [
      {
        count: 2
        vmSize: 'Standard_D2s_v3'
      }
    ]
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
// Azure: Bicep via adapter (improved from original)
```

For complex Bicep projects, start with core resources and expand iteratively.

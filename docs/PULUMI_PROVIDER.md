# Chiral Pulumi Provider Documentation

This document describes the Chiral Pulumi Provider implementation that allows teams to use Chiral's intent-driven infrastructure directly within Pulumi workflows.

## 🎯 Purpose: Pulumi Provider for Chiral

The Chiral Pulumi Provider enables teams to:
- **Use Chiral intent** directly in Pulumi programs
- **Generate multi-cloud resources** from a single Pulumi config
- **Leverage Chiral's hardware mapping** and regional capabilities
- **Maintain Pulumi workflows** while gaining Chiral benefits

## 🚀 Quick Start

### 1. Install Provider
```bash
# Install Chiral Pulumi provider
npm install @chiral/pulumi-provider

# or
pip install chiral-pulumi-provider

# or
go install github.com/chiral-io/pulumi-provider@latest
```

### 2. Configure Pulumi Project
```yaml
# Pulumi.yaml
name: chiral-project
runtime: nodejs
description: Chiral Infrastructure with Pulumi Provider

plugins:
  providers:
    - name: chiral
      path: ./node_modules/@chiral/pulumi-provider
```

### 3. Use in Pulumi Program
```typescript
// index.ts
import * as pulumi from "@pulumi/pulumi";
import * as chiral from "@chiral/pulumi-provider";

// Define Chiral intent
const cluster = new chiral.KubernetesCluster("main", {
  config: {
    projectName: "my-app",
    environment: "dev",
    k8s: {
      version: "1.35",
      minNodes: 1,
      maxNodes: 3,
      size: "small"
    },
    postgres: {
      engineVersion: "18.3",
      size: "small",
      storageGb: 20
    },
    adfs: {
      size: "small",
      windowsVersion: "2022"
    }
  }
});

// Export outputs
export const clusterEndpoint = cluster.clusterEndpoint;
export const databaseConnection = cluster.databaseConnection;
export const adfsEndpoint = cluster.adfsEndpoint;
```

### 4. Deploy with Pulumi
```bash
# Preview and deploy
pulumi preview
pulumi up

# Stack outputs
pulumi stack output
```

## 📋 Provider Features

### Intent-Driven Resources
- **chiral.KubernetesCluster**: Complete Kubernetes cluster with all components
- **chiral.Database**: Managed PostgreSQL with optimized sizing
- **chiral.ActiveDirectory**: Windows AD FS with security hardening
- **chiral.Network**: VPC and networking with best practices

### Multi-Cloud Generation
- **AWS**: Generates CloudFormation templates via CDK
- **Azure**: Generates Bicep templates with ARM deployment
- **GCP**: Generates Terraform for Infrastructure Manager

### Regional Capabilities
- **Hardware Mapping**: Automatic instance type selection per region
- **Service Availability**: Validates service availability in target region
- **Compliance**: Applies regional compliance requirements

## 🔧 Provider Configuration

### Resource Configuration
```typescript
import * as chiral from "@chiral/pulumi-provider";

const cluster = new chiral.KubernetesCluster("main", {
  config: {
    // Required: Project identification
    projectName: "my-app",
    environment: "dev",
    
    // Kubernetes configuration
    k8s: {
      version: "1.35",
      minNodes: 1,
      maxNodes: 5,
      size: "small"  // Maps to optimal instance types
    },
    
    // Database configuration
    postgres: {
      engineVersion: "18.3",
      size: "large",
      storageGb: 100
    },
    
    // Active Directory configuration
    adfs: {
      size: "small",
      windowsVersion: "2022"
    },
    
    // Optional: Regional overrides
    region: {
      aws: "us-east-1",
      azure: "East US",
      gcp: "us-central1"
    },
    
    // Optional: Network configuration
    network: {
      cidr: "10.0.0.0/16",
      subnetCidr: "10.0.1.0/24"
    }
  },
  
  // Optional: Enable cost analysis
  costAnalysis: {
    enabled: true,
    currency: "USD",
    timeframe: "monthly"
  },
  
  // Optional: Compliance framework
  compliance: {
    framework: "soc2",
    dataResidency: "us-east-1",
    encryptionAtRest: true,
    auditLogging: true
  }
});
```

### Provider Options
```typescript
const cluster = new chiral.KubernetesCluster("main", {
  config: chiralConfig,
  
  // Optional: Custom provider settings
  opts: pulumi.ComponentResourceOptions({
    provider: new chiral.Provider("aws", {
      region: "us-east-1",
      enableCostAnalysis: true,
      complianceFramework: "soc2"
    })
  })
});
```

## 📊 Generated Outputs

### Resource Outputs
```typescript
// Access generated resource properties
export const clusterEndpoint = cluster.clusterEndpoint;
export const databaseConnection = cluster.databaseConnection;
export const adfsEndpoint = cluster.adfsEndpoint;

// Access multi-cloud artifacts
export const awsArtifacts = cluster.awsArtifacts;
export const azureArtifacts = cluster.azureArtifacts;
export const gcpArtifacts = cluster.gcpArtifacts;

// Access cost analysis
export const costAnalysis = cluster.costAnalysis;
export const optimizationRecommendations = cluster.optimizationRecommendations;
```

### Multi-Cloud Outputs
```typescript
// AWS-specific outputs
export const awsCloudFormation = cluster.awsArtifacts.cloudFormation;
export const awsCostEstimate = cluster.awsArtifacts.costEstimate;

// Azure-specific outputs
export const azureBicep = cluster.azureArtifacts.bicep;
export const azureCostEstimate = cluster.azureArtifacts.costEstimate;

// GCP-specific outputs
export const gcpTerraform = cluster.gcpArtifacts.terraform;
export const gcpCostEstimate = cluster.gcpArtifacts.costEstimate;
```

## 🔄 Migration Paths

### From Traditional Pulumi
```bash
# 1. Analyze existing Pulumi project
chiral migrate --iac-tool pulumi --source ./Pulumi.yaml

# 2. Generate Chiral provider config
# Replace traditional resources with chiral.* resources

# 3. Deploy with Chiral provider
pulumi up
```

### From Terraform
```bash
# 1. Analyze Terraform setup
chiral migrate --iac-tool terraform --source ./terraform.tfstate

# 2. Generate Pulumi program with Chiral provider
# Convert Terraform resources to chiral.* resources

# 3. Deploy with Pulumi
pulumi up
```

## 🎉 Benefits

### Pulumi Compatibility
- ✅ **Existing Workflows**: Use familiar `pulumi up/preview` commands
- ✅ **Language Support**: Works with TypeScript, Python, Go, C#
- ✅ **State Management**: Leverage existing Pulumi state setup
- ✅ **Team Skills**: Preserve Pulumi expertise and tooling

### Chiral Advantages
- ✅ **Intent-Driven**: Focus on business requirements, not cloud specifics
- ✅ **Multi-Cloud**: Generate AWS, Azure, and GCP from one config
- ✅ **Hardware Optimization**: Automatic optimal instance type selection
- ✅ **Regional Compliance**: Built-in compliance and capability checks

### Cost Optimization
- ✅ **Real-time Pricing**: Integrated cost analysis during planning
- ✅ **Multi-Cloud Comparison**: Compare costs across providers
- ✅ **Optimization Recommendations**: Automated cost optimization suggestions

## 📚 Advanced Usage

### Custom Hardware Mapping
```typescript
const cluster = new chiral.KubernetesCluster("custom", {
  config: {
    projectName: "custom-app",
    
    // Override hardware mapping
    hardwareOverrides: {
      aws: {
        k8s: "m5.large",
        db: "db.m5.large",
        vm: "m5.xlarge"
      },
      azure: {
        k8s: "Standard_D4s_v3",
        db: "Standard_D4s_v3",
        vm: "Standard_D4s_v3"
      },
      gcp: {
        k8s: "n1-standard-2",
        db: "db-custom-2-4096",
        vm: "n1-standard-2"
      }
    }
  }
});
```

### Compliance Frameworks
```typescript
const cluster = new chiral.KubernetesCluster("compliant", {
  config: {
    projectName: "compliant-app",
    
    // Enable compliance checks
    compliance: {
      framework: "soc2",
      dataResidency: "us-east-1",
      encryptionAtRest: true,
      auditLogging: true
    }
  }
});
```

### Cost Analysis Integration
```typescript
const cluster = new chiral.KubernetesCluster("cost-optimized", {
  config: {
    projectName: "cost-optimized",
    
    // Enable cost analysis
    costAnalysis: {
      enabled: true,
      currency: "USD",
      timeframe: "monthly",
      includeRecommendations: true
    }
  }
});
```

## 🔍 Troubleshooting

### Common Issues

**Provider Not Found**
```bash
# Ensure provider is installed
npm list @chiral/pulumi-provider

# Install if missing
npm install @chiral/pulumi-provider
```

**Configuration Validation Errors**
```bash
# Validate configuration before deployment
pulumi preview --diff

# Check provider logs for detailed errors
export PULUMI_CONFIG_PASSPHRASE=your-passphrase
pulumi up --logflow
```

**Resource Generation Failures**
```bash
# Enable debug logging
export PULUMI_DEBUG=true
pulumi up

# Check provider logs for detailed errors
pulumi up --logflow
```

## 📖 Reference

### Provider Schema
- **Resources**: `chiral.KubernetesCluster`, `chiral.Database`, `chiral.ActiveDirectory`
- **Data Sources**: `chiral.HardwareMap`, `chiral.RegionCapabilities`
- **Functions**: `chiral.ValidateConfig`, `chiral.EstimateCosts`

### Configuration Reference
- **ChiralSystem**: Complete intent schema documentation
- **HardwareMap**: Regional hardware mapping details
- **RegionalMetadata**: Service availability and compliance data

This Pulumi provider enables teams to **gradually adopt Chiral patterns** while maintaining their existing Pulumi workflows and expertise.

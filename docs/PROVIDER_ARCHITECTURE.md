# Chiral Provider Architecture Documentation

This document describes the complete provider architecture for Chiral, enabling teams to use Chiral's intent-driven infrastructure within their preferred IaC workflows.

## 🎯 Architecture Overview

Chiral provides **three provider approaches** to meet teams where they are:

1. **Migration Bridges** - Escape traditional IaC state management
2. **Native Providers** - Use Chiral directly in existing workflows  
3. **Hybrid Approaches** - Gradual transition with minimal disruption

## 🌉 Migration Bridge Providers

### Terraform Bridge
**Purpose**: Escape Terraform state management issues
**Target**: Teams with existing Terraform infrastructure
**Approach**: Generate Terraform that delegates state to CloudFormation

```bash
# Generate Terraform bridge
chiral import --terraform-bridge --source ./terraform.tfstate

# Deploy with state delegation
terraform apply terraform-bridge.tf
```

**Benefits**:
- ✅ Eliminates Terraform state corruption
- ✅ Removes lock contention issues
- ✅ Delegates state to CloudFormation
- ✅ Preserves Terraform workflows

### Pulumi Bridge  
**Purpose**: Escape Pulumi state management issues
**Target**: Teams with existing Pulumi infrastructure
**Approach**: Generate Pulumi that delegates state to cloud providers

```bash
# Generate Pulumi bridge
chiral import --pulumi-bridge --source ./Pulumi.yaml

# Deploy with state delegation
pulumi up pulumi-bridge.yaml
```

**Benefits**:
- ✅ Eliminates Pulumi state management overhead
- ✅ Removes backend complexity
- ✅ Delegates state to cloud providers
- ✅ Preserves Pulumi workflows

## 🔧 Native Provider Architecture

### Terraform Provider
**Purpose**: Use Chiral intent directly in Terraform
**Target**: Teams preferring Terraform workflows
**Approach**: Custom Terraform provider with Chiral resources

```bash
# Build and install provider
chiral terraform-provider --build
cp terraform-provider-chiral ~/.terraform.d/plugins/

# Use Chiral resources in Terraform
resource "chiral_kubernetes_cluster" "main" {
  config = { /* Chiral intent */ }
}
```

**Features**:
- ✅ Intent-driven resources in Terraform
- ✅ Automatic multi-cloud generation
- ✅ Regional hardware mapping
- ✅ Built-in cost analysis

### Pulumi Provider
**Purpose**: Use Chiral intent directly in Pulumi
**Target**: Teams preferring Pulumi workflows
**Approach**: Custom Pulumi provider with Chiral resources

```bash
# Install provider
npm install @chiral/pulumi-provider

# Use Chiral resources in Pulumi
import * as chiral from "@chiral/pulumi-provider";

const cluster = new chiral.KubernetesCluster("main", {
  config: { /* Chiral intent */ }
});
```

**Features**:
- ✅ Intent-driven resources in Pulumi
- ✅ Multi-language support (TS, Python, Go, C#)
- ✅ Automatic multi-cloud generation
- ✅ Built-in cost analysis

## 🔄 Hybrid Migration Strategies

### Phase 1: Analysis
```bash
# Analyze existing infrastructure
chiral migrate --iac-tool terraform --analyze-only
chiral migrate --iac-tool pulumi --analyze-only

# Output: Migration readiness assessment
# - Resource count and complexity
# - Migration confidence score
# - Risk assessment
# - Recommended strategy
```

### Phase 2: Bridge Generation
```bash
# Generate migration bridge
chiral import --terraform-bridge --source ./terraform.tfstate
chiral import --pulumi-bridge --source ./Pulumi.yaml

# Output: Hybrid configuration
# - Native cloud artifacts
# - Bridge configuration
# - Migration plan
# - Rollback procedures
```

### Phase 3: Gradual Migration
```bash
# Deploy bridge alongside existing infrastructure
terraform apply terraform-bridge.tf
pulumi up pulumi-bridge.yaml

# Monitor and validate
# - Functional equivalence
# - Performance comparison
# - Cost analysis
# - Security validation
```

### Phase 4: Cutover
```bash
# Switch to pure Chiral
chiral --config chiral.config.ts

# Decommission legacy tools
# - Remove Terraform state files
# - Remove Pulumi state management
# - Update documentation
# - Retrain teams
```

## 📊 Provider Comparison Matrix

| **Feature** | **Terraform Bridge** | **Pulumi Bridge** | **Terraform Provider** | **Pulumi Provider** |
|-------------|---------------------|-------------------|----------------------|-------------------|
| **State Management** | CloudFormation delegation | Cloud provider delegation | Native Terraform | Native Pulumi |
| **Migration Path** | Gradual escape from Terraform | Gradual escape from Pulumi | Direct adoption | Direct adoption |
| **Workflow Preservation** | ✅ Terraform workflows | ✅ Pulumi workflows | ✅ Terraform workflows | ✅ Pulumi workflows |
| **Multi-Cloud Generation** | ✅ Via Chiral adapters | ✅ Via Chiral adapters | ✅ Built-in | ✅ Built-in |
| **Cost Analysis** | ✅ During migration | ✅ During migration | ✅ Built-in | ✅ Built-in |
| **Regional Compliance** | ✅ Via validation | ✅ Via validation | ✅ Built-in | ✅ Built-in |
| **Team Learning Curve** | Low (familiar tools) | Low (familiar tools) | Medium (new provider) | Medium (new provider) |

## 🎯 Provider Selection Guide

### Choose Terraform Bridge When:
- ✅ **Existing Terraform infrastructure** with state management issues
- ✅ **Team expertise** primarily in Terraform
- ✅ **Gradual migration** required for enterprise constraints
- ✅ **Hybrid deployment** needed during transition

### Choose Pulumi Bridge When:
- ✅ **Existing Pulumi infrastructure** with state management overhead
- ✅ **Team expertise** primarily in Pulumi
- ✅ **Multi-language teams** (Python, Go, C#, TypeScript)
- ✅ **Gradual migration** required for enterprise constraints

### Choose Terraform Provider When:
- ✅ **New projects** starting with Chiral patterns
- ✅ **Terraform-centric teams** wanting direct adoption
- ✅ **Standardized workflows** across organization
- ✅ **Minimal learning curve** preferred

### Choose Pulumi Provider When:
- ✅ **New projects** starting with Chiral patterns
- ✅ **Pulumi-centric teams** wanting direct adoption
- ✅ **Multi-language development** teams
- ✅ **Component-based architecture** preferred

## 🚀 Implementation Architecture

### Provider SDK Structure
```
chiral-providers/
├── terraform-provider/
│   ├── main.go              # Provider entrypoint
│   ├── schema.go            # Resource schemas
│   ├── provider.go           # Provider implementation
│   └── resources/
│       ├── cluster.go         # Kubernetes cluster resource
│       ├── database.go        # Database resource
│       └── network.go         # Network resource
├── pulumi-provider/
│   ├── index.ts             # TypeScript provider
│   ├── resources/
│   │   ├── Cluster.ts       # Kubernetes cluster
│   │   ├── Database.ts      # Database
│   │   └── Network.ts       # Network
│   └── languages/
│       ├── python/           # Python bindings
│       ├── go/               # Go bindings
│       └── csharp/            # C# bindings
└── shared/
    ├── intent/              # Chiral intent schemas
    ├── hardware/            # Regional hardware mapping
    ├── validation/          # Configuration validation
    └── cost/               # Cost analysis
```

### Resource Generation Flow
```
Chiral Intent Input
        ↓
Regional Hardware Mapping
        ↓
Multi-Cloud Artifact Generation
        ↓
┌─────────────────┬─────────────────┬─────────────────┐
│  Terraform     │     Pulumi      │   Native       │
│  Bridge         │     Bridge        │   Providers     │
└─────────────────┴─────────────────┴─────────────────┘
        ↓
Cloud-Native Deployment
```

### State Management Comparison
```
Traditional Approach:
┌─────────────────┐    ┌─────────────────┐
│   Terraform    │    │     Pulumi      │
│   State File   │    │   State Backend │
└─────────────────┘    └─────────────────┘
        ↓                    ↓
State Issues:           State Issues:
- Corruption            - Backend Complexity
- Lock Contention       - Provider Costs
- Security Risks        - Sync Issues

Chiral Bridge Approach:
┌─────────────────┐    ┌─────────────────┐
│ CloudFormation  │    │ Cloud Provider   │
│   State       │    │  Native State   │
└─────────────────┘    └─────────────────┘
        ↓                    ↓
Benefits:               Benefits:
- No Corruption         - No Backend Management
- No Lock Issues        - No Provider Costs
- Cloud Security        - Native Reliability
- Zero Additional Cost  - Built-in Compliance
```

## 📚 Migration Documentation

### Complete Migration Guides
- **`examples/terraform-to-chiral/`** - Terraform migration examples
- **`examples/pulumi-to-chiral/`** - Pulumi migration examples
- **`docs/TERRAFORM_PROVIDER.md`** - Terraform provider guide
- **`docs/PULUMI_PROVIDER.md`** - Pulumi provider guide

### Strategy Documents
- **`examples/terraform-bridge/migration-plan.md`** - Terraform migration strategy
- **`examples/pulumi-to-chiral/migration-strategy.md`** - Pulumi migration strategy
- **`docs/MIGRATION.md`** - General migration guidance

### Reference Documentation
- **`docs/PROVIDER_ARCHITECTURE.md`** - This architecture document
- **`src/intent/index.ts`** - Complete intent schema
- **`src/translation/`** - Hardware mapping and translation logic

## 🎯 Success Metrics

### Migration Success Indicators
- ✅ **Zero State Issues**: No state corruption or lock contention
- ✅ **Cost Reduction**: 20%+ reduction in IaC management costs
- ✅ **Team Productivity**: 30%+ improvement in deployment velocity
- ✅ **Multi-Cloud Adoption**: Teams generating 2+ cloud artifacts
- ✅ **Compliance**: Automated compliance validation and reporting

### Provider Adoption Metrics
- ✅ **Workflow Preservation**: Teams maintain existing workflows
- ✅ **Learning Curve**: <2 weeks for basic provider usage
- ✅ **Feature Parity**: 100% of traditional tool features available
- ✅ **Integration**: Seamless integration with existing CI/CD pipelines

This provider architecture enables **enterprise teams to adopt Chiral's stateless infrastructure patterns** regardless of their current IaC tools and workflows, providing **gradual migration paths** that respect organizational constraints while delivering immediate benefits.

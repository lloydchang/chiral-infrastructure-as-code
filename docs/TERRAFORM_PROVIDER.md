# Chiral Terraform Provider Documentation

This document describes the Chiral Terraform Provider implementation that allows teams to use Chiral's intent-driven infrastructure directly within Terraform workflows.

## 🎯 Purpose: Terraform Provider for Chiral

The Chiral Terraform Provider enables teams to:
- **Use Chiral intent** directly in Terraform configurations
- **Generate multi-cloud resources** from a single Terraform config
- **Leverage Chiral's hardware mapping** and regional capabilities
- **Maintain Terraform workflows** while gaining Chiral benefits

## 🚀 Quick Start

### 1. Build the Provider
```bash
# Build the Chiral Terraform provider
chiral terraform-provider --build

# Output: terraform-provider-chiral binary
# Install: cp terraform-provider-chiral ~/.terraform.d/plugins/
```

### 2. Generate Example Configuration
```bash
# Generate example Terraform configuration
chiral terraform-provider --example

# Save as main.tf and run:
terraform init && terraform apply
```

### 3. Use in Your Terraform Project
```hcl
# main.tf
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
      engine_version = "18.3"
      size = "small"
      storage_gb = 20
    }
    adfs = {
      size = "small"
      windows_version = "11 26H2 Build 26300.7877"
    }
  }
}
```

## 📋 Provider Features

### Intent-Driven Resources
- **chiral_kubernetes_cluster**: Complete Kubernetes cluster with all components
- **chiral_database**: Managed PostgreSQL with optimized sizing
- **chiral_active_directory**: Windows AD FS with security hardening
- **chiral_network**: VPC and networking with best practices

### Multi-Cloud Generation
- **AWS**: Generates CloudFormation templates via CDK
- **Azure**: Generates Bicep templates with ARM deployment
- **GCP**: Generates Terraform for Infrastructure Manager

### Regional Capabilities
- **Hardware Mapping**: Automatic instance type selection per region
- **Service Availability**: Validates service availability in target region
- **Compliance**: Applies regional compliance requirements

## 🔧 Provider Configuration

### Provider Block
```hcl
provider "chiral" {
  # Optional: Override default region
  region = "us-east-1"
  
  # Optional: Enable cost analysis
  enable_cost_analysis = true
  
  # Optional: Set compliance framework
  compliance_framework = "soc2"
}
```

### Resource Configuration
```hcl
resource "chiral_kubernetes_cluster" "main" {
  # Required: Project identification
  config = {
    project_name = var.project_name
    environment = var.environment
    
    # Kubernetes configuration
    k8s = {
      version = "1.35"
      min_nodes = 1
      max_nodes = 5
      size = "small"  # Maps to optimal instance types
    }
    
    # Database configuration
    postgres = {
      engine_version = "18.3"
      size = "large"
      storage_gb = 100
    }
    
    # Active Directory configuration
    adfs = {
      size = "small"
      windows_version = "2022"
    }
  }
  
  # Optional: Regional overrides
  region = {
    aws = "us-east-1"
    azure = "East US"
    gcp = "us-central1"
  }
  
  # Optional: Network configuration
  network = {
    cidr = "10.0.0.0/16"
    subnet_cidr = "10.0.1.0/24"
  }
}
```

## 📊 Generated Outputs

### Resource Outputs
```hcl
output "cluster_endpoint" {
  description = "Kubernetes cluster endpoint"
  value = chiral_kubernetes_cluster.main.cluster_endpoint
}

output "database_connection" {
  description = "Database connection string"
  value = chiral_kubernetes_cluster.main.database_connection
}

output "adfs_endpoint" {
  description = "AD FS endpoint"
  value = chiral_kubernetes_cluster.main.adfs_endpoint
}

output "cost_analysis" {
  description = "Cost analysis for generated resources"
  value = chiral_kubernetes_cluster.main.cost_analysis
}
```

### Multi-Cloud Outputs
```hcl
output "aws_artifacts" {
  description = "Generated AWS artifacts"
  value = chiral_kubernetes_cluster.main.aws_artifacts
}

output "azure_artifacts" {
  description = "Generated Azure artifacts"
  value = chiral_kubernetes_cluster.main.azure_artifacts
}

output "gcp_artifacts" {
  description = "Generated GCP artifacts"
  value = chiral_kubernetes_cluster.main.gcp_artifacts
}
```

## 🔄 Migration Paths

### From Traditional Terraform
```bash
# 1. Analyze existing Terraform
chiral migrate --iac-tool terraform --source ./terraform.tfstate

# 2. Generate Chiral provider config
chiral terraform-provider --example > main.tf

# 3. Replace resources gradually
# Replace traditional resources with chiral_* resources
terraform plan
terraform apply
```

### From Pulumi
```bash
# 1. Analyze Pulumi project
chiral migrate --iac-tool pulumi --source ./Pulumi.yaml

# 2. Generate Chiral provider config
chiral terraform-provider --example > main.tf

# 3. Migrate resources
# Replace pulumi_* resources with chiral_* resources
terraform plan
terraform apply
```

## 🎉 Benefits

### Terraform Compatibility
- ✅ **Existing Workflows**: Use familiar `terraform plan/apply` commands
- ✅ **State Management**: Leverage existing Terraform state setup
- ✅ **Team Skills**: Preserve Terraform expertise and tooling
- ✅ **Gradual Migration**: Replace resources incrementally

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
```hcl
resource "chiral_kubernetes_cluster" "custom" {
  config = {
    project_name = "custom-app"
    
    # Override hardware mapping
    hardware_overrides = {
      aws = {
        k8s = "m5.large"
        db = "db.m5.large"
        vm = "m5.xlarge"
      }
      azure = {
        k8s = "Standard_D4s_v3"
        db = "Standard_D4s_v3"
        vm = "Standard_D4s_v3"
      }
      gcp = {
        k8s = "n1-standard-2"
        db = "db-custom-2-4096"
        vm = "n1-standard-2"
      }
    }
  }
}
```

### Compliance Frameworks
```hcl
resource "chiral_kubernetes_cluster" "compliant" {
  config = {
    project_name = "compliant-app"
    
    # Enable compliance checks
    compliance = {
      framework = "soc2"
      data_residency = "us-east-1"
      encryption_at_rest = true
      audit_logging = true
    }
  }
}
```

### Cost Analysis Integration
```hcl
resource "chiral_kubernetes_cluster" "cost_optimized" {
  config = {
    project_name = "cost-optimized"
    
    # Enable cost analysis
    cost_analysis = {
      enabled = true
      currency = "USD"
      timeframe = "monthly"
      include_recommendations = true
    }
  }
}
```

## 🔍 Troubleshooting

### Common Issues

**Provider Not Found**
```bash
# Ensure provider is installed
ls ~/.terraform.d/plugins/

# Install if missing
cp terraform-provider-chiral ~/.terraform.d/plugins/
```

**Region Validation Errors**
```bash
# Check region availability
chiral validate --config main.tf --region us-east-1

# Use supported regions only
terraform plan
```

**Resource Generation Failures**
```bash
# Enable debug logging
export TF_LOG=DEBUG
terraform plan

# Check provider logs for detailed errors
```

## 📖 Reference

### Provider Schema
- **Resources**: `chiral_kubernetes_cluster`, `chiral_database`, `chiral_active_directory`
- **Data Sources**: `chiral_hardware_map`, `chiral_region_capabilities`
- **Functions**: `chiral_validate_config`, `chiral_estimate_costs`

### Configuration Reference
- **ChiralSystem**: Complete intent schema documentation
- **HardwareMap**: Regional hardware mapping details
- **RegionalMetadata**: Service availability and compliance data

This Terraform provider enables teams to **gradually adopt Chiral patterns** while maintaining their existing Terraform workflows and expertise.

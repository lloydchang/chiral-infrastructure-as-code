# Chiral Terraform Provider Example

This example demonstrates how to use Chiral as a Terraform provider to escape Terraform state management while keeping familiar syntax.

## 🎯 **Why Use Chiral Terraform Provider?**

**Traditional Terraform Problems:**
- ❌ State file corruption and lock conflicts
- ❌ Remote state backend complexity
- ❌ Provider lock-in and drift detection issues
- ❌ Hidden costs for state management

**Chiral Solution:**
- ✅ Stateless generation - no .tfstate files
- ✅ Multi-cloud from single configuration
- ✅ Native cloud deployment artifacts
- ✅ Zero state management costs

## 🚀 **Quick Start**

### 1. Install Chiral Provider
```bash
# Install Terraform provider
terraform init

# Or build from source
cd src/adapters/terraform-provider
make install
```

### 2. Configure Infrastructure
```hcl
# main.tf
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

### 3. Generate Multi-Cloud Artifacts
```bash
# Plan deployment
terraform plan

# Generate artifacts (no state files created!)
terraform apply
```

## 📁 **Generated Artifacts**

After `terraform apply`, Chiral generates:

```
chiral-artifacts/
├── aws/
│   ├── cdk-assembly.json
│   └── cloudformation-template.json
├── azure/
│   ├── deployment.bicep
│   └── parameters.json
└── gcp/
    ├── deployment.tf
    └── variables.tf
```

## 🌐 **Multi-Cloud Deployment**

### AWS Deployment
```bash
cd chiral-artifacts/aws
aws cloudformation deploy \
  --template-file cloudformation-template.json \
  --stack-name my-app-stack \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM
```

### Azure Deployment
```bash
cd chiral-artifacts/azure
az deployment group create \
  --resource-group my-rg \
  --template-file deployment.bicep \
  --parameters @parameters.json
```

### GCP Deployment
```bash
cd chiral-artifacts/gcp
terraform init
terraform apply
```

## 💰 **Cost Comparison**

Chiral automatically provides cost comparison:

```bash
terraform output cost_comparison
```

Output:
```json
{
  "aws": "$871.97/month",
  "azure": "$1018.00/month", 
  "gcp": "$972.00/month",
  "cheapest": "AWS",
  "savings": "14.34%"
}
```

## 🔄 **Migration Path**

### From Traditional Terraform
1. **Keep existing .tf files** - no syntax changes needed
2. **Replace provider blocks** with Chiral provider
3. **Gradually migrate** resources one by one
4. **Eliminate state files** completely

### Benefits
- **No learning curve** - same Terraform syntax
- **Gradual migration** - replace modules incrementally  
- **Multi-cloud ready** - single config for all clouds
- **Stateless** - no .tfstate management headaches

## 🛠 **Advanced Configuration**

### Custom Output Directory
```hcl
resource "chiral_kubernetes_cluster" "main" {
  config = {
    # ... other config ...
    output_directory = "./my-artifacts"
  }
}
```

### Environment-Specific Configs
```hcl
# dev.tf
resource "chiral_kubernetes_cluster" "dev" {
  config = {
    project_name = "my-app-dev"
    environment = "dev"
    k8s = { min_nodes = 1, max_nodes = 2 }
  }
}

# prod.tf  
resource "chiral_kubernetes_cluster" "prod" {
  config = {
    project_name = "my-app-prod"
    environment = "prod"
    k8s = { min_nodes = 3, max_nodes = 10 }
  }
}
```

## 📚 **Documentation**

- [Main Chiral Documentation](../../../README.md)
- [Migration Guide](../../../docs/MIGRATION.md)
- [Cost Analysis](../../../docs/CHALLENGES.md)

## 🤝 **Support**

- **Issues**: [GitHub Issues](https://github.com/lloydchang/chiral-infrastructure-as-code/issues)
- **Discussions**: [GitHub Discussions](https://github.com/lloydchang/chiral-infrastructure-as-code/discussions)
- **Examples**: [More Examples](../)

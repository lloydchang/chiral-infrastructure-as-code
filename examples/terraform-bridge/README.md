# Terraform Bridge: Migration Path from Terraform to Chiral

This directory demonstrates how to use Chiral's Terraform Bridge functionality to escape Terraform state management issues while preserving existing Terraform investments.

## 🎯 Purpose: Gradual Migration Strategy

The Terraform Bridge allows teams to:
- **Import existing Terraform** into Chiral intent
- **Generate hybrid deployment** that delegates state to cloud providers
- **Migrate gradually** from stateful Terraform to stateless Chiral
- **Preserve Terraform skills** while adopting Chiral benefits

## 🚀 Quick Start

### 1. Import Your Terraform
```bash
# Import existing Terraform state or HCL
npx chiral import \
  --terraform-state ./terraform.tfstate \
  --provider aws \
  --terraform-bridge

# This generates:
# - chiral.config.ts (intent-based configuration)
# - terraform-bridge.tf (delegates state to CloudFormation)
# - terraform-templates/ (CloudFormation templates)
```

### 2. Deploy Bridge Configuration
```bash
# Deploy the Terraform bridge (uses CloudFormation for state)
cd dist
terraform apply terraform-bridge.tf

# This creates:
# - CloudFormation stacks that manage state natively
# - Terraform resources that delegate to CloudFormation
```

### 3. Generate Native Chiral Artifacts
```bash
# Generate pure Chiral artifacts (no Terraform state)
npx chiral --config chiral.config.ts

# This creates:
# - aws-assembly/ (pure CDK + CloudFormation)
# - azure-deployment.bicep (pure Bicep)
# - gcp-deployment.tf (pure Terraform for GCP IM)
```

## 📋 Migration Strategies

### Strategy A: Greenfield Migration
**Best for**: New projects or complete infrastructure rebuild
**Approach**: Start fresh with Chiral, decommission Terraform
**Timeline**: 2-4 weeks
**Risk**: Low

### Strategy B: Progressive Migration  
**Best for**: Existing production infrastructure
**Approach**: Migrate service by service, maintain parallel during transition
**Timeline**: 2-6 months
**Risk**: Medium

### Strategy C: Parallel Migration
**Best for**: Complex multi-environment setups
**Approach**: Run both systems in parallel, gradually shift workloads
**Timeline**: 3-9 months
**Risk**: High but controllable

## 🔧 Terraform Bridge Configuration

The generated `terraform-bridge.tf` includes:

### Backend Configuration
```hcl
backend "aws" {
  # Delegates state to CloudFormation instead of S3
  alias = "aws"
  region = var.aws_region
}
```

### Delegated Resources
```hcl
# EKS cluster managed by CloudFormation
resource "aws_cloudformation_stack" "eks_cluster" {
  template = file("terraform-templates/eks-template.json")
}

# RDS database managed by CloudFormation  
resource "aws_cloudformation_stack" "rds_database" {
  template = file("terraform-templates/rds-template.json")
}
```

## 🎉 Benefits Achieved

### State Management
- ✅ **No more Terraform state corruption** - CloudFormation handles consistency
- ✅ **No lock contention** - AWS manages locking automatically  
- ✅ **No backend management** - No S3 buckets, encryption, or versioning
- ✅ **Security improvement** - No state files with sensitive data

### Operational Benefits
- ✅ **Gradual migration** - Teams can transition at their own pace
- ✅ **Skill preservation** - Terraform expertise remains valuable
- ✅ **Hybrid deployment** - Can run both systems during transition
- ✅ **Cost optimization** - Eliminate $0.99/resource/month Terraform fees

## 📚 Next Steps

1. **Assess Current Setup**: Use `chiral import` to analyze your Terraform
2. **Choose Strategy**: Select migration approach based on your needs
3. **Generate Bridge**: Use `--terraform-bridge` flag for hybrid deployment
4. **Migrate Gradually**: Transition services from Terraform to Chiral
5. **Decommission Terraform**: Once fully migrated, remove Terraform dependencies

## 🔍 Example Output

When you run the Terraform bridge import:

```bash
🧪 Importing IaC from ./terraform.tfstate for aws
🌉 Terraform bridge mode enabled - will delegate state to cloud provider

✅ Import completed. Config written to: chiral.config.ts
🌉 Terraform Bridge Configuration:
   State management delegated to AWS native services
   Traditional Terraform state issues will be handled by cloud provider
   Use this for gradual migration from Terraform to Chiral pattern

✅ Terraform bridge generated: terraform-bridge.tf
📄 CloudFormation templates: terraform-templates/
🌉 Terraform Bridge Mode:
   State management delegated to AWS native services
   Use for gradual migration from Terraform to Chiral pattern
```

The Terraform Bridge provides the **best of both worlds**:
- **Terraform compatibility** during transition
- **Chiral benefits** for new deployments
- **Gradual escape path** from state management complexity

This approach respects enterprise realities while delivering Chiral's stateless architecture benefits.

## 🔒 Security Best Practices

This project follows open source security standards for handling credentials:

### Variable-Based Configuration
All sensitive values are defined as Terraform variables with `sensitive = true`:
- Database passwords
- Admin usernames and passwords
- API keys and connection strings

### Usage Instructions
1. **Copy example files:**
   ```bash
   cp aws-example.tfvars.example terraform.tfvars
   # OR
   cp azure-example.tfvars.example terraform.tfvars
   ```

2. **Update with real values:**
   ```bash
   # Edit terraform.tfvars with your actual credentials
   db_password = "your-secure-password-here"
   ```

3. **Never commit secrets:**
   - `terraform.tfvars` is in `.gitignore`
   - Only commit `.tfvars.example` files
   - Use environment variables for production

### Production Recommendations
- Use AWS Secrets Manager, Azure Key Vault, or HashiCorp Vault
- Rotate credentials regularly
- Enable IAM authentication where possible
- Use Terraform workspaces for environment separation

### Why This Approach?
Open source projects cannot include real credentials, but need functional examples. This pattern:
- ✅ Provides working demo code
- ✅ Prevents accidental secret commits
- ✅ Follows Terraform best practices
- ✅ Enables secure production usage
